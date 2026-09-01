// src/webmcp/challenge/fallback.ts
// ────────────────────────────────────────────────────────────────────────────
// 🛟 **สแนปช็อตสำรองของตัวส่งแข่ง** (`C3` · มติ D-4)
//
// 🔴 **ทำไมต้องมี:** ผลงานถูกแช่แข็ง 3–23 ก.ย. (ห้าม redeploy) และกรรมการอาจเปิดเว็บ
//    ตอนที่ต้นทางล่มพอดี ⇒ **เว็บที่ตอบไม่ได้ เสียคะแนนมากกว่าเว็บที่บอกตรง ๆ ว่ากำลังใช้สำเนา**
//
// 🔑 **กติกาเหล็กของไฟล์นี้ — ของสำรองต้องประกาศตัวเองเสมอ**
//    ทุกก้อนติด `cached: true` และคำตอบติด `note` ⇒ ⛔ ห้ามมีทางไหนที่ข้อมูลสำรอง
//    ออกไปโดยหน้าตาเหมือนข้อมูลสด · ตัวเลขเก่าที่ดูเหมือนสด **อันตรายกว่าไม่มีตัวเลข**
//    โดยเฉพาะกับเว็บที่คนใช้ตัดสินใจเรื่องความปลอดภัย
//
// 📌 **ที่มาของตัวเลข:** ค่ากลาง ๆ ที่ไม่ชี้นำ — ⛔ **ไม่ได้ก๊อปค่าจริงของจังหวัดใดจังหวัดหนึ่งมา**
//    เพราะค่าจริงของเมื่อวานที่ติดป้าย cached ยังทำให้คนเข้าใจว่า *"ที่นี่อากาศประมาณนี้"*
//    ซึ่งเป็นการชี้นำที่เราไม่มีสิทธิ์ทำตอนที่อ่านข้อมูลจริงไม่ได้

export interface FallbackAir {
  pm25: number;
  aqi: number | null;
  category: string | null;
  observedAt: string | null;
  source: string;
  cached: boolean;
}

export interface FallbackForecastPoint {
  at: string | null;
  tempC: number | null;
  rainChance: number | null;
  summary: string | null;
}

export interface FallbackForecast {
  points: FallbackForecastPoint[];
  observedAt: string | null;
  source: string;
  cached: boolean;
}

/**
 * 🔴 `observedAt: null` โดยตั้งใจ — **เราไม่รู้ว่าค่านี้เป็นของเวลาไหน เพราะมันไม่ใช่ค่าที่วัดมา**
 *    ⛔ ห้ามใส่เวลาปัจจุบัน ซึ่งจะทำให้ข้อมูลสำรองดูเหมือนเพิ่งวัดมาสด ๆ
 */
export const FALLBACK_AIR: FallbackAir = {
  pm25: 20,
  aqi: null,
  category: null,
  observedAt: null,
  source: 'LUMLON bundled snapshot',
  cached: true,
};

export const FALLBACK_FORECAST: FallbackForecast = {
  points: [],
  observedAt: null,
  source: 'LUMLON bundled snapshot',
  cached: true,
};

/**
 * ประโยคที่ต้องเดินทางไปถึงทั้งจอและ agent เมื่ออยู่ในโหมดสำรอง
 *
 * 🔴 **มี 2 ประโยค ⛔ ห้ามยุบเป็นอันเดียว** — คนอ่านต้องแยกออกว่า
 *    *ต้นทางล่ม* (เรื่องชั่วคราว รอสักครู่แล้วลองใหม่ได้) ต่างจาก
 *    *เจ้าของตั้งค่าให้ตอบจากสำเนา* (สภาพถาวรของ deployment นี้ รอไปก็ไม่เปลี่ยน)
 *    ⇒ ประโยคเดียวที่ใช้ทั้ง 2 กรณี = โกหกกรณีหนึ่งเสมอ
 */
export const FALLBACK_NOTE =
  'Upstream data could not be read just now, so this answer uses a bundled snapshot. Treat the numbers as indicative, not current.';

/** 🔀 คู่ของ `FALLBACK_NOTE` สำหรับกรณี "เลือกสำเนาเอง" (สวิตช์แหล่งข้อมูล `dataSources.ts`) */
export const BUNDLED_BY_CONFIG_NOTE =
  'This deployment is configured to answer from a bundled snapshot instead of live upstream data. Treat the numbers as indicative, not current.';
