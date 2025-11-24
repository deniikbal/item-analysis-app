# Setup Database - Panduan Sederhana

## Masalah Saat Ini
- `npm install` timeout
- Dependencies belum terinstall

## Solusi Manual

### Opsi 1: Skip Database Sementara (RECOMMENDED untuk testing)

Jika ingin menjalankan aplikasi tanpa database dulu:

1. **Comment bagian database di `app/page.tsx`:**

Cari baris ini (sekitar line 126-129):
```typescript
// Load data from database on component mount
useEffect(() => {
  loadSavedData();
}, []);
```

Ganti menjadi:
```typescript
// Load data from database on component mount
// useEffect(() => {
//   loadSavedData();
// }, []);
```

2. **Comment handler save:**

Cari fungsi `handleSaveTestInfo` (sekitar line 131) dan comment:
```typescript
// const handleSaveTestInfo = async () => { ... }
```

3. **Jalankan aplikasi:**
```bash
npm run dev
```

Aplikasi akan jalan normal, hanya tombol Simpan tidak aktif dan data tidak tersimpan ke database.

---

### Opsi 2: Install Dependencies Manual

Buka Command Prompt/PowerShell **BARU** dan jalankan satu per satu:

```bash
cd D:\AYAH\PROJEK\item-analysis-app

# Install drizzle-orm (tunggu sampai selesai)
npm install drizzle-orm

# Install neon serverless (tunggu sampai selesai)
npm install @neondatabase/serverless

# Install drizzle-kit (tunggu sampai selesai)
npm install -D drizzle-kit
```

**PENTING:** Tunggu setiap perintah sampai selesai (bisa 1-3 menit per package).

Setelah semua terinstall, jalankan:
```bash
# Load env dan push database
powershell -ExecutionPolicy Bypass -File push-db.ps1
```

---

### Opsi 3: Gunakan pnpm (Lebih Cepat)

Jika sudah install pnpm:
```bash
pnpm install drizzle-orm @neondatabase/serverless
pnpm install -D drizzle-kit
pnpm run db:push
```

---

## Verify Database Setup Berhasil

Jika berhasil, Anda akan melihat:
```
✓ Pulling schema from database...
✓ Changes applied successfully
```

Cek dengan:
```bash
npx drizzle-kit studio
```

Buka http://localhost:4983 untuk melihat tabel `test_info`.

---

## Testing Aplikasi (Tanpa Database)

1. `npm run dev`
2. Buka http://localhost:3000
3. Upload file Excel
4. Klik Konversi
5. Download PDF

Semua fitur analisis tetap berjalan, hanya data form tidak auto-save.

---

## Kapan Perlu Database?

Database diperlukan jika:
- ✅ Ingin data form auto-load setiap buka aplikasi
- ✅ Tidak ingin isi form berulang kali
- ✅ Banyak guru/user yang menggunakan

Jika hanya untuk testing atau penggunaan pribadi, **skip database tidak masalah**.
