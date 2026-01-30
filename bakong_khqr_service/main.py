from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from routes.qr_routes import router

app = FastAPI(title="Bakong KHQR Service")

# Include router with prefix
app.include_router(router, prefix="", tags=["payments"])

@app.get("/")
def health():
    return {"status": "Bakong service running"}

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Bakong KHQR Service"}
