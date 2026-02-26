# Bakong-khqr-Service

This service is a dedicated Bakong KHQR payment used to generate Dynamic KHQR codes for e-commerce payments in Cambodia.
It is designed to work together with a main backend (e.g. ecommerce-api) and follows ```NBC (National Bank of Cambodia)``` Bakong KHQR standards.

This documentation read more about [Bakong Open API](https://api-bakong.nbc.gov.kh/document)

## Setup Enviroment 

```bash
BAKONG_TOKEN=eyJhbGciOiJIUz@@@########

MERCHANT_NAME=Urban
MERCHANT_CITY=Phnom Penh ## Default Phnom Penh
BANK_ACCOUNT=khonc@@@#####
BANK_PHONE_NUMBER=855@#####   # Phone number conect with Bakong account app
NODE_API_BASE_URL=https://urban-store-6gj1.onrender.com/api/v1

# Proxy URL for Bakong khqr-Service
# Deployed with Cloudflare Workers
HONO_PROXY_URL=https://bakong-khqr-proxy.khonchanphearaa.workers.dev    
PROXY_SECRET=68d850e51426@@#######
```

## Setup Enviroment project python

This run project local

1. Navigate to your project
- Open the Terminal and use the cd (change directory) 

```bash
cd path/to/your/project_folder
```

2. Create the Virtual Environment
- Run the following command. This creates a new subfolder (commonly named .venv or venv) that contains a self-contained Python installation.

#### For use macOS/Linux:
```bash
python3 -m venv .venv
```

#### For use Window
```bash
python -m venv
```

- Read more for detail info about ```venv``` [Python](https://docs.python.org/3/library/venv.html)

3. Activate the Environment
- To start using this isolated environment, you must "activate" it so your terminal knows to use the local Python version and not the system-wide one. 

```bash
source venv/bin/activate
```

4. Install Dependencies

```bash
pip install fastapi uvicorn requests python-dotenv pydantic
```

5. Run Python bakong-khqr

```bash
uvicorn main:app --host 0.0.0.0 --port 5001
```

**Note when run project again just command ```source .venv/bin/activate``` make sure in ```vue``` active
and runing port ```uvicorn main:app --host 0.0.0.0 --port 5001``` For this port ```5001``` can choice your own.

- Read more setup env ```helper.doc```

