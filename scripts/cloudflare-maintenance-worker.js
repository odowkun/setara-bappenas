// ==============================================================================
// Cloudflare Worker: Bappeda Halut Maintenance & 502/Down Interceptor
// Menangkap status 502/503/504/521/522/523/530/1033 jika server fisik padam
// ==============================================================================

const MAINTENANCE_HTML = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pemeliharaan Sistem — BAPPEDA Halmahera Utara</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; }
    body {
      min-height: 100vh;
      background: linear-gradient(135deg, #091e3a 0%, #0f172a 50%, #1e1b4b 100%);
      color: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      position: relative;
      overflow-x: hidden;
    }
    .ambient-glow {
      position: absolute;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, rgba(30, 58, 138, 0) 70%);
      border-radius: 50%;
      top: 10%;
      left: 50%;
      transform: translateX(-50%);
      pointer-events: none;
    }
    .card {
      position: relative;
      background: rgba(255, 255, 255, 0.04);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 28px;
      padding: 48px 36px;
      max-width: 580px;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
      z-index: 10;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.35);
      color: #fbbf24;
      padding: 6px 16px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 24px;
    }
    .badge-dot {
      width: 8px;
      height: 8px;
      background-color: #f59e0b;
      border-radius: 50%;
      box-shadow: 0 0 8px #f59e0b;
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
    .icon-container {
      width: 80px;
      height: 80px;
      margin: 0 auto 20px;
      background: rgba(59, 130, 246, 0.12);
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #60a5fa;
    }
    h1 {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 8px;
      color: #ffffff;
    }
    .subtitle {
      font-size: 14px;
      color: #94a3b8;
      font-weight: 600;
      margin-bottom: 24px;
    }
    .desc {
      font-size: 14px;
      line-height: 1.65;
      color: #cbd5e1;
      background: rgba(15, 23, 42, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.06);
      padding: 20px;
      border-radius: 18px;
      margin-bottom: 28px;
    }
    .btn-refresh {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      background: #2563eb;
      color: #ffffff;
      font-size: 14px;
      font-weight: 700;
      padding: 14px 28px;
      border-radius: 14px;
      border: none;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s ease;
      box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.4);
    }
    .btn-refresh:hover {
      background: #1d4ed8;
      transform: translateY(-2px);
      box-shadow: 0 15px 30px -5px rgba(37, 99, 235, 0.5);
    }
    .footer {
      margin-top: 32px;
      font-size: 12px;
      color: #64748b;
      font-weight: 500;
    }
    .footer strong { color: #94a3b8; }
  </style>
  <script>
    // Auto refresh setiap 60 detik untuk memeriksa apakah server kantor sudah kembali hidup
    setTimeout(() => { window.location.reload(); }, 60000);
  </script>
</head>
<body>
  <div class="ambient-glow"></div>
  <div class="card">
    <div class="badge">
      <span class="badge-dot"></span>
      Pemeliharaan Berkala
    </div>
    <div class="icon-container">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="m9 12 2 2 4-4"/>
      </svg>
    </div>
    <h1>BAPPEDA HALMAHERA UTARA</h1>
    <p class="subtitle">Sistem Informasi Perencanaan Pembangunan Daerah Terpadu</p>
    
    <div class="desc">
      Saat ini server on-premise kantor BAPPEDA sedang dalam proses pemeliharaan teknis rutin atau optimalisasi daya jaringan. 
      <br><br>
      Seluruh data aman. Halaman ini akan <strong>otomatis memuat ulang</strong> begitu sistem kembali beroperasi penuh.
    </div>

    <button class="btn-refresh" onclick="window.location.reload()">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
      </svg>
      Periksa Status Web Sekarang
    </button>

    <div class="footer">
      Pemerintah Kabupaten Halmahera Utara &copy; 2026<br>
      <strong>BAPPEDA Halut — Sinergi Lokal, Solusi Global</strong>
    </div>
  </div>
</body>
</html>`;

export default {
  async fetch(request, env, ctx) {
    try {
      const response = await fetch(request);

      // Tangkap kode error saat server fisik mati / tidak bisa dihubungi
      const serverDownStatuses = [502, 503, 504, 521, 522, 523, 530];
      if (serverDownStatuses.includes(response.status)) {
        return new Response(MAINTENANCE_HTML, {
          status: 503,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
        });
      }

      return response;
    } catch (err) {
      // Jika terjadi kegagalan fatal pada network / tunnel terputus
      return new Response(MAINTENANCE_HTML, {
        status: 503,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      });
    }
  },
};
