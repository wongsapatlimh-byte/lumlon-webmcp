/**
 * สูตร AQI + ระดับสี — **ที่เดียวของทั้งแอป**
 * ============================================================================
 * ย้ายออกมาจาก `src/app/dashboard/page.tsx` เมื่อ 19 ส.ค. 2026 (เฟส P0.5 เลนมาสคอต)
 * เหตุผล: หน้ามาสคอตต้องแสดง AQI เหมือนกับ Dashboard · ถ้าก๊อปสูตรไปอีกชุด วันหนึ่งเลขบนการ์ด
 * 2 ใบจะไม่ตรงกันโดยไม่มีอะไรฟ้อง — กับดักเดียวกับ "2 ตารางเพดานที่ขัดกัน" ในเลน 3D
 *
 * ⚠️ ตัวเลขและถ้อยคำทุกตัวยกมาเหมือนเดิมเป๊ะ (ไม่ได้ปรับเกณฑ์) — ตั้งใจให้เป็นการ *ย้าย* ล้วน ๆ
 */

/** สูตร AQI มาตรฐาน US EPA (จากค่าฝุ่น PM2.5) */
export function calculateAQI(pm25: number): number {
  const breakpoints = [
    { cLow: 0.0, cHigh: 12.0, iLow: 0, iHigh: 50 },
    { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
    { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
    { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 },
    { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
    { cLow: 250.5, cHigh: 350.4, iLow: 301, iHigh: 400 },
    { cLow: 350.5, cHigh: 500.4, iLow: 401, iHigh: 500 },
  ];
  const bp = breakpoints.find((b) => pm25 <= b.cHigh) || breakpoints[breakpoints.length - 1];
  const aqi = ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (pm25 - bp.cLow) + bp.iLow;
  return Math.round(aqi);
}

export interface AqiStatus {
  label: string;
  bg: string;
  text: string;
  border: string;
  icon: string;
}

/**
 * 🌐 ภาษาของป้ายระดับ — **เพิ่ม 23 ส.ค. 2026**
 *
 * เดิมป้ายทั้งหมดเป็น **ไทยล้วน** ⇒ ผู้ใช้ที่ตั้งภาษาเป็น EN/CN/JP/ES เห็น "ดีเยี่ยม" ปนอยู่กลางจอ
 * ที่เหลือเป็นภาษาของเขา · ไม่ใช่แค่เรื่องความสวย — ป้ายพวกนี้เป็น **ข้อมูลด้านสุขภาพ**
 * ที่ผู้ใช้ต้องอ่านออกเพื่อตัดสินใจว่าจะออกไปข้างนอกไหม
 *
 * 🔴 ค่าปริยายเป็น `'TH'` โดยตั้งใจ — ผู้เรียกเดิมที่ยังไม่ส่งภาษามาจะได้พฤติกรรมเดิมเป๊ะ
 *    (เปลี่ยนทีละจุดได้ ไม่ต้องแก้ทุกที่พร้อมกัน) · จุดที่ยังไม่ส่ง = หนี้ที่เห็นได้จากการ grep
 */
export type AqiLang = 'TH' | 'EN' | 'CN' | 'JP' | 'ES';

/** ป้ายระดับ AQI 6 ระดับ × 5 ภาษา — เรียงจากดีที่สุดไปแย่ที่สุด */
const AQI_LABELS: Record<AqiLang, [string, string, string, string, string, string]> = {
  TH: ['ดีเยี่ยม', 'ปานกลาง', 'เริ่มมีผล', 'มีผลกระทบ', 'อันตรายมาก', 'อันตรายสุด'],
  EN: ['Good', 'Moderate', 'Unhealthy for some', 'Unhealthy', 'Very unhealthy', 'Hazardous'],
  CN: ['优', '良', '轻度污染', '中度污染', '重度污染', '严重污染'],
  JP: ['良好', '普通', '敏感な人に影響', '健康に影響', '非常に不健康', '危険'],
  ES: ['Buena', 'Moderada', 'Dañina para sensibles', 'Dañina', 'Muy dañina', 'Peligrosa'],
};

/** ป้ายระดับ UV 5 ระดับ × 5 ภาษา (เกณฑ์ WHO) */
const UV_LABELS: Record<AqiLang, [string, string, string, string, string]> = {
  TH: ['ต่ำ', 'ปานกลาง', 'สูง', 'สูงมาก', 'อันตราย'],
  EN: ['Low', 'Moderate', 'High', 'Very high', 'Extreme'],
  CN: ['低', '中等', '高', '很高', '极高'],
  JP: ['弱い', '中程度', '強い', '非常に強い', '極端に強い'],
  ES: ['Bajo', 'Moderado', 'Alto', 'Muy alto', 'Extremo'],
};

/** ภาษาที่ไม่รู้จัก → ไทย (ค่าปริยายของแอป) แทนที่จะพัง */
function pickLang(lang?: string): AqiLang {
  const up = String(lang || 'TH').toUpperCase();
  return (up in AQI_LABELS ? up : 'TH') as AqiLang;
}

/**
 * สีและคำอธิบายระดับ AQI (คลาส Tailwind — ใช้ร่วมกันทั้ง Dashboard และหน้ามาสคอต)
 * 🔴 **เกณฑ์ตัวเลขไม่เปลี่ยน** — การเพิ่มภาษาแตะเฉพาะ `label` เท่านั้น
 */
export function getAqiStatus(aqi: number, lang?: string): AqiStatus {
  const L = AQI_LABELS[pickLang(lang)];
  if (aqi <= 50) return { label: L[0], bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200", icon: "text-emerald-500" };
  if (aqi <= 100) return { label: L[1], bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200", icon: "text-yellow-500" };
  if (aqi <= 150) return { label: L[2], bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200", icon: "text-orange-500" };
  if (aqi <= 200) return { label: L[3], bg: "bg-red-100", text: "text-red-700", border: "border-red-200", icon: "text-red-500" };
  if (aqi <= 300) return { label: L[4], bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200", icon: "text-purple-500" };
  return { label: L[5], bg: "bg-rose-900", text: "text-rose-100", border: "border-rose-900", icon: "text-rose-500" };
}

/**
 * ระดับ UV ตามเกณฑ์ WHO — 🔴 ใช้ได้ต่อเมื่อ **มีค่าจริง** เท่านั้น
 * ⚠️ ข้อเท็จจริงที่ต้องรู้ (19 ส.ค. 2026): backend แพ็กเกจปัจจุบัน **ไม่ส่ง `uv_index` มา**
 *    ⇒ ผู้เรียกต้องรองรับกรณี `null` และแสดงว่า "ไม่มีข้อมูล" — ห้ามเดาค่าจากแดด/เวลาเด็ดขาด
 */
export function getUvStatus(uv: number, lang?: string): { label: string; bg: string; text: string; border: string } {
  const L = UV_LABELS[pickLang(lang)];
  if (uv < 3) return { label: L[0], bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" };
  if (uv < 6) return { label: L[1], bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200" };
  if (uv < 8) return { label: L[2], bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200" };
  if (uv < 11) return { label: L[3], bg: "bg-red-100", text: "text-red-700", border: "border-red-200" };
  return { label: L[4], bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" };
}
