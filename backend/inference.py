#!/usr/bin/env python3
# backend/inference.py
# -----------------------------------------------------------
# Real-time, image-batch and video-batch VITON pipeline
# -----------------------------------------------------------

# REsolves the import path for backend modules
import sys, pathlib
THIS_DIR = pathlib.Path(__file__).resolve().parent           # …/backend
if str(THIS_DIR) not in sys.path:
    sys.path.insert(0, str(THIS_DIR))                        # add once
# ────────────────────────────────────────────────────────────

import argparse, os, time, cv2, torch, numpy as np
from PIL import Image
import torchvision.transforms as transforms
import torch.nn as nn
import torch.nn.functional as F
from tqdm import tqdm

# ─── project modules ───────────────────────────────────────
from TryOnNets          import GMM, UnetGenerator, load_checkpoint
from openpose.inference import get_keypoints, PoseEstimationWithMobileNet, load_state
from humanParser        import HumanParser
from ultralytics        import YOLO
from utils              import get_heatmap, preprocess_im, visualize, crop
# -----------------------------------------------------------

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"


# ────────────────────────────────────────────────────────────
# CLI
# ────────────────────────────────────────────────────────────
def get_opt(argv: list[str] | None = None):
    p = argparse.ArgumentParser()
    p.add_argument("--hp_model",   default="lip")
    p.add_argument("--models_dir", default="models")

    p.add_argument("--mode",       default="image",
                   choices=["image", "video", "real_time"])
    p.add_argument("--output_dir", default="data/output")
    p.add_argument("--input_dir",  default="data/input")
    p.add_argument("--person",     default="2")   # filenames, not used in real_time
    p.add_argument("--cloth",      default="5")

    opt = p.parse_args(argv)
    opt.grid_size   = 5
    opt.radius      = 5
    opt.fine_width  = 192
    opt.fine_height = 256
    return opt


# ────────────────────────────────────────────────────────────
# Try-On core
# ────────────────────────────────────────────────────────────
class VirtualTryon:
    """Low-level VITON forward pass (no I/O)."""
    def __init__(self, opt):
        self.opt = opt

        self.parser   = HumanParser(model_tpye=opt.hp_model,
                                    model_dir=opt.models_dir)
        self.pe_model = PoseEstimationWithMobileNet()
        self.gmm      = GMM(opt)
        self.tom      = UnetGenerator(25, 4, 6, ngf=64,
                                      norm_layer=nn.InstanceNorm2d)

        self.clean_up_model = YOLO(f"{opt.models_dir}/yolo11n-seg.pt").to(DEVICE)

        # load weights
        load_state(self.pe_model,
                   torch.load(os.path.join(opt.models_dir,
                                           "pose_estimation",
                                           "checkpoint_iter_370000.pth")))
        load_checkpoint(self.gmm,
                        os.path.join(opt.models_dir, "tryon", "gmm_final.pth"))
        load_checkpoint(self.tom,
                        os.path.join(opt.models_dir, "tryon", "tom_final.pth"))

        self.pe_model.eval().to(DEVICE)
        self.gmm.eval().to(DEVICE)
        self.tom.eval().to(DEVICE)

    # ── helper ──────────────────────────────────────────────
    def load_cloth(self):
        path = os.path.join(self.opt.input_dir,
                            "cloth", f"{self.opt.cloth}.jpg")
        cloth = np.array(Image.open(path))
        self.cloth = transforms.ToTensor()(cloth).unsqueeze(0).to(DEVICE)

    # ── one frame  →  one try-on result ─────────────────────
    @torch.no_grad()
    def wrap(self, person_rgb: np.ndarray) -> np.ndarray:
        """person_rgb: uint8 (H,W,3) RGB → returns uint8 (256,192,3) RGB."""
        keypoints1 = get_keypoints(self.pe_model, person_rgb)
        if (keypoints1 < 0).all():        # nothing detected
            return person_rgb

        person = crop(person_rgb, keypoints1, target_aspect=192/256)

        # run pose again (on cropped)
        keypoints = get_keypoints(self.pe_model, person)
        parsed    = self.parser.parse(person)

        heatmap, _   = get_heatmap(keypoints, self.opt.radius)
        heatmap      = heatmap[:18]       # keep joints 0-17

        face, bm1    = preprocess_im(person, parsed, self.opt)
        bm2          = self._body_mask(person, bm1)
        agonistic    = torch.cat((bm2, face, heatmap), 0).unsqueeze(0).to(DEVICE)

        grid, _      = self.gmm(agonistic, self.cloth)
        warped_cloth = F.grid_sample(self.cloth, grid, padding_mode="border")

        pr, mc       = torch.split(self.tom(torch.cat([agonistic, warped_cloth], 1)), 3, 1)
        pr, mc       = torch.tanh(pr), torch.sigmoid(mc)
        out          = warped_cloth*mc + pr*(1-mc)

        out_img = (out[0].permute(1,2,0).cpu().numpy()*255).clip(0,255).astype(np.uint8)
        return out_img

    # ── yolo v11 body mask (fallback) ───────────────────────
    def _body_mask(self, frame, fallback):
        res = self.clean_up_model.predict(frame, conf=0.7)
        if res[0].masks is None: return fallback
        mask = res[0].masks.data[0].cpu().numpy()
        mask = (cv2.resize(mask, (frame.shape[1], frame.shape[0])) > .5).astype(np.uint8)
        im   = Image.fromarray(mask*255).resize((self.opt.fine_width,
                                                 self.opt.fine_height))
        return transforms.ToTensor()(im)


