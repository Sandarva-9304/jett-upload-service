# ---------- Build Stage ----------
FROM node:20-slim AS builder

# Set working directory
WORKDIR /app

# Install build tools (git for simple-git, typescript build)
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json first (better caching)
COPY package*.json tsconfig.json ./

# Install all deps (including devDependencies for build)
RUN npm install

# Copy source code
COPY src ./src

# Build TypeScript -> dist
RUN npm run build

# ---------- Runtime Stage ----------
FROM node:20-slim

WORKDIR /app

# Install git (needed at runtime for cloning repos)
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# Copy only package.json (for runtime deps)
COPY package*.json ./

# Install only production deps
RUN npm install --production

# Copy compiled JS and any other necessary files
COPY --from=builder /app/dist ./dist

# Expose API port
EXPOSE 7860

# Start service
CMD ["node", "dist/index.js"]
