import pdb
import numpy as np

from PIL import Image
from PIL import ImageDraw
import cv2
import os
import argparse
import torch
import torch.nn as nn
import matplotlib.pyplot as plt
import torch.nn.functional as F
import torchvision.transforms as transforms
from ultralytics import YOLO

def visualize(images, name = None, save_path = None):
    """
    Visualize a list of PyTorch image tensors in the same window.

    Args:
        images (list of torch.Tensor): List of tensors with shape [C, H, W] or [1, C, H, W]
    """
    num_images = len(images)
    cols = min(4, num_images)
    rows = (num_images + cols - 1) // cols

    plt.figure(figsize=(4 * cols, 4 * rows))
    
    for idx, image in enumerate(images):
        if not isinstance(image, torch.Tensor):
            image = transforms.ToTensor()(image)
        if image.dim() == 4:
            image = image.squeeze(0)
        image = image.cpu().detach().permute(1, 2, 0).numpy()

        plt.subplot(rows, cols, idx + 1)
        plt.imshow(image)
        plt.title(f"Image {idx+1}")
        plt.axis("off")
    
    plt.tight_layout()
    if save_path:
        plt.savefig(save_path, bbox_inches='tight')
    plt.show()



def preprocess_im(img,parsed_img,opt): # img: (H, W, 3) parsed_img: (H, W)
    """
        Preprocess the image and parsed image to get the head image and body mask.
        Args:
            img (np.array): Input image of shape (H, W, 3).
            parsed_img (np.array): Parsed image of shape (H, W).
            opt: Options containing fine_width and fine_height.
        Returns:
            im_h (torch.Tensor): Preprocessed head image of shape (3, fine_height, fine_width).
            body_mask (torch.Tensor): Preprocessed body mask of shape (1, fine_height, fine_width).
    """
    # # this case
    body_parts = np.unique(parsed_img) 
    parse_head = ((parsed_img == 13) + ((parsed_img == 2))).astype(np.float32)
    body_mask = (parsed_img != 0).astype(np.float32) # (H, W, 1)
    
    # shape downsample
    parse_shape = Image.fromarray((body_mask*255).astype(np.uint8))
    parse_shape = parse_shape.resize((opt.fine_width, opt.fine_height), Image.BILINEAR)
    body_mask  = transforms.ToTensor()(parse_shape)
  
    phead = torch.from_numpy(parse_head) # [0,1]
    img = transforms.ToTensor()(img)
    im_h = img * phead - (1 - phead) # [-1,1], fill 0 for other parts

    return im_h, body_mask 
 

def crop(image, keypoints, target_aspect=192/256):
    """
    Crop the image (H, W, C) to match the target aspect ratio before resizing.
    """
    h, w, _ = image.shape
    if h == 256 and w == 192:
        return image
    
    # crop image
    knee_line = np.round((keypoints[9,1] + keypoints[12,1])/2 - h/ 20).astype(int) # the knees line - h/20
    head_line = max((min(keypoints[14,1], keypoints[15,1]) - h / 15).astype(int), 0)# the eyes line - h/15
    image = image[head_line:knee_line, :]
    h, w, _ = image.shape
    # resize
    current_aspect = w / h

    if current_aspect > target_aspect:
        # Too wide — crop width
        new_w = int(h * target_aspect)
        start_x = (w - new_w) // 2
        cropped = image[:, start_x:start_x+new_w]
    else:
        # Too tall — crop height
        new_h = int(w / target_aspect)
        # start_y = (h - new_h) // 2
        start_y = head_line
        cropped = image[start_y:start_y+new_h, :]

    # visualize([cropped])

    # resize to target size
    cropped = cv2.resize(cropped, (192,256))

    return cropped








