import fastapi

app = fastapi.FastAPI()


@app.get("/")
def read_root():
    return {"Hello": "World"}
