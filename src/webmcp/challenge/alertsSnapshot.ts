// src/webmcp/challenge/alertsSnapshot.ts
// ────────────────────────────────────────────────────────────────────────────
// 📢 **สแนปช็อตประกาศเตือนภัยทางการ** — ⛔ ไฟล์นี้ถูกสร้างด้วยสคริปต์ ห้ามแก้ด้วยมือ
//
// สร้างโดย: `node scripts/webmcp-sync-alerts.mjs`
// ถ่ายจากของจริงเมื่อ: **2026-08-31T05:17:14.001Z**
//
// 🔴 **ของนี้ไม่สด และต้องประกาศตัวเองเสมอ** — ทุกใบออกไปพร้อม `cached: true`
//    เหตุผลที่ตัวส่งแข่งใช้สแนปช็อตแทนการยิงสด อยู่ในหัว `scripts/webmcp-sync-alerts.mjs`
//    (สรุป: แผนกำหนดให้ตัวส่งแข่งมีจุดที่มีชีวิตจุดเดียวคือชั้นอากาศ ⇒ ไม่พึ่งหลังบ้านเราช่วงแช่แข็ง)
//
// 🔑 เก็บเฉพาะ **ฉบับที่ยังมีผล** ตามที่หลังบ้านคัดมาแล้ว ([[C-17]]) ⛔ ไม่ใช่ทุกฉบับในดัชนี
// 🔬 รหัสจังหวัดใน `provinces` เป็น **2 หลัก** ตรงกับทะเบียน ([[L-434]])

export interface SnapshotAlert {
  event: string | null;
  severity: string | null;
  headline: string | null;
  provinces: string[];
  sent: string | null;
  expires: string | null;
}

/** เวลาที่ถ่ายของจริง — ⛔ ห้ามแทนด้วยเวลาปัจจุบันตอนรัน */
export const ALERTS_CAPTURED_AT = '2026-08-31T05:17:14.001Z';

/** ถ้อยคำเครดิตที่ต้นทางกำหนดเอง (R14) — ⛔ ห้ามเขียนขึ้นเอง */
export const ALERTS_ATTRIBUTION = 'Warnings: Thai Meteorological Department (public domain)';

export const ALERTS_SNAPSHOT: readonly SnapshotAlert[] = [
  {
    "event": "Heavy Rain",
    "severity": "Severe",
    "headline": "พื้นที่เสี่ยงภัยฝนตกหนักบริเวณประเทศไทย",
    "provinces": [
      "21",
      "25",
      "26",
      "34",
      "35",
      "37",
      "39",
      "41",
      "42",
      "43",
      "44",
      "45",
      "46",
      "47",
      "49",
      "50",
      "51",
      "52",
      "53",
      "54",
      "55",
      "56",
      "57",
      "62",
      "64",
      "65",
      "66",
      "67",
      "71"
    ],
    "sent": "2026-08-31T06:01:00+07:00",
    "expires": "2026-08-31T18:00:00+07:00"
  },
  {
    "event": "Very Heavy Rain",
    "severity": "Extreme",
    "headline": "พื้นที่เสี่ยงภัยฝนตกหนักมากบริเวณประเทศไทย",
    "provinces": [
      "22",
      "23",
      "38",
      "48",
      "58",
      "63"
    ],
    "sent": "2026-08-31T05:55:00+07:00",
    "expires": "2026-08-31T18:00:00+07:00"
  }
] as const;

/** ประกาศที่ครอบคลุมจังหวัดนี้ — เทียบรหัสตรงตัว ⛔ ไม่เดา */
export function alertsForProvince(code: string): SnapshotAlert[] {
  return ALERTS_SNAPSHOT.filter((alert) => alert.provinces.includes(code));
}
