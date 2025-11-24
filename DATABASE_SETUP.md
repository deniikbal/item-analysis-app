# Setup Database dengan Neon PostgreSQL & Drizzle ORM

## 🎯 Tujuan

Database digunakan untuk **menyimpan data form ulangan** (info sekolah, guru, kepala sekolah, dll) agar tidak perlu diisi berulang kali. Data ini akan otomatis dimuat saat aplikasi dibuka dan digunakan untuk generate PDF.

## 📋 Langkah-langkah Setup

### 1. Install Dependencies

Jalankan perintah berikut untuk install semua dependencies yang diperlukan:

```bash
npm install drizzle-orm @neondatabase/serverless dotenv
npm install -D drizzle-kit
```

### 2. Setup Neon Database

1. Buka [Neon Console](https://console.neon.tech/)
2. Login atau buat akun baru
3. Buat project baru atau pilih project yang sudah ada
4. Copy **Connection String** dari dashboard
   - Format: `postgresql://[user]:[password]@[host]/[database]?sslmode=require`

### 3. Konfigurasi Environment Variables

1. Buka file `.env.local` yang sudah dibuat
2. Ganti `your_neon_database_url_here` dengan Connection String dari Neon:

```env
DATABASE_URL=postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### 4. Generate dan Run Migration

Jalankan perintah berikut untuk membuat tabel di database:

```bash
# Generate migration files
npx drizzle-kit generate:pg

# Push schema ke database (langsung create tables)
npx drizzle-kit push:pg
```

**ATAU** jika ingin lebih aman dengan migration:

```bash
# Generate migration
npx drizzle-kit generate:pg

# Apply migration
npx drizzle-kit migrate
```

### 5. Verify Database

Cek apakah tabel sudah terbuat dengan benar:

```bash
npx drizzle-kit studio
```

Ini akan membuka Drizzle Studio di browser untuk melihat database Anda.

## 📊 Schema Database

Database ini hanya memiliki **1 tabel**:

### **test_info** - Data Form Ulangan
Menyimpan informasi ulangan yang sering digunakan:
- Nama Sekolah
- Mata Pelajaran
- Kelas/Semester
- Nama Tes
- Kompetensi Dasar
- Nama Pengajar & NIP
- Nama Kepala Sekolah & NIP
- Tahun Pelajaran
- Tanggal Tes
- KKM

**Catatan:** Data hasil analisis (siswa, skor, dll) **TIDAK** disimpan ke database, hanya data form saja.

## 🔄 Cara Kerja

### Pertama Kali Menggunakan:
1. User **isi form Data Ulangan** (nama sekolah, guru, dll)
2. Klik tombol **"💾 Simpan Data"**
3. Data tersimpan ke database Neon PostgreSQL
4. Form menjadi **read-only** (tidak bisa diedit)
5. Muncul tombol **"✏️ Edit"** untuk mengubah data

### Menggunakan Selanjutnya:
1. Aplikasi dibuka → **data otomatis dimuat** dari database
2. Form sudah terisi, tinggal upload file Excel dan analisis
3. Saat download PDF, data diambil dari database

### Edit Data:
1. Klik tombol **"✏️ Edit"**
2. Form menjadi editable
3. Ubah data yang perlu diubah
4. Klik **"💾 Simpan"** atau **"❌ Batal"**

### Analisis Soal:
1. Upload file Excel
2. Klik **"Konversi"** → otomatis analisis
3. Download PDF dengan data form dari database

## 📝 Update package.json

Tambahkan scripts untuk migration di `package.json`:

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate:pg",
    "db:push": "drizzle-kit push:pg",
    "db:studio": "drizzle-kit studio"
  }
}
```

Sehingga Anda bisa jalankan:
- `npm run db:generate` - Generate migration files
- `npm run db:push` - Push schema ke database
- `npm run db:studio` - Buka Drizzle Studio

## ✅ Testing

1. Jalankan aplikasi: `npm run dev`
2. Buka http://localhost:3000
3. Isi form "Data Ulangan"
4. Klik tombol "💾 Simpan Data"
5. Akan muncul alert "Data berhasil disimpan!"
6. Refresh halaman → data otomatis dimuat
7. Buka Drizzle Studio untuk verify: `npm run db:studio`

## 🔧 Troubleshooting

### Error: "DATABASE_URL is not set"
- Pastikan file `.env.local` ada dan berisi DATABASE_URL yang benar
- Restart dev server setelah update `.env.local`

### Error: "relation does not exist"
- Jalankan `npx drizzle-kit push:pg` untuk create tables
- Atau run migration dengan `npx drizzle-kit migrate`

### Connection timeout
- Cek apakah Neon database masih aktif (free tier sleep setelah idle)
- Cek koneksi internet Anda

## 💡 Tips

- Data tersimpan secara **otomatis update** jika sudah ada data sebelumnya
- Hanya **1 record** data form yang disimpan (data terbaru)
- Data form **tidak terhapus** meskipun analisis baru dilakukan
- Cocok untuk sekolah/guru yang sering buat analisis dengan data yang sama

## 📚 Referensi

- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Neon Database Docs](https://neon.tech/docs/introduction)
- [Drizzle Kit Commands](https://orm.drizzle.team/kit-docs/overview)
