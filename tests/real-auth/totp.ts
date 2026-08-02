import jsQR from "jsqr";
import { PNG } from "pngjs";

export { generateTotpCode } from "@/lib/ory/totp";

/**
 * Extracts the TOTP secret from a PNG data URL containing a TOTP QR code.
 *
 * @param dataUrl - A base64-encoded PNG data URL containing the QR code
 * @returns The TOTP secret encoded in the QR code
 */
export function readTotpSecretFromQrDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:image\/png;base64,(.+)$/);

  if (!match) {
    throw new Error("Expected a PNG data URL for the TOTP QR code");
  }

  const png = PNG.sync.read(Buffer.from(match[1], "base64"));
  const result = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);

  if (!result?.data.startsWith("otpauth://totp/")) {
    throw new Error("TOTP QR code did not contain an otpauth URI");
  }

  const secret = new URL(result.data).searchParams.get("secret");

  if (!secret) {
    throw new Error("TOTP otpauth URI did not contain a secret");
  }

  return secret;
}
