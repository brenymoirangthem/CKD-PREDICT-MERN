# Build from the repo root:  docker build -f server/Dockerfile -t ckd-api .
FROM node:22-slim
RUN apt-get update && apt-get install -y python3 python3-pip && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY ml ./ml
RUN pip3 install --break-system-packages -r ml/requirements.txt
COPY server ./server
WORKDIR /app/server
RUN npm install --omit=dev
ENV PYTHON_BIN=python3
EXPOSE 5000
CMD ["npm", "start"]
