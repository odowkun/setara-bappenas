// ==============================================================================
// Cloudflare Worker: Bappeda Halut Maintenance & 502/Down Interceptor
// Menangkap status 502/503/504/521/522/523/530/1033 jika server fisik padam
// ==============================================================================

const MAINTENANCE_HTML = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Server Utama Tidak Terhubung — BAPPEDA Halmahera Utara</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    body {
      min-height: 100vh;
      min-height: 100dvh;
      background-color: #f8fafc;
      color: #0f172a;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      text-align: center;
    }
    .icon-container {
      width: 64px;
      height: 64px;
      border-radius: 9999px;
      background-color: #fef3c7;
      border: 1px solid #fcd34d;
      color: #d97706;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }
    h1 {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 8px;
      letter-spacing: -0.025em;
    }
    p {
      font-size: 14px;
      color: #475569;
      max-width: 460px;
      margin-bottom: 24px;
      line-height: 1.6;
    }
    .btn-refresh {
      padding: 12px 24px;
      border-radius: 9999px;
      background-color: #1d4ed8;
      color: #ffffff;
      font-weight: 800;
      font-size: 14px;
      box-shadow: 0 4px 6px -1px rgba(29, 78, 216, 0.25);
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s ease;
      text-decoration: none;
    }
    .btn-refresh:hover {
      background-color: #1e40af;
      transform: translateY(-1px);
    }
    .btn-refresh:active {
      transform: scale(0.97);
    }
    .status-badge {
      margin-top: 28px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 16px;
      border-radius: 9999px;
      background-color: #f1f5f9;
      border: 1px solid #e2e8f0;
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
    }
    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 9999px;
      background-color: #ef4444;
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
  </style>
  <script>
    // Auto refresh otomatis setiap 30 detik untuk memeriksa kembalinya server kantor
    setTimeout(function() {
      window.location.reload();
    }, 30000);
  </script>
</head>
<body>
  <div class="icon-container">
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  </div>
  <h1>Server Utama Sedang Tidak Terhubung</h1>
  <p>
    Koneksi ke server kantor saat ini tidak dapat dijangkau. Halaman akan otomatis memuat ulang saat koneksi kembali pulih.
  </p>
  <button class="btn-refresh" onclick="window.location.reload()">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
      <path d="M21 3v5h-5"/>
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
      <path d="M8 16H3v5"/>
    </svg>
    <span>Periksa Koneksi Server</span>
  </button>
  <div class="status-badge">
    <span class="status-dot"></span>
    <span>Server on-premise BAPPEDA sedang terputus dan dalam pemeliharaan jaringan dan daya</span>
  </div>
</body>
</html>`;

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);

      // Jika request datang dari domain resmi Pemkab, arahkan hostname ke domain tunnel
      let outgoingRequest = request;
      if (url.hostname === "bappeda.halmaherautarakab.go.id") {
        url.hostname = "bappeda.halut.my.id";
        outgoingRequest = new Request(url.toString(), request);
        outgoingRequest.headers.set("X-Forwarded-Host", "bappeda.halmaherautarakab.go.id");
      }

      const response = await fetch(outgoingRequest);

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
