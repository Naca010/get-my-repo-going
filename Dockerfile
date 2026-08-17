# --- build stage ---
FROM oven/bun:1.2 AS build
WORKDIR /app

# Install deps first for better layer caching
COPY package.json bun.lockb* bun.lock* ./
RUN bun install --frozen-lockfile || bun install

# Copy source
COPY . .

# Build with self-host preset (node-server)
ENV SELF_HOST=1
ENV NODE_ENV=production
# VITE_* vars must be present at build time so the client bundle sees them
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_PROJECT_ID
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID
RUN bun run build

# --- runtime stage ---
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Nitro node-server output
COPY --from=build /app/.output ./.output

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
