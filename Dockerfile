# Stage 1: Dependencies & Prisma Generation
FROM node:20-alpine AS dependencies
WORKDIR /app

# Pasang pustaka openssl & libc6 yang dibutuhkan oleh Prisma Engine di Alpine Linux
RUN apk add --no-cache openssl libc6-compat

# Salin manifest paket dependensi
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Salin schema Prisma dan buat Prisma Client
COPY prisma ./prisma/
RUN npx prisma generate

# Stage 2: Runtime Runner
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat wget

ENV NODE_ENV=production
ENV PORT=5001

# Buat grup dan pengguna non-root demi keamanan kontainer
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 caresuser

# Salin dependensi, Prisma Client, dan kode sumber aplikasi
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/prisma ./prisma
COPY package.json tsconfig.json ./
COPY src ./src

# Buat direktori uploads dan atur hak akses pengguna non-root
RUN mkdir -p uploads && chown -R caresuser:nodejs /app

USER caresuser

EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5001/ || exit 1

CMD ["npx", "tsx", "src/server.ts"]
