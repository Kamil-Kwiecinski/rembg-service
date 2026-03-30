FROM python:3.11-slim

# Zależności systemowe
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Zainstaluj rembg (Python)
RUN pip install rembg[cli] onnxruntime

# Pobierz model przy budowaniu (żeby nie pobierać przy każdym uruchomieniu)
RUN python -c "from rembg import remove; from PIL import Image; import io; img = Image.new('RGB', (10,10)); buf = io.BytesIO(); img.save(buf, 'PNG'); remove(buf.getvalue())" || true

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY index.js ./

EXPOSE 3000

CMD ["node", "index.js"]
