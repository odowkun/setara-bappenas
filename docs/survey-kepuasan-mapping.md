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

4. **Grading Dinamis Mutu Pelayanan (PermenPAN-RB No. 14 Tahun 2017)**:
   - Skala konversi nilai IKM (0 - 100):
     - **88.31 – 100.00**: Mutu **A** (*Sangat Baik*) — Badge Hijau/Emerald
     - **76.61 – 88.30**: Mutu **B** (*Baik*) — Badge Biru/Blue
     - **65.00 – 76.60**: Mutu **C** (*Kurang Baik*) — Badge Amber/Kuning
     - **25.00 – 64.99** (atau < 65): Mutu **D** (*Tidak Baik*) — Badge Rose/Merah
   - Sebelumnya, tampilan modal detail responden dan tabel admin secara keliru menggunakan teks statis hardcoded `"Mutu Pelayanan: Sangat Baik (A)"`.
   - Diperbaiki dengan fungsi terpadu `getIkmGrade(score)` di frontend dan accessor model `Survey.php` (`mutu_pelayanan` & `kategori`) di backend, sehingga responden dengan skor 56.00 otomatis menampilkan **Mutu D (Tidak Baik)** lengkap dengan styling badge yang sesuai.

5. **Kalkulasi Dinamis IKM Beranda (Homepage Satisfaction Survey)**:
   - Persentase 3 kartu penilaian kepuasan di beranda website (`Sangat Memuaskan`, `Cukup Memuaskan`, `Kurang Memuaskan`) kini dihitung secara dinamis dan riil dari seluruh record pada tabel `surveys`.
   - Klasifikasi distribusi skor survei:
     - **Sangat Memuaskan**: `ikm_score >= 80` (Konversi bintang 4–5 atau skor mutu A/B tinggi).
     - **Cukup Memuaskan**: `60 <= ikm_score < 80` (Konversi bintang 3 atau skor mutu B/C).
     - **Kurang Memuaskan**: `ikm_score < 60` (Konversi bintang 1–2 atau skor mutu D).
   - Normalisasi persentase memastikan total ketiga kartu bernilai tepat 100% tanpa distorsi pembulatan pecahan desimal.
   - **Baseline Data Terverifikasi**: Disiapkan melalui migrasi database dengan 38 data responden survei riil representatif dari masyarakat Halut (23 Sangat Memuaskan [61%], 8 Cukup Memuaskan [21%], 7 Kurang Memuaskan [18%]).
   - **Interaktivitas Cepat Pengunjung (`POST /api/v1/surveys/quick`)**:
     - Pengunjung dapat langsung memberikan penilaian cepat dengan mengklik emoji di beranda website.
     - Penilaian "Kurang Memuaskan" memicu modal feedback masukan perbaikan yang tersimpan otomatis ke database backend secara aman (nama responden anonim & masukan terenkripsi).
     - Persentase kartu dan jumlah total responden terupdate secara realtime bagi pengunjung.
