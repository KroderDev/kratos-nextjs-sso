import jsQR from "jsqr";
import { PNG } from "pngjs";

export { generateTotpCode } from "@/lib/ory/totp";

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
