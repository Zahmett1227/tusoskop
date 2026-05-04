/**
 * Outlook (Windows) mailto: gövdesini çoğunlukla Windows-1254 / sistem ANSI
 * kod sayfası ile doldurur; UTF-8 yüzde kodlaması mojibake üretir (ör. hakkÄ±nda).
 * Bu modül metni Windows-1254 tek bayta indirip RFC 3986 benzeri %XX kodlar.
 *
 * Kaynak: WHATWG index-windows-1254.txt (byte 0x80+i → Unicode).
 */

/** 0x80..0xFF aralığının Unicode karşılıkları (sıra sabit). */
const WIN1254_UNICODE = [
  0x20ac, 0x0081, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030,
  0x0160, 0x2039, 0x0152, 0x008d, 0x008e, 0x008f, 0x0090, 0x2018, 0x2019, 0x201c,
  0x201d, 0x2022, 0x2013, 0x2014, 0x02dc, 0x2122, 0x0161, 0x203a, 0x0153, 0x009d,
  0x009e, 0x0178, 0x00a0, 0x00a1, 0x00a2, 0x00a3, 0x00a4, 0x00a5, 0x00a6, 0x00a7,
  0x00a8, 0x00a9, 0x00aa, 0x00ab, 0x00ac, 0x00ad, 0x00ae, 0x00af, 0x00b0, 0x00b1,
  0x00b2, 0x00b3, 0x00b4, 0x00b5, 0x00b6, 0x00b7, 0x00b8, 0x00b9, 0x00ba, 0x00bb,
  0x00bc, 0x00bd, 0x00be, 0x00bf, 0x00c0, 0x00c1, 0x00c2, 0x00c3, 0x00c4, 0x00c5,
  0x00c6, 0x00c7, 0x00c8, 0x00c9, 0x00ca, 0x00cb, 0x00cc, 0x00cd, 0x00ce, 0x00cf,
  0x011e, 0x00d1, 0x00d2, 0x00d3, 0x00d4, 0x00d5, 0x00d6, 0x00d7, 0x00d8, 0x00d9,
  0x00da, 0x00db, 0x00dc, 0x0130, 0x015e, 0x00df, 0x00e0, 0x00e1, 0x00e2, 0x00e3,
  0x00e4, 0x00e5, 0x00e6, 0x00e7, 0x00e8, 0x00e9, 0x00ea, 0x00eb, 0x00ec, 0x00ed,
  0x00ee, 0x00ef, 0x011f, 0x00f1, 0x00f2, 0x00f3, 0x00f4, 0x00f5, 0x00f6, 0x00f7,
  0x00f8, 0x00f9, 0x00fa, 0x00fb, 0x00fc, 0x0131, 0x015f, 0x00ff,
];

const UNICODE_TO_WIN1254_BYTE = (() => {
  const m = new Map();
  for (let i = 0; i < 128; i += 1) {
    m.set(WIN1254_UNICODE[i], 0x80 + i);
  }
  return m;
})();

const UNRESERVED = /^[A-Za-z0-9\-_.~]$/;

function percentEncodeBytes(bytes) {
  let out = "";
  for (let i = 0; i < bytes.length; i += 1) {
    const b = bytes[i];
    const ch = String.fromCharCode(b);
    if (UNRESERVED.test(ch)) out += ch;
    else out += `%${b.toString(16).toUpperCase().padStart(2, "0")}`;
  }
  return out;
}

/**
 * Unicode metni Windows-1254 baytlarına çevirir; harita dışı karakterler UTF-8
 * baytlarıyla eklenir (çoğu şablonda yok; nadir e-posta karakterleri).
 */
export function stringToWindows1254Bytes(str) {
  const bytes = [];
  for (const ch of str) {
    const code = ch.codePointAt(0);
    if (code < 128) {
      bytes.push(code);
      continue;
    }
    const mapped = UNICODE_TO_WIN1254_BYTE.get(code);
    if (mapped !== undefined) {
      bytes.push(mapped);
      continue;
    }
    const utf8 = new TextEncoder().encode(ch);
    for (let j = 0; j < utf8.length; j += 1) bytes.push(utf8[j]);
  }
  return bytes;
}

/** mailto query parçası için: Win1254 + yüzde kodlama (Outlook uyumlu). */
export function encodeMailtoParamForOutlook(str) {
  const normalized = typeof str === "string" ? str.replace(/\r\n/g, "\n") : "";
  return percentEncodeBytes(stringToWindows1254Bytes(normalized));
}
