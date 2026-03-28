import modal

app = modal.App("image-embedding-gen")

image = (
    modal.Image.debian_slim()
    .pip_install("torch", "transformers", "Pillow", "requests", "numpy", "fastapi[standard]")
    .run_commands(
        "python -c \"from transformers import CLIPModel, CLIPProcessor; "
        "CLIPModel.from_pretrained('openai/clip-vit-base-patch32'); "
        "CLIPProcessor.from_pretrained('openai/clip-vit-base-patch32')\""
    )
)


@app.cls(image=image)
class Embedder:
    @modal.enter()
    def load_model(self):
        from transformers import CLIPModel, CLIPProcessor
        self.model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        self.processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        self.model.eval()

    @modal.fastapi_endpoint(method="POST")
    def embed(self, request: dict) -> dict:
        from PIL import Image
        import requests, torch, io

        image_url = request.get("image_url")
        if not image_url:
            return {"error": "image_url required"}

        resp = requests.get(image_url, timeout=10)
        resp.raise_for_status()
        image = Image.open(io.BytesIO(resp.content)).convert("RGB")

        inputs = self.processor(images=image, return_tensors="pt")
        with torch.no_grad():
            features = self.model.get_image_features(**inputs)
            features = features / features.norm(dim=-1, keepdim=True)

        return {"embedding": features[0].tolist(), "dim": features.shape[-1]}
