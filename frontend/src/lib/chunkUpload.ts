import { authenticatedFetch, API_BASE_URL, STORAGE_BASE_URL } from "@/lib/apiClient";

export const calculateDynamicChunkSizeMB = (fileSizeBytes: number): number => {
  if (!fileSizeBytes || fileSizeBytes <= 0) return 1;
  const sizeMB = fileSizeBytes / (1024 * 1024);
  if (sizeMB <= 5) return 1;     // <= 5MB: 1MB chunk (1-5 irisan instan)
  if (sizeMB <= 25) return 2;    // 5-25MB: 2MB chunk (3-13 irisan cepat)
  if (sizeMB <= 100) return 5;   // 25-100MB: 5MB chunk (5-20 irisan)
  if (sizeMB <= 500) return 10;  // 100-500MB: 10MB chunk (10-50 irisan)
  if (sizeMB <= 1500) return 25; // 500MB-1.5GB: 25MB chunk
  if (sizeMB <= 3000) return 35; // 1.5GB-3GB: 35MB chunk
  return 40;                     // 3GB-5GB: 40MB chunk (aman proxy Cloudflare/Nginx 100MB limit)
};

export const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes <= 0) return "0 MB";
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export interface ChunkProgressInfo {
  percent: number;
  currentChunk: number;
  totalChunks: number;
  effectiveChunkMB: number;
  bytesUploaded: number;
  totalBytes: number;
  statusText: string;
}

export interface ChunkUploadOptions {
  endpoint?: string;
  maxSizeBytes?: number; // default: 500MB
  maxSizeLabel?: string; // default: "500 MB"
  acceptedExtensions?: string[]; // default: [".pdf"]
  onProgress?: (info: ChunkProgressInfo) => void;
  signal?: AbortSignal;
}

export interface ChunkUploadResult {
  file_path: string;
  file_url: string;
  file_name: string;
  file_size: string;
  watermark_applied: boolean;
}

/**
 * Robust slice-based chunk upload with dynamic sizing, retry mechanism, and watermark handling
 */
