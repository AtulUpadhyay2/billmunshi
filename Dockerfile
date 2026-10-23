# syntax=docker/dockerfile:1.6
FROM node:20-alpine

ENV NODE_ENV=development
WORKDIR /app

# Install deps first for layer caching
COPY package.json ./
COPY package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# lightningcss, Tailwind's oxide and rollup each ship their compiled core
# as a per-platform optional dependency. `npm ci` against a lockfile
# written on macOS routinely skips the Linux ones (npm/cli#4828), and the
# failure only shows up at first request: "Cannot find module
# '../lightningcss.linux-arm64-musl.node'". Installing them by name is
# deterministic; --no-save keeps the lockfile exactly as checked in.
RUN ARCH="$(node -p "process.arch === 'arm64' ? 'arm64' : 'x64'")" && \
    npm install --no-save --no-package-lock \
      "lightningcss-linux-${ARCH}-musl@$(node -p "require('./node_modules/lightningcss/package.json').version")" \
      "@tailwindcss/oxide-linux-${ARCH}-musl@$(node -p "require('./node_modules/@tailwindcss/oxide/package.json').version")" \
      "@rollup/rollup-linux-${ARCH}-musl@$(node -p "require('./node_modules/rollup/package.json').version")"

# Copy the rest of the frontend
COPY . .

EXPOSE 5173

# Vite dev server — --host so it binds 0.0.0.0 inside the container.
CMD ["npm", "run", "start", "--", "--host", "0.0.0.0", "--port", "5173"]
