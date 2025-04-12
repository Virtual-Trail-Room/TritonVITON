# classifier/predict.py
#!/usr/bin/env python3
import argparse
import sys
import os
import torch
from torchvision import transforms
from PIL import Image
from classifier.classifier import ClothingClassifier  # Ensure __init__.py exists in the classifier folder

def main():
    parser = argparse.ArgumentParser(
        description="Predict clothing category using the ClothingClassifier."
    )
    parser.add_argument("image_path", type=str, help="Path to the input image file.")
    args = parser.parse_args()

    selected_labels = [
        "Blouse", "Cardigan", "Jacket", "Sweater", "Tank",
        "Tee", "Top", "Jeans", "Shorts", "Skirts", "Dress"
    ]
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    NUM_CLASSES = 11
    FROZEN_LAYERS = 60
    model = ClothingClassifier(num_classes=NUM_CLASSES, num_frozen_resnet_layers=FROZEN_LAYERS, model_type='resnet').to(device)

    # Set the model_path using an absolute path so we know where it’s looking:
    model_path = "clothing_classifier2-0-1.pth"
    abs_model_path = os.path.abspath(model_path)
    print("Loading model weights from:", abs_model_path)  # Debug print

    try:
        state_dict = torch.load(abs_model_path, map_location=device)
        model.load_state_dict(state_dict)
    except Exception as e:
        print(f"Error loading model weights: {e}", file=sys.stderr)
        sys.exit(1)

    model.eval()
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                             std=[0.229, 0.224, 0.225]),
    ])

    try:
        image = Image.open(args.image_path).convert("RGB")
    except Exception as e:
        print(f"Error opening image: {e}", file=sys.stderr)
        sys.exit(1)

    try:
        predicted_label, garment_class = model.predict(image, transform, device)
    except Exception as e:
        print(f"Error during prediction: {e}", file=sys.stderr)
        sys.exit(1)
    print(f"Predicted label: {predicted_label}")
    print(f"Garment class: {garment_class}")

if __name__ == "__main__":
    main()
