# Dashboard - Sistem Analisis Butir Soal

## Fitur Dashboard

### 1. **Halaman Dashboard** (`/dashboard`)
Setelah login atau registrasi berhasil, user akan diarahkan ke halaman dashboard yang memiliki 2 menu utama:

#### Menu 1: Data Ulangan
- Menampilkan semua data ulangan yang dimiliki oleh user yang sedang login
- Jika user baru daftar, akan menampilkan pesan bahwa belum ada data
- Setiap card data ulangan menampilkan:
  - Nama ulangan
  - Mata pelajaran dan kelas
  - Nama sekolah
  - Nama guru
  - Tanggal ulangan
  - KKM (jika ada)
- Aksi yang tersedia:
  - **Lihat Analisis**: Membuka halaman analisis untuk data tersebut
  - **Hapus**: Menghapus data ulangan

#### Menu 2: Upload & Konversi Excel
- Mengarahkan user ke halaman `/convert` untuk upload file Excel
- User dapat mengupload file Excel yang berisi data ulangan
- Setelah diupload, data akan tersimpan dan muncul di menu "Data Ulangan"

## Alur Penggunaan

### User Baru
1. **Register** → Otomatis login → Redirect ke `/dashboard`
2. Dashboard menampilkan pesan "Belum ada data ulangan"
3. Klik tombol "Upload File Excel" untuk menambah data pertama
4. Upload file Excel di halaman `/convert`
5. Setelah berhasil, kembali ke dashboard untuk melihat data

### User yang Sudah Punya Data
1. **Login** → Redirect ke `/dashboard`
2. Dashboard menampilkan semua data ulangan yang sudah dibuat
3. Dapat:
   - Melihat analisis dari data yang ada
   - Menghapus data yang tidak diperlukan
   - Menambah data baru melalui menu "Upload & Konversi Excel"

## API Endpoints Baru

### GET `/api/test-data`
Mengambil semua data ulangan milik user yang sedang login.

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "schoolName": "SMA Negeri 1",
      "subject": "Matematika",
      "classInfo": "XII IPA 1",
      "testName": "Ulangan Harian Bab 1",
      "teacherName": "Budi Santoso",
      "testDate": "2025-01-15",
      "kkm": "75",
      "createdAt": "2025-11-30T...",
      "updatedAt": "2025-11-30T..."
    }
  ]
}
```

### DELETE `/api/test-data`
Menghapus data ulangan berdasarkan ID.

**Request Body:**
```json
{
  "id": 1
}
```

## Middleware & Routing

### Middleware Updates
- **Root path (`/`)**: 
  - Jika sudah login → Redirect ke `/dashboard`
  - Jika belum login → Redirect ke `/auth/login`
- **Auth pages (`/auth/login`, `/auth/register`)**: 
  - Jika sudah login → Redirect ke `/dashboard`
  - Jika belum login → Tampilkan halaman auth

### Protected Routes
Semua route kecuali `/auth/login` dan `/auth/register` memerlukan autentikasi. Jika user belum login, akan diarahkan ke halaman login.

## Fitur Keamanan
- Setiap user hanya dapat melihat, mengedit, dan menghapus data miliknya sendiri
- Data ulangan terisolasi per user (berdasarkan `userId`)
- Session management menggunakan Lucia Auth v3
