export function getExtensionFromBase64(base64: string): string | null {
  const match = base64.match(/^data:(.+);base64,/);
  if (!match) return null;

  const mimeType = match[1];
  const extension = mimeType.split("/")[1];
  return extension;
}
