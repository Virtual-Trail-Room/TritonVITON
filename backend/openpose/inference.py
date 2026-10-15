import cv2
import numpy as np
import torch
from .models.with_mobilenet import PoseEstimationWithMobileNet
from .modules.keypoints import extract_keypoints, group_keypoints
from .modules.load_state import load_state
from .demo import infer_fast
from PIL import Image
from PIL import ImageDraw
from torchvision import transforms



def get_heatmap(pose, radius=5):
    point_num = pose.shape[0]
    fine_height, fine_width, = 256, 192
    pose_map = torch.zeros(point_num, fine_height, fine_width)
    
    r = radius
    im_pose = Image.new('L', (fine_width, fine_height))
    
    pose_draw = ImageDraw.Draw(im_pose)
    for i in range(point_num):
        one_map = Image.new('L', (fine_width, fine_height))
        draw = ImageDraw.Draw(one_map)
        pointx = pose[i,0]
        pointy = pose[i,1]
        if pointx > 1 and pointy > 1:
            draw.rectangle((pointx-r, pointy-r, pointx+r, pointy+r), 'white', 'white')
            pose_draw.rectangle((pointx-r, pointy-r, pointx+r, pointy+r), 'white', 'white')
        
        one_map = transforms.ToTensor()(one_map)
        one_map = one_map.unsqueeze(0)
        
        # one_map = self.transform(one_map)
        pose_map[i] = one_map[0]
    
    im_pose = transforms.ToTensor()(im_pose)   

    return pose_map, im_pose


def visualize(image):
    
    if len(image.shape) == 4:
        image = image.squeeze(0).cpu().detach().permute(1,2,0).numpy()
    elif len(image.shape) == 3:
        image = image.cpu().detach().permute(1,2,0).numpy()

    cv2.imshow("debug_image.jpg", image)
    cv2.imwrite("debug_image.jpg", image)
    cv2.waitKey(0)
    # plt.imshow(image)
    # plt.title('Try-on result')
    # plt.axis('off')  # Hide axis ticks
    # plt.show()



def get_keypoints(net,img):
    

    stride = 8
    upsample_ratio = 4
    height_size = 256
    num_keypoints = 18
    heatmaps, pafs, scale, pad = infer_fast(net, img, height_size, stride, upsample_ratio, False)
    
    total_keypoints_num = 0
    all_keypoints_by_type = []
    for kpt_idx in range(num_keypoints):  # 19th for bg
        total_keypoints_num += extract_keypoints(heatmaps[:, :, kpt_idx], all_keypoints_by_type, total_keypoints_num)

    pose_entries, all_keypoints = group_keypoints(all_keypoints_by_type, pafs)
    for kpt_id in range(all_keypoints.shape[0]):
        all_keypoints[kpt_id, 0] = (all_keypoints[kpt_id, 0] * stride / upsample_ratio - pad[1]) / scale
        all_keypoints[kpt_id, 1] = (all_keypoints[kpt_id, 1] * stride / upsample_ratio - pad[0]) / scale

    # current_poses = []
    for n in range(len(pose_entries)):
        if len(pose_entries[n]) == 0:
            continue
        pose_keypoints = np.ones((num_keypoints, 2), dtype=np.int32) * -1

        for kpt_id in range(num_keypoints):
            if pose_entries[n][kpt_id] != -1.0:  # keypoint was found
                pose_keypoints[kpt_id, 0] = int(all_keypoints[int(pose_entries[n][kpt_id]), 0])
                pose_keypoints[kpt_id, 1] = int(all_keypoints[int(pose_entries[n][kpt_id]), 1])


    # If no person was detected pose_keypoints never got defined.
    # Return an all-negative tensor so the caller can skip the frame.
    if 'pose_keypoints' not in locals():
        pose_keypoints = np.full((num_keypoints, 2), -1, dtype=np.int32)

    return pose_keypoints
   
   
if __name__ == "__main__":
    # Load the model and pre-trained weights
    DEVICE = 'cuda' if torch.cuda.is_available() else 'cpu'
    net = PoseEstimationWithMobileNet()
    net = net.eval()
    net = net.to(DEVICE)
    checkpoint_path = 'checkpoint_iter_370000.pth' 
    checkpoint = torch.load(checkpoint_path)
    load_state(net, checkpoint)
    # Load the image
    img = cv2.imread('3.jpg')
    # infer the image
    keypoints = get_keypoints(net,img)


     # plot keypoints
    _, im_pose = get_heatmap(keypoints)

    visualize(im_pose)
