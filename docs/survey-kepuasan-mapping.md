# Dokumentasi Pemetaan Skor Survei Kepuasan Masyarakat (IKM)

## Latar Belakang & Masalah
Sebelumnya, formulir survei publik (`/survey-kepuasan`) menggunakan `Object.values(scores)` dengan urutan key object arbitrary dan fallback `|| 5`. 
Ketika responden mengisi pertanyaan dengan rating acak (misalnya 1, 2, 3, 4 bintang), key pertanyaan yang tidak cocok atau belum terjawab menghasilkan nilai `null`, yang secara keliru jatuh ke nilai fallback `5 Bintang`. Akibatnya, pada tampilan detail skor admin dashboard (`/dashboard/survey-kepuasan`), aspek U2 hingga U5 selalu tercatat sebagai "5 Bintang ★" meskipun responden memberikan penilaian acak.

## Solusi Implementasi
1. **Pemberian Key Unik Berbasis ID (`question_${id}`)**:
   - Pertanyaan survei dinamis tidak lagi menggunakan string gabungan indeks urutan global yang rentan tabrakan key.
   - Setiap pertanyaan di-bind langsung ke `question_${q.id}`.

2. **Pemetaan Aspek PermenPAN-RB Dinamis (U1 - U5)**:
   - Skor dari pertanyaan aktif untuk layanan yang dipilih dianalisis berdasarkan kata kunci judul/deskripsi:
     - `U1 - Persyaratan Service`: Pertanyaan terkait syarat/persyaratan.
     - `U2 - Prosedur Pelayanan`: Pertanyaan terkait prosedur, alur, kemudahan, akses.
     - `U3 - Kecepatan Pelayanan`: Pertanyaan terkait kecepatan, waktu penyelesaian, tanggapan.
     - `U4 - Produk & Kepastian`: Pertanyaan terkait produk, kualitas, dokumen hasil, visualisasi/spasial.
     - `U5 - Competency & Sikap Petugas`: Pertanyaan terkait sikap, keramahan, kompetensi petugas, front office.
   - Pertanyaan rating yang tidak memiliki kata kunci khusus dipetakan berurutan ke slot aspek yang belum terisi.
   - Jika layanan memiliki jumlah pertanyaan kurang dari 5 (misal 2, 3, atau 4 pertanyaan), aspek yang tersisa dihitung secara proporsional dari nilai rata-rata (`avgScore`) yang diberikan responden, bukan dipaksa menjadi 5 bintang.
   - Respons non-rating (teks, paragraf, radio, checkbox) otomatis digabungkan secara rapi ke dalam kolom `saran_masukan`.

3. **Kalkulasi Live IKM Realtime**:
   - `currentLiveIKM` menghitung rata-rata hanya dari pertanyaan aktif yang telah dijawab responden pada jenis layanan yang dipilih.