def get_heatmap(pose,radius=5):
    """
    Generate a heatmap from the pose keypoints. heatmap shape: (256,192,25)
    Args:
        pose (torch.Tensor): Pose keypoints of shape (N, 2) where N is the number of keypoints.
        radius (int): Radius for the heatmap points.
    Returns:
        pose_map (torch.Tensor): Heatmap of shape (N, 256, 192).
        im_pose (torch.Tensor): Image representation of the heatmap.
    """
    point_num = pose.shape[0]
    fine_height, fine_width, = 256, 192
    pose_map = torch.zeros(point_num, fine_height, fine_width)
    
    im_pose = Image.new('L', (fine_width, fine_height))
    pose_draw = ImageDraw.Draw(im_pose)
    for i in range(point_num):
        one_map = Image.new('L', (fine_width, fine_height))
        draw = ImageDraw.Draw(one_map)
        pointx = pose[i,0]
        pointy = pose[i,1]
        if pointx > 1 and pointy > 1:
            draw.rectangle((pointx-radius, pointy-radius, pointx+radius, pointy+radius), 'white', 'white')
            pose_draw.rectangle((pointx-radius, pointy-radius, pointx+radius, pointy+radius), 'white', 'white')
        
        one_map = transforms.ToTensor()(one_map)
        one_map = one_map.unsqueeze(0)
 
        pose_map[i] = one_map[0]

    im_pose = transforms.ToTensor()(im_pose)   

    return pose_map, im_pose
    


def improve_image_quality(image):
        """
        Enhance image quality by improving contrast and lighting
        
        Args:
            image (np.array): Input image
        
        Returns:
            np.array: Preprocessed image
        """
        # Convert to LAB color space for better contrast enhancement
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        
        # Split the LAB image to different channels
        l, a, b = cv2.split(lab)
        
        # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
        cl = clahe.apply(l)
        
        # Merge the CLAHE enhanced L-channel with the a and b channel
        limg = cv2.merge((cl,a,b))
        
        # Convert image from LAB Color model to BGR color space
        enhanced = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
        
        # Additional contrast adjustment
        alpha = 1.2  # Contrast control (1.0-3.0)
        beta = 10    # Brightness control (0-100)
        adjusted = cv2.convertScaleAbs(enhanced, alpha=alpha, beta=beta)
        
        return adjusted


    




# def clean_up(parse_result, frame):
#     """
#         Clean up the image by removing the background
#     """
#     mask = parse_result.masks.data[0].cpu().numpy()  # Take first detected mask
#     mask = cv2.resize(mask, (frame.shape[1], frame.shape[0]))  # Resize to frame size
#     mask = (mask > 0.5).astype(np.uint8)  # Convert to binary mask
    
#     # Expand to 3 channels
#     mask = np.stack([mask] * 3, axis=-1)

#     # Apply mask to extract foreground
#     foreground = frame * mask  # Keeps only the segmented object

#     # Create a solid color background (change [255, 255, 255] to any color)
#     background = np.full_like(frame, [255, 255, 255], dtype=np.uint8)

#     # Combine foreground and background
#     output_frame = foreground + (background * (1 - mask))    
#     return output_frame                



def png2jpg(input_im):
    """
    conver .png to .jpg and save in the same directory
    """
    # Load the input image
    im = Image.open(input_im).convert('RGB')
    
    # Save the image with a new name
    output_path = os.path.splitext(input_im)[0] + '.jpg'
    im.save(output_path, 'JPEG')
    
    print(f"Converted {input_im} to {output_path}")



color_map = np.array([
    [0, 0, 0],        # 0 - black
    [255, 0, 0],      # 1 - red
    [0, 255, 0],      # 2 - green
    [0, 0, 255],      # 3 - blue
    [255, 255, 0],    # 4 - yellow
    [255, 0, 255],    # 5 - magenta
    [0, 255, 255],    # 6 - cyan
    [128, 128, 128],  # 7 - gray
    [255, 165, 0],    # 8 - orange
    [128, 0, 128],    # 9 - purple
    [0, 128, 0],      # 10 - dark green
    [128, 128, 0],    # 11 - olive
    [0, 0, 128],      # 12 - navy
    [128, 0, 0],      # 13 - maroon
    [0, 128, 128],    # 14 - teal
    [192, 192, 192]   # 15 - light gray
], dtype=np.uint8)
