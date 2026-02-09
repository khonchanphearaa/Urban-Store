import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from routes.qr_routes import router

app = FastAPI(title="Bakong KHQR Service")

# Include router
app.include_router(router, prefix="", tags=["payments"])

@app.on_event("startup")
def startup_event():
    proxy_url = os.getenv("HONO_PROXY_URL")
    print(f"🚀 Service starting...")
    print(f"🔗 Proxy Target: {proxy_url if proxy_url else 'NOT SET'}")

@app.get("/")
def health():
    return {"status": "Bakong service running"}

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Bakong KHQR Service"}