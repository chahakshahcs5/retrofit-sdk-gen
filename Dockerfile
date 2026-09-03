# syntax=docker/dockerfile:1

# ==============================================================================
# Stage 1: Build TypeScript Application
# ==============================================================================
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json tsconfig.json ./

# Install all dependencies (including devDependencies for tsc)
RUN npm ci

# Copy source code and scripts
COPY src/ ./src/
COPY scripts/ ./scripts/

# Build TypeScript to dist/
RUN npm run build

# Remove development dependencies to keep final layer lean
RUN npm prune --production

# ==============================================================================
# Stage 2: Minimal Production Runtime (Default Target)
# ==============================================================================
FROM node:20-bookworm-slim AS runtime

LABEL org.opencontainers.image.title="retrofit-sdk-gen" \
      org.opencontainers.image.description="Universal Android Retrofit to Multi-Language SDK Generator" \
      org.opencontainers.image.licenses="MIT"

# Install OpenJDK JRE (headless) so JADX can decompile APKs headlessly, plus curl & certificates
RUN apt-get update && apt-get install -y --no-install-recommends \
    openjdk-17-jre-headless \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package definition and production modules from builder
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Symlink executable globally inside the container
RUN npm link

# Create workspace directory for volume mounts
WORKDIR /work

# Expose port for the Scalar Playground & Mock Server
EXPOSE 3000

ENV NODE_ENV=production \
    PORT=3000

# Set entrypoint to the global CLI
ENTRYPOINT ["retrofit-sdk-gen"]

# Default to showing CLI help menu if no arguments are provided
CMD ["--help"]

# ==============================================================================
# Stage 3: Full Multi-Language Toolchain Target (for Automated SDK Verification)
# ==============================================================================
FROM runtime AS full-test

USER root

# Install native compilers for testing: Python, Go, C/C++ GCC, Make, CMake
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    golang-go \
    build-essential \
    cmake \
    git \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install Rust toolchain (cargo, rustc)
ENV RUSTUP_HOME=/usr/local/rustup \
    CARGO_HOME=/usr/local/cargo \
    PATH=/usr/local/cargo/bin:$PATH
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable --profile minimal \
    && chmod -R a+w $RUSTUP_HOME $CARGO_HOME

# Install .NET SDK 8.0 for C# compilation tests
RUN wget https://packages.microsoft.com/config/debian/12/packages-microsoft-prod.deb -O packages-microsoft-prod.deb \
    && dpkg -i packages-microsoft-prod.deb \
    && rm packages-microsoft-prod.deb \
    && apt-get update \
    && apt-get install -y --no-install-recommends dotnet-sdk-8.0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /work

ENTRYPOINT ["retrofit-sdk-gen", "test"]
