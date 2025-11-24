# Quick Install Guide - Database Setup

## Masalah: npm install timeout

Jika npm install timeout, coba cara berikut:

### Cara 1: Install dengan npx (Rekomendasi)
Tidak perlu install drizzle-kit, gunakan npx langsung:

```bash
# Push schema ke database
npx drizzle-kit push

# Buka Drizzle Studio
npx drizzle-kit studio
```

### Cara 2: Install satu per satu
```bash
# Install drizzle-orm
npm install drizzle-orm

# Install neon serverless
npm install @neondatabase/serverless

# Install drizzle-kit (dev)
npm install -D drizzle-kit
```

### Cara 3: Gunakan pnpm atau yarn (lebih cepat)
```bash
# Jika ada pnpm
pnpm install drizzle-orm @neondatabase/serverless
pnpm install -D drizzle-kit

# Atau dengan yarn
yarn add drizzle-orm @neondatabase/serverless
yarn add -D drizzle-kit
```

## Setup Database dengan npx (PALING MUDAH)

### 1. Pastikan .env.local sudah diisi
```
DATABASE_URL=your_neon_connection_string
```

### 2. Push schema ke database
```bash
npx drizzle-kit push
```

### 3. Verifikasi dengan Drizzle Studio
```bash
npx drizzle-kit studio
```

Buka browser di http://localhost:4983 untuk melihat database Anda.

### 4. Jalankan aplikasi
```bash
npm run dev
```

## Jika masih error "drizzle-kit not found"

Coba:
```bash
# Clear npm cache
npm cache clean --force

# Install ulang node_modules
rd /s /q node_modules
npm install
```

## Alternative: Skip Database (Sementara)

Jika ingin skip database sementara, comment out bagian ini di `app/page.tsx`:

```typescript
// Comment baris ini:
// useEffect(() => {
//   loadSavedData();
// }, []);
```

Dan comment API route di `app/api/save-test/route.ts`.

Aplikasi akan tetap berjalan, hanya data form tidak auto-load dari database.
