import {
  generatePromptPayPayload,
  crc16Ccitt,
  formatPromptPayTarget,
  createPromptPayQr,
} from '../src/services/promptpay.service';

describe('PromptPay EMVCo Engine', () => {
  it('formats Thai mobile phone correctly with 0066 country code', () => {
    const { subTag, formatted } = formatPromptPayTarget('0812345678');
    expect(subTag).toBe('01');
    expect(formatted).toBe('0066812345678');
  });

  it('formats Thai National ID / Tax ID correctly', () => {
    const { subTag, formatted } = formatPromptPayTarget('1234567890123');
    expect(subTag).toBe('02');
    expect(formatted).toBe('1234567890123');
  });

  it('computes 4-character uppercase CRC-16 CCITT', () => {
    const checksum = crc16Ccitt('000201010212');
    expect(checksum).toHaveLength(4);
    expect(checksum).toMatch(/^[0-9A-F]{4}$/);
  });

  it('generates standard EMVCo payload string containing currency 764 and amount', () => {
    const payload = generatePromptPayPayload('0812345678', 25.43);
    expect(payload).toContain('000201010212'); // Format + Dynamic QR
    expect(payload).toContain('A000000677010111'); // PromptPay AID
    expect(payload).toContain('0066812345678'); // Phone target
    expect(payload).toContain('5303764'); // THB
    expect(payload).toContain('540525.43'); // Amount
    expect(payload).toContain('5802TH'); // Country TH
  });

  it('creates a base64 QR Code image data URL', async () => {
    const { qrCodeDataUrl, payload } = await createPromptPayQr('0812345678', 15.25);
    expect(payload).toBeTruthy();
    expect(qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
  });
});
