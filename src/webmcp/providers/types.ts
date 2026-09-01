// src/webmcp/providers/types.ts
// ────────────────────────────────────────────────────────────────────────────
// 🔑 **ชั้น provider — จุดเดียวที่ตอบว่า "ข้อมูลมาจากไหน"** (`B2` ของ scope · มติ D-6)
//
// 🔴 **นี่คือชิ้นที่ทำให้โมดูลนี้เป็นเกรดใช้จริง ไม่ใช่ของสาธิต:**
//    ตัว tool **ห้ามรู้** ว่าข้อมูลมาจาก BFF จริงหรือแหล่งเดโม ⇒ ตัวส่งแข่งกับผลิตภัณฑ์จริง
//    ใช้โค้ด tool **ไฟล์เดียวกันทุกบรรทัด** ต่างกันแค่ตัวที่ถูกฉีดเข้ามาตรงนี้
//    ⇒ ของที่กรรมการเห็น = ของจริงที่ย่อส่วน ⛔ ไม่ใช่ฉากถ่ายหนัง (มติ D-2)
//
// ── กติกาที่ implementation ทุกตัวต้องทำตาม ──
//   ① **ทุกก้อนข้อมูลติดแสตมป์** `observedAt` + `source` + `cached` (มติ D-16) — ไม่มีข้อยกเว้น
//   ② **ขาดบางส่วน ≠ ล้มทั้งคำตอบ** ⇒ ใส่ `gaps` บอกว่าอะไรหายเพราะอะไร (หลัก fail-closed §5 ของ scope)
//   ③ **ห้ามรับ/คืนพิกัดของผู้ใช้** — ตำแหน่งคือชื่อ/รหัสจังหวัด (มติ D-26 / GEO-0)

import type { Stamped, ToolGap } from '../types';

/** ผลค้นหา 1 ใบ — ⛔ ไม่มี lat/lon โดยตั้งใจ (agent ไม่ต้องใช้ และค่าเชิงความหมายอ่านง่ายกว่า) */
export interface LocationHit {
  /**
   * รหัสจังหวัดจากทะเบียนหลังบ้าน — **2 หลัก** เช่น `"50"` (ยิงของจริงยืนยัน 29 ส.ค. 2026)
   * ⛔ **ไม่ใช่รูป ISO `"TH-50"`** ที่โมเดลภาษามักเดาเอง · `null` = สถานที่ย่อยที่ทะเบียนไม่มีรหัสให้
   */
  code: string | null;
  kind: 'province' | 'place';
  nameTh: string;
  nameEn: string;
}

/** คุณภาพอากาศ ณ จุดหนึ่ง — ทุกช่องเป็น `null` ได้ เพราะต้นทางไม่ได้มีครบเสมอ */
export interface AirQualityReading {
  aqi: number | null;
  pm25: number | null;
  /** ระดับเชิงความหมาย เช่น `"moderate"` — ⛔ ไม่ใช่สีหรือเลขดัชนีดิบ (agent เอาไปเล่าต่อได้เลย) */
  category: string | null;
}

/** พยากรณ์ 1 ช่วงเวลา */
export interface ForecastPoint {
  /** ISO 8601 ของช่วงเวลาที่พยากรณ์ถึง */
  at: string;
  tempC: number | null;
  /** คำบรรยายสภาพอากาศแบบสั้น EN */
  summary: string | null;
  /** โอกาสฝนเป็นเปอร์เซ็นต์ */
  rainChance: number | null;
}

/**
 * ประกาศเตือนภัยทางการ 1 ฉบับ
 *
 * 🔴 **เฉพาะฉบับที่ "ยังมีผล"** ([[C-17]]) — ก่อน 28 ส.ค. 2026 ชั้นนี้เคยนับฉบับที่อยู่ในดัชนี
 *    แล้วพบว่า **4 ใน 5 ฉบับหมดอายุไปแล้ว** ⇒ agent ที่ตอบว่า "มีประกาศเตือน 5 ฉบับ"
 *    จากตัวเลขนั้นคือการทำให้คนตกใจกับเรื่องที่จบไปแล้ว 2 วัน
 */
export interface HazardAlertItem {
  event: string | null;
  severity: string | null;
  headline: string | null;
  /** รายชื่อจังหวัดที่ประกาศครอบคลุม (ตามที่ต้นทางระบุ) */
  provinces: string[];
  sent: string | null;
  expires: string | null;
}

/** ผลของ `get_environment_snapshot` ที่ provider คืนกลับ */
export interface EnvironmentSnapshot {
  place: LocationHit;
  air: Stamped<AirQualityReading> | null;
  forecast: Stamped<ForecastPoint[]> | null;
  alerts: Stamped<HazardAlertItem[]> | null;
  /** ส่วนที่ขาด — ⛔ ห้ามปล่อยว่างทั้งที่มีของหาย (ดูกติกา ② หัวไฟล์) */
  gaps: ToolGap[];
}

export interface SnapshotRequest {
  /** ชื่อหรือรหัสจังหวัดตามที่ผู้ใช้/agent พิมพ์มา — provider เป็นคนแปลเป็นทะเบียน */
  location: string;
  signal?: AbortSignal;
}

export interface SearchRequest {
  query: string;
  limit?: number;
  signal?: AbortSignal;
}

/**
 * สัญญาของชั้นข้อมูล — มี 2 ตัวจริงในระบบ:
 *   · `realProvider` → ยิง BFF ของแอปจริง (ใช้ auth/validation เดิมทั้งหมดตามคู่มือ OpenAI)
 *   · `demoProvider` → API routes ในตัวของตัวส่งแข่ง (สร้างวันถัดไปตามแผน §7 ของ scope)
 */
export interface WebMCPDataProvider {
  readonly id: 'real' | 'demo';
  /** ชื่อแหล่งข้อมูลทั้งหมดที่ provider นี้ใช้ — ไปโผล่ในหน้าเครดิต README (R14) */
  readonly attributions: readonly string[];

  searchLocations(request: SearchRequest): Promise<LocationHit[]>;
  getEnvironmentSnapshot(request: SnapshotRequest): Promise<EnvironmentSnapshot>;
}