export async function uploadFileInChunks(
  file: File,
  options: ChunkUploadOptions = {}
): Promise<ChunkUploadResult> {
  const {
    endpoint = `${API_BASE_URL}/documents/upload-chunk`,
    maxSizeBytes = 500 * 1024 * 1024, // 500 MB default
    maxSizeLabel = "500 MB",
    acceptedExtensions = [".pdf"],
    onProgress,
    signal,
  } = options;

  // 1. Validasi ekstensi berkas
  if (acceptedExtensions && acceptedExtensions.length > 0) {
    const ext = `.${file.name.split(".").pop()?.toLowerCase()}`;
    const isValid = acceptedExtensions.some((allowed) => allowed.toLowerCase() === ext);
    if (!isValid) {
      throw new Error(
        `Format berkas tidak diizinkan. Berkas yang diterima: ${acceptedExtensions.join(", ")}`
      );
    }
  }

  // 2. Validasi kapasitas berkas maksimal (Default 500MB, Dokumen Perencanaan 5GB)
  if (file.size > maxSizeBytes) {
    throw new Error(
      `Ukuran berkas (${formatFileSize(file.size)}) melebihi batas maksimal yang diizinkan (${maxSizeLabel}).`
    );
  }

  // 3. Kalkulasi ukuran chunk dinamis
  const effectiveChunkMB = calculateDynamicChunkSizeMB(file.size);
  const chunkSize = effectiveChunkMB * 1024 * 1024;
  const totalChunks = Math.ceil(file.size / chunkSize);

  onProgress?.({
    percent: 0,
    currentChunk: 0,
    totalChunks,
    effectiveChunkMB,
    bytesUploaded: 0,
    totalBytes: file.size,
    statusText: `Menyiapkan ${totalChunks} irisan berkas (${effectiveChunkMB} MB/chunk)...`,
  });

  // 4. Upload per irisan
  for (let i = 0; i < totalChunks; i++) {
    if (signal?.aborted) {
      throw new Error("Proses unggah berkas dibatalkan.");
    }

    const start = i * chunkSize;
    const end = Math.min(file.size, start + chunkSize);
    const chunkBlob = file.slice(start, end);

    const formData = new FormData();
    formData.append("file", chunkBlob, file.name);
    formData.append("chunk", i.toString());
    formData.append("chunks", totalChunks.toString());

    let chunkUploaded = false;
    let retries = 0;
    const maxRetries = 4;

    while (!chunkUploaded && retries < maxRetries) {
      if (signal?.aborted) {
        throw new Error("Proses unggah berkas dibatalkan.");
      }

      try {
        onProgress?.({
          percent: Math.round((i / totalChunks) * 100),
          currentChunk: i + 1,
          totalChunks,
          effectiveChunkMB,
          bytesUploaded: start,
          totalBytes: file.size,
          statusText: `Mengunggah irisan ${i + 1}/${totalChunks} (${effectiveChunkMB} MB/chunk) • ${formatFileSize(start)} / ${formatFileSize(file.size)}...`,
        });

        const res = await authenticatedFetch(endpoint, {
          method: "POST",
          body: formData,
          signal,
        });

        if (res.ok) {
          const data = await res.json();
          chunkUploaded = true;

          const pct = Math.round(((i + 1) / totalChunks) * 100);
          onProgress?.({
            percent: pct,
            currentChunk: i + 1,
            totalChunks,
            effectiveChunkMB,
            bytesUploaded: end,
            totalBytes: file.size,
            statusText:
              i + 1 === totalChunks
                ? "Menyelesaikan & memproses dokumen resmi..."
                : `Mengunggah irisan ${i + 1}/${totalChunks}...`,
          });

          // Jika chunk terakhir dan server merespon sukses
          if (data.status === "success" || data.watermark_applied === true) {
            const rawPath = data.file_path || `/documents/${file.name}`;
            const finalUrl = rawPath.startsWith("/storage/")
              ? `${STORAGE_BASE_URL}${rawPath}`
              : rawPath.startsWith("http")
              ? rawPath
              : `${STORAGE_BASE_URL}/storage/${rawPath}`;

            return {
              file_path: rawPath,
              file_url: finalUrl,
              file_name: data.file_name || file.name,
              file_size: data.file_size || formatFileSize(file.size),
              watermark_applied: Boolean(data.watermark_applied),
            };
          }

          if (i + 1 === totalChunks) {
            chunkUploaded = false;
            throw new Error("Server belum mengonfirmasi penyelesaian berkas.");
          }
        } else {
          let errorMsg = `Server menolak irisan berkas (${res.status})`;
          try {
            const errData = await res.json();
            if (errData?.message) {
              errorMsg = errData.message;
            }
          } catch {
            // ignore JSON parse error
          }

          // Error validasi / client error 4xx tidak perlu retry
          if (res.status >= 400 && res.status < 500) {
            throw new Error(errorMsg);
          }

          throw new Error(errorMsg);
        }
      } catch (err: unknown) {
        retries++;
        if (err instanceof Error && err.name === "AbortError") {
          throw err;
        }

        const msg = err instanceof Error ? err.message : "Gangguan koneksi";
        if (retries >= maxRetries) {
          throw new Error(`Gagal mengunggah berkas setelah ${maxRetries} kali percobaan: ${msg}`);
        }

        onProgress?.({
          percent: Math.round((i / totalChunks) * 100),
          currentChunk: i + 1,
          totalChunks,
          effectiveChunkMB,
          bytesUploaded: start,
          totalBytes: file.size,
          statusText: `⚠️ Percobaan irisan ${i + 1} terganggu (${msg}), mencoba ulang (${retries}/${maxRetries})...`,
        });

        await new Promise((resolve) => setTimeout(resolve, 1500 * retries));
      }
    }
  }

  throw new Error("Gagal mengunggah berkas: proses tidak selesai sempurna.");
}
