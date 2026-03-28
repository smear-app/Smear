import backend.embeddings as embeddings

app = embeddings.App("image-embedding-gen")

image = (
    embeddings.Image.debian_slim()
    .pip_install("torch", "transformers", "Pillow", "requests", "numpy", "fastapi[standard]")
    .run_commands(
        "python -c \"from transformers import CLIPModel, CLIPProcessor; "
        "CLIPModel.from_pretrained('openai/clip-vit-base-patch32'); "
        "CLIPProcessor.from_pretrained('openai/clip-vit-base-patch32')\""
    )
)

@app.function(image=image)
def embed_image(image_url: str) -> list[float]:
    from transformers import CLIPModel, CLIPProcessor
    from PIL import Image
    import requests, torch, io

    model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
    processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
    model.eval()

    resp = requests.get(image_url, timeout=10)
    image = Image.open(io.BytesIO(resp.content)).convert("RGB")

    inputs = processor(images=image, return_tensors="pt")
    with torch.no_grad():
        features = model.get_image_features(**inputs)
        features = features / features.norm(dim=-1, keepdim=True)

    return features[0].tolist()

@app.function(image=image)
@embeddings.fastapi_endpoint(method="POST")
def embed_endpoint(request: dict) -> dict:
    image_url = request.get("image_url")
    if not image_url:
        return {"error": "image_url required"}
    embedding = embed_image.local(image_url)
    return {"embedding": embedding, "dim": len(embedding)}