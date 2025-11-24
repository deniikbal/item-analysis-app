# Instruksi Migration Database - Test Date

## Perubahan
Kolom `test_date` di tabel `test_info` diubah dari `VARCHAR(50)` menjadi `DATE` untuk:
- Validasi input yang lebih baik
- Format date picker di UI
- Konsistensi data tanggal

## Cara Menjalankan Migration

### Metode 1: Menggunakan psql (PostgreSQL Command Line)

1. Buka command prompt atau terminal
2. Koneksi ke database:
   ```bash
   psql -U postgres -d item_analysis_db
   ```

3. Jalankan migration file:
   ```bash
   \i migrations/001_change_testdate_to_date.sql
   ```

### Metode 2: Menggunakan pgAdmin atau Database Client

1. Buka pgAdmin atau database client favorit Anda
2. Koneksi ke database `item_analysis_db`
3. Buka file `migrations/001_change_testdate_to_date.sql`
4. Jalankan SQL script

### Metode 3: Menggunakan PowerShell

Jalankan command berikut:
```powershell
$env:PGPASSWORD="your_password"
psql -U postgres -d item_analysis_db -f migrations/001_change_testdate_to_date.sql
```

## Backup Database (PENTING!)

Sebelum menjalankan migration, **SELALU** backup database terlebih dahulu:

```bash
pg_dump -U postgres -d item_analysis_db > backup_before_migration.sql
```

## Verifikasi Migration

Setelah migration, verifikasi dengan query:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'test_info' AND column_name = 'test_date';
```

Expected result: `data_type` harus `date`

## Rollback (Jika Diperlukan)

Jika ada masalah, restore dari backup:

```bash
psql -U postgres -d item_analysis_db < backup_before_migration.sql
```

## Catatan
- Data tanggal yang sudah ada dalam format `YYYY-MM-DD` akan otomatis terkonversi
- Data tanggal dalam format lain mungkin menjadi NULL
- Input date di UI sekarang menggunakan date picker standar browser
- Format tampilan di PDF/Excel tetap dalam format Indonesia (contoh: "10 Juni 2025")
