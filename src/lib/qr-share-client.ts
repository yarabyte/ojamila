/** Utilitaires navigateur pour partager / télécharger le QR en PNG */

export function dataUrlToFile(dataUrl: string, filename: string): File {
  const [header, base64] = dataUrl.split(",");
  const mime = /:(.*?);/.exec(header ?? "")?.[1] ?? "image/png";
  const binary = atob(base64 ?? "");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new File([bytes], filename, { type: mime });
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

export type DeviceShareResult = "shared" | "unsupported" | "cancelled";

export async function shareQrImageOnDevice(
  file: File,
  text: string
): Promise<DeviceShareResult> {
  if (!navigator.share) return "unsupported";

  const withFiles =
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] });

  try {
    if (withFiles) {
      await navigator.share({ files: [file], text });
    } else {
      await navigator.share({ text, title: "JAMILA — QR repas" });
    }
    return "shared";
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") return "cancelled";
    throw e;
  }
}
