import QRCode from 'qrcode';
import { logger } from '../lib/logger';

function formatTag(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

export function crc16Ccitt(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Formats a Thai phone number or Tax ID to PromptPay EMVCo target format.
 */
export function formatPromptPayTarget(target: string): { subTag: string; formatted: string } {
  const cleaned = target.replace(/[^0-9]/g, '');
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    // Phone number: convert 0812345678 to 0066812345678
    const intl = `0066${cleaned.substring(1)}`;
    return { subTag: '01', formatted: intl };
  } else if (cleaned.length === 13) {
    // Tax ID / National ID
    return { subTag: '02', formatted: cleaned };
  }
  // Fallback as phone with padded length
  return { subTag: '01', formatted: cleaned };
}

/**
 * Generates an EMVCo-compliant PromptPay Dynamic QR code payload.
 */
export function generatePromptPayPayload(target: string, amount: number): string {
  const { subTag, formatted } = formatPromptPayTarget(target);
  const targetTag = formatTag(subTag, formatted);
  const aidTag = formatTag('00', 'A000000677010111');
  const merchantInfo = formatTag('29', aidTag + targetTag);

  const formattedAmount = amount.toFixed(2);

  const raw =
    formatTag('00', '01') +
    formatTag('01', '12') + // Dynamic QR
    merchantInfo +
    formatTag('53', '764') + // THB currency
    formatTag('54', formattedAmount) +
    formatTag('58', 'TH') +
    '6304';

  const checksum = crc16Ccitt(raw);
  return `${raw}${checksum}`;
}

/**
 * Generates both the payload string and base64 QR Code image data URL.
 */
export async function createPromptPayQr(
  target: string,
  amount: number
): Promise<{ payload: string; qrCodeDataUrl: string }> {
  try {
    const payload = generatePromptPayPayload(target, amount);
    const qrCodeDataUrl = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 300,
      color: {
        dark: '#171717',
        light: '#FFFFFF',
      },
    });
    return { payload, qrCodeDataUrl };
  } catch (err) {
    logger.error('Failed to generate PromptPay QR:', err);
    throw new Error('QR Code generation failed');
  }
}
