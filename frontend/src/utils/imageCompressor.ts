import imageCompression from "browser-image-compression";

export interface CompressionResult {
  compressedFile: File;
  originalSizeMB: string;
  compressedSizeMB: string;
  savedPercentage: string;
  previewUrl: string;
}

/**
 * Compresses an image file without losing pixel quality.
 */
export async function compressImageFile(
  file: File,
  maxSizeMB = 1.0,
  maxWidthOrHeight = 1920
): Promise<CompressionResult> {
  const options = {
    maxSizeMB,
    maxWidthOrHeight,
    useWebWorker: true,
    initialQuality: 0.85,
  };

  try {
    const compressedBlob = await imageCompression(file, options);
    const compressedFile = new File([compressedBlob], file.name, {
      type: file.type,
      lastModified: Date.now(),
    });

    const originalSizeMB = (file.size / 1024 / 1024).toFixed(2);
    const compressedSizeMB = (compressedFile.size / 1024 / 1024).toFixed(2);
    const savedPercentage = (
      ((file.size - compressedFile.size) / file.size) *
      100
    ).toFixed(0);

    const previewUrl = URL.createObjectURL(compressedFile);

    return {
      compressedFile,
      originalSizeMB,
      compressedSizeMB,
      savedPercentage,
      previewUrl,
    };
  } catch (error) {
    console.error("Gagal mengkompresi gambar:", error);
    throw error;
  }
}
