import os
import requests
from bakong_khqr import KHQR
from dotenv import load_dotenv

load_dotenv()

class ProxyKHQR(KHQR):
    def __init__(self, token, proxy_url, secret):
        # Initialize the parent KHQR class
        super().__init__(token)
        
        if not proxy_url:
            raise ValueError(" HONO_PROXY_URL is missing!")
            
        self.proxy_url = proxy_url.rstrip('/')
        self.secret = secret
        # CRITICAL FIX: Explicitly set self.token for the parent methods
        self.token = token 

    def _KHQR__post_request(self, endpoint, payload):
        url = f"{self.proxy_url}{endpoint}"
        
        headers = {
            "Authorization": f"Bearer {self.token}",
            "X-Proxy-Auth": self.secret,
            "Content-Type": "application/json"
        }
        
        print(f" Routing via Proxy: {url}")
        try:
            # Add verify=False to bypass the SSL Underscore error
            response = requests.post(url, json=payload, headers=headers, timeout=15, verify=False)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f" Proxy Request Failed: {str(e)}")
            return {"responseCode": 1, "responseMessage": str(e), "data": None}
khqr_instance = ProxyKHQR(
    token=os.getenv("BAKONG_TOKEN"),
    proxy_url=os.getenv("HONO_PROXY_URL"),
    secret=os.getenv("PROXY_SECRET")
)