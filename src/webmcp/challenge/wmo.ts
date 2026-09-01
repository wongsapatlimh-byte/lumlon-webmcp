// src/webmcp/challenge/wmo.ts
// ────────────────────────────────────────────────────────────────────────────
// ☁️ **รหัสสภาพอากาศ WMO → คำอธิบายภาษาอังกฤษ** (ใช้เฉพาะตัวส่งแข่ง)
//
// 🔴 **เจ้าของกติกาตัวจริงคือหลังบ้าน** — `src/services/weather/providers/openMeteo.js`
//    (`WMO_CODE_MAP`) · ไฟล์นี้คือ **ก๊อปที่ถอดมาเมื่อ 29 ส.ค. 2026** เพราะตัวส่งแข่ง
//    **ไม่มี backend** โดยตั้งใจ (มติ D-3) ⇒ ไม่มีทางเรียกของจริงได้
//
// ⚠️ **หนี้ที่รู้ตัว:** นี่คือก๊อปที่ 2 ของตารางเดียวกัน ⇒ วันที่หลังบ้านแก้คำ ที่นี่จะไม่รู้
//    ✅ ที่ยอมรับได้เพราะ ① ตารางนี้เป็นการถอดมาตรฐานสาธารณะ (WMO 4677) ซึ่งนิ่งมาก
//       ② ผลของการเพี้ยนคือ **คำบรรยายต่างกันเล็กน้อย** ⛔ ไม่ใช่ตัวเลขหรือคำตัดสินความปลอดภัยผิด
//    ⛔ ถ้าวันไหนตารางนี้เริ่มมีผลต่อ *คำตัดสิน* (ไม่ใช่แค่คำบรรยาย) ต้องเลิกก๊อปแล้วหาทางอื่นทันที

/** ถอดจาก BE `WMO_CODE_MAP` เมื่อ 29 ส.ค. 2026 */
const WMO: Record<number, string> = {
  0: 'clear sky',
  1: 'mainly clear',
  2: 'partly cloudy',
  3: 'overcast',
  45: 'fog',
  48: 'depositing rime fog',
  51: 'light drizzle',
  53: 'moderate drizzle',
  55: 'dense drizzle',
  56: 'light freezing drizzle',
  57: 'dense freezing drizzle',
  61: 'slight rain',
  63: 'moderate rain',
  65: 'heavy rain',
  66: 'light freezing rain',
  67: 'heavy freezing rain',
  71: 'slight snow fall',
  73: 'moderate snow fall',
  75: 'heavy snow fall',
  77: 'snow grains',
  80: 'slight rain showers',
  81: 'moderate rain showers',
  82: 'violent rain showers',
  85: 'slight snow showers',
  86: 'heavy snow showers',
  95: 'thunderstorm',
  96: 'thunderstorm with slight hail',
  99: 'thunderstorm with heavy hail',
};

/**
 * แปลงรหัสเป็นคำ — **รหัสที่ไม่รู้จักคืน `null` ⛔ ไม่เดา**
 * 🔑 คำบรรยายที่มั่วแย่กว่าไม่มีคำบรรยาย เพราะ agent จะเอาไปพูดต่อเป็นข้อเท็จจริง
 */
export function describeWmo(code: unknown): string | null {
  if (typeof code !== 'number' || !Number.isFinite(code)) return null;
  return WMO[code] ?? null;
}

/**
 * ⏱️ **แปลงเวลาท้องถิ่นของ Open-Meteo เป็น ISO 8601 ที่มี offset**
 *
 * 🪤 **กับดักที่ต้องรู้:** Open-Meteo คืนเวลาเป็น `"2026-08-29T13:00"` — **ไม่มีโซนเวลาติดมา**
 *    ⇒ `new Date("2026-08-29T13:00")` จะถูกตีความเป็นเวลาท้องถิ่น **ของเครื่องที่รันโค้ด**
 *    ⇒ เซิร์ฟเวอร์ที่อยู่คนละโซน (Vercel รันที่ไหนก็ได้) จะได้เวลาผิดเป็นชั่วโมง ๆ โดยไม่มี error
 *    ⇒ แสตมป์เวลาที่เพี้ยนคือแสตมป์ที่แย่กว่าไม่มีแสตมป์ เพราะมันดูน่าเชื่อ
 * ✅ หลังบ้านเจอปัญหานี้ไปแล้วและแก้ด้วย `localIsoToEpoch` — ที่นี่ใช้หลักเดียวกัน
 *    โดยประกอบ offset จาก `utc_offset_seconds` ที่ต้นทางส่งมาให้เอง
 */
export function toIsoWithOffset(localIso: unknown, utcOffsetSeconds: unknown): string | null {
  if (typeof localIso !== 'string' || !localIso) return null;
  const offset = typeof utcOffsetSeconds === 'number' && Number.isFinite(utcOffsetSeconds) ? utcOffsetSeconds : 0;

  const sign = offset < 0 ? '-' : '+';
  const abs = Math.abs(offset);
  const hh = String(Math.floor(abs / 3600)).padStart(2, '0');
  const mm = String(Math.floor((abs % 3600) / 60)).padStart(2, '0');

  /** ต้นทางส่ง `YYYY-MM-DDTHH:mm` (ไม่มีวินาที) ⇒ เติมให้ครบก่อนติด offset */
  const withSeconds = /\d{2}:\d{2}:\d{2}$/.test(localIso) ? localIso : `${localIso}:00`;
  const candidate = `${withSeconds}${sign}${hh}:${mm}`;
  return Number.isNaN(Date.parse(candidate)) ? null : candidate;
}
