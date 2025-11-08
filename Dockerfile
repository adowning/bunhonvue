# --- Stage 1: The Builder ---
# This stage builds all our monorepo packages.
FROM oven/bun:latest AS builder
WORKDIR /app

# Copy all package.json files first to leverage Docker cache
COPY ../package.json .
COPY ../bun.lock .
COPY ../db/package.json ./db/
COPY ../shared/package.json ./shared/
COPY ../backend/package.json ./backend/
COPY ../frontend/package.json ./frontend/

# Install all dependencies for the entire workspace
RUN bun install --frozen-lockfile

# Copy the rest of the source code
COPY ../. .

# Clean any existing build artifacts to force rebuild
RUN rm -rf backend/dist db/dist shared/dist backend/tsconfig.tsbuildinfo db/tsconfig.tsbuildinfo shared/tsconfig.tsbuildinfo

ENV DB_URL="dummy-build-time-url"
ENV SUPABASE_SERVICE_KEY="dummy-SB-SERVICE-KEY"
ENV SUPABASE_URL="dummy-SB-URL"

# Run the build for all packages the backend depends on
RUN bun run build

# --- Stage 2: The Final Image ---
# This stage takes only what we need to run the backend.
FROM oven/bun:latest
WORKDIR /app

# Copy only the built code and production node_modules
COPY --from=builder /app/package.json .
COPY --from=builder /app/bun.lock .
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/db/package.json ./db/
COPY --from=builder /app/db/dist ./db/dist
COPY --from=builder /app/shared/package.json ./shared/
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/backend/package.json ./backend/
COPY --from=builder /app/backend/dist ./backend/dist

# Set env to production
ENV NODE_ENV=production

# The backend/src/index.ts file exports the server
# so we run the built version of it.
CMD ["bun", "run", "backend/dist/index.js"]