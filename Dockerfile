# --- Stage 1: Build Dependencies ---
FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./

# Install all dependencies including build-essential if needed for native bindings (sqlite, etc.)
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 make g++ && \
    npm ci && \
    npm prune --omit=dev

# --- Stage 2: Production Runtime ---
FROM node:20-slim AS runner

# Create production user for security compliance (non-root execution)
RUN groupadd -r nodejs && useradd -r -g nodejs nodeuser

# Install runtime dependencies: FFmpeg for WhatsApp audio-video transcoding
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        ffmpeg \
        ca-certificates \
        curl && \
        rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built node_modules from builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copy application source code
COPY . .

# Set appropriate directory ownership permissions
RUN chown -R nodeuser:nodejs /app

USER nodeuser

ENV NODE_ENV=production
EXPOSE 5000
EXPOSE 50900

# Health check instructions for Kubernetes/Docker engine
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

CMD ["node", "index.js"]
