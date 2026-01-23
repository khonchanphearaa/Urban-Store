FROM node:20-slim

# Install Python
RUN apt-get update && \
    apt-get install -y python3 python3-pip && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ---------- NODE ----------
COPY production-api/package*.json ./production-api/
RUN cd production-api && npm install --production

# ---------- PYTHON ----------
COPY bakong-python-service/requirements.txt ./bakong-python-service/
RUN pip3 install --no-cache-dir -r bakong-python-service/requirements.txt

# ---------- SOURCE ----------
COPY production-api ./production-api
COPY bakong-python-service ./bakong-python-service

# Render exposes this port
EXPOSE 3000

# Start Python (8000) + Node (3000)
CMD sh -c "\
  uvicorn bakong-python-service.main:app --host 0.0.0.0 --port 8000 & \
  node production-api/server.js \
"
