import torch
import torch.nn as nn
import torchvision.models as models

class ClothingClassifier(nn.Module):
    def __init__(self, num_classes, model_type='resnet', num_frozen_resnet_layers=5):
        super(ClothingClassifier, self).__init__()
        self.model_type = model_type

        resnet = models.resnet50(pretrained=True)
        self.resnet_backbone = nn.Sequential(*list(resnet.children())[:-1])
        self.fc = nn.Linear(resnet.fc.in_features, 1024)
        self.classifier = nn.Sequential(
            nn.Linear(1024, 512),
            nn.BatchNorm1d(512),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(512, 256),
            nn.BatchNorm1d(256),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(256, 128),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(128, num_classes)
        )
        for param in list(self.resnet_backbone.parameters())[:-num_frozen_resnet_layers]:
            param.requires_grad = False


    def forward(self, x):
        x = self.resnet_backbone(x)
        x = x.view(x.size(0), -1)
        x = self.fc(x)
        x = self.classifier(x)
        return x

    def predict(self, image, transform, device='cpu'):
        selected_labels = ["Blouse", "Cardigan", "Jacket", "Sweater", "Tank", "Tee", "Top", 
                            "Jeans", "Shorts", "Skirts", "Dress"]
        label_mapping = {new: name for new, name in enumerate(selected_labels)}

        self.eval()
        image_transformed = transform(image).unsqueeze(0).to(device)
        with torch.no_grad():
            preds = self(image_transformed)
            predicted = torch.argmax(preds, dim=1).item()
        garment_class = "A" if predicted < 7 else ("B" if predicted < 10 else "C")
        return label_mapping[predicted], garment_class