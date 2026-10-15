from .networks import init_model
import torch.nn as nn
import torchvision.transforms as transforms
import cv2
import os
import numpy as np
import torch
from .utils.transforms import get_affine_transform, transform_logits
from collections import OrderedDict


class HumanParser:
    def __init__(self, model_tpye, model_dir='model'):
        """
            The initialization function for human parsing model.
            Args:
                model: the human parsing model
                model_dir: the directory of the human parsing model
                input_size: the input size for the model
            Returns:
                None
        """
        self.model_dir = os.path.join(model_dir, 'human_parsing',(model_tpye + '.pth'))
        print("Loading human parsing model from {}".format(self.model_dir))
        
        self.num_classes = dataset_settings[model_tpye]['num_classes']
        # self.input_size = dataset_settings[model_tpye]['input_size']
        self.input_size = [512, 512]
        # self.label = dataset_settings[model_tpye]['label']
        # print("Evaluating total class number {} with {}".format(num_classes, label))

        # load the model 
        self.model = init_model('resnet101', num_classes=self.num_classes, pretrained=None)
        state_dict = torch.load(self.model_dir)['state_dict']
        
        new_state_dict = OrderedDict()
        for k, v in state_dict.items():
            name = k[7:]  # remove `module.`
            new_state_dict[name] = v
        self.model.load_state_dict(new_state_dict)
        self.model.cuda()
        self.model.eval()

        self.transform = transforms.Compose([
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.406, 0.456, 0.485], 
                                    std=[0.225, 0.224, 0.229])
        ])

    
    def parse(self, image):
        """
            The inference function for human parsing model.
            Args:
                model: the human parsing model
                image: the input image
                input_size: the input size for the model
            Returns:
                parsing_result: the human parsing result
        """

        with torch.no_grad():
            
            image,meta = self._img_preprocess(image,self.transform)
            
            c = meta['center']
            s = meta['scale']
            w = meta['width']
            h = meta['height']
            image = image[np.newaxis, ...]

            output = self.model(image.cuda())
            upsample = torch.nn.Upsample(size=self.input_size, mode='bilinear', align_corners=True)
            upsample_output = upsample(output[0][-1][0].unsqueeze(0))
            upsample_output = upsample_output.squeeze().permute(1, 2, 0)  # CHW -> HWC

            logits_result = transform_logits(upsample_output.data.cpu().numpy(), c, s, w, h, input_size=self.input_size)
            parsing_result = np.argmax(logits_result, axis=2)# parsing_result_path = os.path.join(args.output_dir, img_name[:-4] + '.png')
            
            
        return np.asarray(parsing_result, dtype=np.uint8)

    
    def _box2cs(self,box):
            x, y, w, h = box[:4]
            return self._xywh2cs(x, y, w, h)


    def _xywh2cs(self,x, y, w, h):
        aspect_ratio = self.input_size[1] * 1.0 / self.input_size[0]

        center = np.zeros((2), dtype=np.float32)
        center[0] = x + w * 0.5
        center[1] = y + h * 0.5
        if w > aspect_ratio * h:
            h = w * 1.0 / aspect_ratio
        elif w < aspect_ratio * h:
            w = h * aspect_ratio
        scale = np.array([w, h], dtype=np.float32)
        return center, scale


    def _img_preprocess(self, img,transform):
        
        h, w, _ = img.shape

        # Get person center and scale
        person_center, s = self._box2cs([0, 0, w - 1, h - 1])
        r = 0
        trans = get_affine_transform(person_center, s, r, self.input_size)
        input = cv2.warpAffine(
            img,
            trans,
            (int(self.input_size[1]), int(self.input_size[0])),
            flags=cv2.INTER_LINEAR,
            borderMode=cv2.BORDER_CONSTANT,
            borderValue=(0, 0, 0))

        input = transform(input)
        meta = {
            'center': person_center,
            'height': h,
            'width': w,
            'scale': s,
            'rotation': r
        }
        return input, meta


dataset_settings = {
    'lip': {
        'input_size': [473, 473],
        'num_classes': 20,
        'label': ['Background', 'Hat', 'Hair', 'Glove', 'Sunglasses', 'Upper-clothes', 'Dress', 'Coat',
                  'Socks', 'Pants', 'Jumpsuits', 'Scarf', 'Skirt', 'Face', 'Left-arm', 'Right-arm',
                  'Left-leg', 'Right-leg', 'Left-shoe', 'Right-shoe']
    },
    'atr': {
        'input_size': [512, 512],
        'num_classes': 18,
        'label': ['Background', 'Hat', 'Hair', 'Sunglasses', 'Upper-clothes', 'Skirt', 'Pants', 'Dress', 'Belt',
                  'Left-shoe', 'Right-shoe', 'Face', 'Left-leg', 'Right-leg', 'Left-arm', 'Right-arm', 'Bag', 'Scarf']
    },
    'pascal': {
        'input_size': [512, 512],
        'num_classes': 7,
        'label': ['Background', 'Head', 'Torso', 'Upper Arms', 'Lower Arms', 'Upper Legs', 'Lower Legs'],
    }
}