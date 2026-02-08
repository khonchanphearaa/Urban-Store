import os
import time
import requests
import hashlib
from io import BytesIO
from pathlib import Path
from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse, JSONResponse
from starlette.templating import Jinja2Templates
from dotenv import load_dotenv
from pydantic import BaseModel
from bakong_khqr import KHQR

load_dotenv()
router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

NODE_API = os.getenv("NODE_API_BASE_URL")
QR_EXPIRE_SECONDS = 300
BAKONG_TOKEN = os.getenv("BAKONG_TOKEN")
BAKONG_API_BASE = os.getenv("BAKONG_API_BASE_URL", "https://api-bakong.nbc.gov.kh")
BAKONG_CHECK_PATH = "/v1/check_transaction_by_md5"

# Initialize KHQR instance
khqr = KHQR(BAKONG_TOKEN)


def fetch_payment_info(order_id: str):
    url = f"{NODE_API}/payments/{order_id}/info"
    r = requests.get(url, timeout=5)
    if r.status_code != 200:
        raise Exception("Failed to fetch payment info")
    return r.json()


class QRRequest(BaseModel):
    order_id: str
    amount: int

@router.get("/debug/token-check")
def debug_token():
    """Debug endpoint to check if token is valid"""
    return {
        "token_exists": bool(BAKONG_TOKEN),
        "token_length": len(BAKONG_TOKEN) if BAKONG_TOKEN else 0,
        "token_preview": f"{BAKONG_TOKEN[:20]}...{BAKONG_TOKEN[-10:]}" if BAKONG_TOKEN else "NO TOKEN",
        "is_jwt": BAKONG_TOKEN.startswith("eyJ") if BAKONG_TOKEN else False,
        "message": "If is_jwt=True, this is a JWT token, not a Bakong API token!"
    }


@router.post("/create-qr")
def create_qr(payload: QRRequest):
    """
    Generate KHQR code and return with MD5 hash
    """
    try:
        # Generate QR using bakong-khqr library
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
        
        # Generate MD5 hash from QR string
        md5_hash = hashlib.md5(qr_string.encode()).hexdigest()
        
        print(f"✅ QR Created - Order: {payload.order_id}, MD5: {md5_hash}")
        
        return {
            "qr_string": qr_string,
            "md5": md5_hash
        }
    except Exception as e:
        print(f"❌ Error creating QR: {str(e)}")
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"error": str(e), "error_type": type(e).__name__}
        )


@router.post("/check-payment")
def check_payment_bakong(payload: dict):
    """
    Check payment status using bakong-khqr library
    This uses the official Bakong API to verify payment
    """
    try:
        qr_string = payload.get("qr_string")
        provided_md5 = payload.get("md5_hash")
        
        if not qr_string:
            return {
                "success": False, 
                "responseCode": -1,
                "responseMessage": "QR string required"
            }
        
        # Generate or use provided MD5 hash
        md5_hash = provided_md5 or hashlib.md5(qr_string.encode()).hexdigest()
        
        print(f"🔍 Checking payment - MD5: {md5_hash}")
        print(f"🔑 Token preview: {BAKONG_TOKEN[:20]}...{BAKONG_TOKEN[-10:]}")
        
        # Use bakong-khqr library to check payment
        # This method returns True if payment is found (responseCode=0)
        try:
            is_paid = khqr.check_payment(md5_hash)
            
            if is_paid:
                print(f"✅ Payment FOUND for MD5: {md5_hash}")
                
                # Try to get payment details
                try:
                    payment_info = khqr.get_payment(md5_hash)
                    print(f"💰 Payment Info: {payment_info}")
                    
                    return {
                        "responseCode": 0,
                        "responseMessage": "Payment successful",
                        "data": {
                            "hash": payment_info.get("hash", "confirmed"),
                            "id": payment_info.get("hash", md5_hash),
                            "amount": payment_info.get("amount"),
                            "currency": payment_info.get("currency"),
                            "fromAccountId": payment_info.get("fromAccountId"),
                            "toAccountId": payment_info.get("toAccountId"),
                            "createdDateMs": payment_info.get("createdDateMs"),
                            "acknowledgedDateMs": payment_info.get("acknowledgedDateMs")
                        }
                    }
                except Exception as info_err:
                    print(f"⚠️ Could not get payment details: {info_err}")
                    # Payment is confirmed but we couldn't get details
                    return {
                        "responseCode": 0,
                        "responseMessage": "Payment successful",
                        "data": {
                            "hash": md5_hash,
                            "id": md5_hash
                        }
                    }
            else:
                print(f"⏳ Payment NOT FOUND for MD5: {md5_hash}")
                return {
                    "responseCode": 1,
                    "responseMessage": "Transaction not found or pending",
                    "data": None
                }
                
        except Exception as check_err:
            error_msg = str(check_err).lower()
            
            # Check for unauthorized errors
            if "401" in error_msg or "unauthorized" in error_msg or "forbidden" in error_msg:
                print(f"🔐 UNAUTHORIZED - Invalid or expired token")
                return {
                    "responseCode": 1,
                    "responseMessage": "Unauthorized - Invalid Bakong token",
                    "data": None
                }
            
            # Check for transaction not found (this is normal for pending payments)
            if "not found" in error_msg or "404" in error_msg:
                print(f"⏳ Transaction not found (payment pending)")
                return {
                    "responseCode": 1,
                    "responseMessage": "Transaction not found",
                    "data": None
                }
            
            # Other errors
            print(f"❌ Payment check error: {check_err}")
            import traceback
            traceback.print_exc()
            
            return {
                "responseCode": -1,
                "responseMessage": f"Error checking payment: {str(check_err)}",
                "data": None
            }
        
    except Exception as e:
        print(f"❌ Payment check error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "responseCode": -1,
            "responseMessage": str(e),
            "error_type": type(e).__name__
        }