# ────────────────────────────────────────────────────────────
# Thin server wrapper (one instance → many frames)
# ────────────────────────────────────────────────────────────
class TryOnServer:
    def __init__(self, opt):
        self.engine = VirtualTryon(opt)
        self.engine.load_cloth()

    def process(self, frame_rgb: np.ndarray) -> np.ndarray:
        """Fast single-frame call; keeps nets on GPU."""
        return self.engine.wrap(frame_rgb)


# ────────────────────────────────────────────────────────────
# Demo / entry-point
# ────────────────────────────────────────────────────────────
if __name__ == "__main__":
    opt = get_opt()

    # ——— real-time cam feed ——————————————————————————————
    if opt.mode == "real_time":
        srv = TryOnServer(opt)
        print("🚀  Real-time try-on - press Esc to quit")
        cap = cv2.VideoCapture(0)
        while True:
            ok, frame_bgr = cap.read()
            if not ok: break
            frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
            out_rgb   = srv.process(frame_rgb)
            cv2.imshow("TryOn", cv2.cvtColor(out_rgb, cv2.COLOR_RGB2BGR))
            if cv2.waitKey(1) == 27: break
        cap.release()
        cv2.destroyAllWindows()
        quit()

    # ——— still-image & pre-recorded video ————————————————
    vt = VirtualTryon(opt)
    vt.load_cloth()
    os.makedirs(opt.output_dir, exist_ok=True)

    if opt.mode == "image":
        src = os.path.join(opt.input_dir, "image", f"{opt.person}.jpg")
        dst = os.path.join(opt.output_dir,
                           f"p{opt.person}_c{opt.cloth}_output.jpg")
        img = np.array(Image.open(src))
        out = vt.wrap(img)
        cv2.imwrite(dst, cv2.cvtColor(out, cv2.COLOR_RGB2BGR))
        print("saved →", dst)

    elif opt.mode == "video":
        src = os.path.join(opt.input_dir, "video", f"{opt.person}.mp4")
        dst = os.path.join(opt.output_dir,
                           f"p{opt.person}_c{opt.cloth}_output.mp4")
        cap   = cv2.VideoCapture(src)
        fps   = cap.get(cv2.CAP_PROP_FPS)
        four  = cv2.VideoWriter_fourcc(*"mp4v")
        outVW = cv2.VideoWriter(dst, four, fps,
                                (opt.fine_width, opt.fine_height))
        N = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        for _ in tqdm(range(N), desc="Processing video"):
            ok, f = cap.read()
            if not ok: break
            f = cv2.cvtColor(f, cv2.COLOR_BGR2RGB)
            res = vt.wrap(f)
            outVW.write(cv2.cvtColor(res, cv2.COLOR_RGB2BGR))
        cap.release(); outVW.release()
        print("saved →", dst)
