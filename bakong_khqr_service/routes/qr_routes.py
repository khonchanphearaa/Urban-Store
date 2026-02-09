import os
import hashlib
from pathlib import Path
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from pydantic import BaseModel
 
# This instance is already configured to use your Cloudflare Proxy URL.
from bakong_wrapper import khqr_instance as khqr

load_dotenv()
router = APIRouter()

# Setup for Templates (if you are using them)
BASE_DIR = Path(__file__).resolve().parent.parent

class QRRequest(BaseModel):
    order_id: str
    amount: int

@router.post("/create-qr")
def create_qr(payload: QRRequest):
    """
    Generates a KHQR string. This part usually works fine without a proxy,
    but we use the proxy instance to keep everything consistent.
    """
    try:
        qr_string = khqr.create_qr(
            bank_account=os.getenv("BANK_ACCOUNT"),
            phone_number=os.getenv("BANK_PHONE_NUMBER"),
            merchant_name=os.getenv("MERCHANT_NAME"),
            merchant_city=os.getenv("MERCHANT_CITY"),
            amount=int(payload.amount),
            currency="KHR",
            store_label="UrbanStore",
            terminal_label="T1",
            bill_number=payload.order_id,
            static=False
        )
        
        md5_hash = hashlib.md5(qr_string.encode()).hexdigest()
        return {"qr_string": qr_string, "md5": md5_hash}
        
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@router.post("/check-payment")
def check_payment_bakong(payload: dict):
    """
    Checks payment status. 
    Because we use 'khqr_instance', this request will now go:
    FastAPI -> Cloudflare Proxy -> Bakong API
    """
    try:
        qr_string = payload.get("qr_string")
        provided_md5 = payload.get("md5_hash")
        
        # We need at least the hash or the string to check
        if not qr_string and not provided_md5:
            return {"responseCode": -1, "responseMessage": "QR string or MD5 hash required"}
        
        md5_hash = provided_md5 or hashlib.md5(qr_string.encode()).hexdigest()
        
        # 🚀 This call is now redirected to Cloudflare automatically
        is_paid = khqr.check_payment(md5_hash)
        
        if is_paid:
            # If paid, get the full transaction details
            payment_info = khqr.get_payment(md5_hash)
            return {
                "responseCode": 0,
                "responseMessage": "Payment successful",
                "data": payment_info
            }
        else:
            return {
                "responseCode": 1,
                "responseMessage": "Transaction not found or pending",
                "data": None
            }
                
    except Exception as e:
        # Catch errors like 'Unauthorized' or 'Connection Failed' from the proxy
        error_msg = str(e)
        return {
            "responseCode": -1,
            "responseMessage": f"Proxy/Bakong Error: {error_msg}",
            "data": None
        }

@router.get("/debug/proxy-check")  
def debug_proxy():
    return {
        "proxy_url": os.getenv("HONO_PROXY_URL"),
        "has_token": bool(os.getenv("BAKONG_TOKEN")),
        "has_secret": bool(os.getenv("PROXY_SECRET"))
    }