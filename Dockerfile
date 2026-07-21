# syntax=docker/dockerfile:1.6
FROM node:20-alpine

ENV NODE_ENV=development
WORKDIR /app

# Install deps first for layer caching
COPY package.json ./
COPY package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy the rest of the frontend
COPY . .

EXPOSE 5173

# Vite dev server — --host so it binds 0.0.0.0 inside the container.
CMD ["npm", "run", "start", "--", "--host", "0.0.0.0", "--port", "5173"]
