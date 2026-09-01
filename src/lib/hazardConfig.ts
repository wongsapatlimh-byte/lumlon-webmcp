// src/lib/hazardConfig.ts
// ────────────────────────────────────────────────────────────────────────────
// ⚙️ **สถานะสวิตช์ + รอบข้อมูล + ถ้อยคำ ของจอแผนที่ภัยพิบัติ** (`v7.1/SP2` WP4 · เลน 3)
//
// รูปของ payload มาจากสัญญา [[C-14]] (สวิตช์ + `dataRounds` §7) และ [[C-15]] (ก้อน `copy`)
// ⛔ ไฟล์นี้ **ไม่ตั้งค่าเริ่มต้นแทนหลังบ้านแม้แต่ฟิลด์เดียว** — อ่านไม่ได้ = บอกว่าอ่านไม่ได้
//    (จอที่เดาค่าแทนสวิตช์ = จอที่โชว์ชั้นข้อมูลที่แอดมินสั่งปิดไปแล้ว)
//
// ── 🔴 กติกาเวลาที่จอนี้ยืนอยู่บน ──
//   `POLL_MS` — จอต้อง revalidate `/config` ทุก **≤15 วินาที** ตลอดเวลาที่เปิดค้าง + ทุกครั้งที่กลับเข้า
//   foreground · เพราะข้อบังคับของ Codex gate รอบ 3 คือ **"แอดมินสั่งปิดชั้นข้อมูลแล้วชั้นนั้นต้องหาย
//   จากจอที่เปิดค้างอยู่ ภายใน ≤30 วินาที โดยผู้ใช้ไม่ต้องรีเฟรช"**
//
//   `TRUST_MS` — 🔴 **และถ้าเราติดต่อ `/config` ไม่ได้เลยล่ะ?**
//   ข้อบังคับข้างบนพูดถึงกรณีที่เรารู้ว่าถูกปิด แต่กรณีที่ **เราไม่รู้** อันตรายกว่า:
//   จอจะแสดงชั้นข้อมูลต่อไปเรื่อย ๆ ด้วยสิทธิ์ที่ยืนยันครั้งสุดท้ายเมื่อไหร่ก็ไม่รู้
//   ⇒ **fail-closed**: ยืนยันสถานะสวิตช์ไม่ได้เกิน `TRUST_MS` = **หยุดแสดงข้อมูลชั้นภัยพิบัติ**
//     (แผนที่ฐานยังอยู่ · ขึ้นป้ายบอกตรง ๆ ว่ายืนยันสถานะไม่ได้) ⛔ ไม่ใช่แสดงต่อเงียบ ๆ

import type { HazardCopyPayload } from './hazardCopyView';

/** ⏱️ ยิงถี่กว่า `max-age=15` ของหลังบ้านเล็กน้อย ⇒ ไม่มีช่วงที่จอถือของเก่าโดยไม่ได้ถาม */
export const CONFIG_POLL_MS = 10_000;

/**
 * ⏱️ เพดานความเชื่อใจของสถานะสวิตช์ — ยืนยันครั้งล่าสุดเกินเวลานี้ = เลิกแสดงข้อมูลชั้นภัยพิบัติ
 * 🔑 25 วิ + รอบยิงทุก 10 วิ ⇒ ตรวจพบและหยุดแสดงได้ภายใน **≤30 วินาที** ตามข้อบังคับ
 */
export const CONFIG_TRUST_MS = 25_000;

/** หน้าต่างเวลาที่ contract เปิดให้ขอ (`C-14` §7 · แผน FINAL §6) */
export type HazardWindow = 'latest' | '30d';

/**
 * 🔴 **หน้าต่างเวลาเริ่มต้นของจอ = `30d`**
 *
 * 🔬 ที่มาเดิม (28 ส.ค. 2026 06:0x ICT): `latest` (รอบ 1 วัน) = **0 เซลล์ทั้งประเทศ · `imageDates: []`**
 *    วัด 2 วันติดกันได้ผลเดียวกัน ⇒ จอที่ตั้ง `latest` จะว่างเปล่าและไม่มีแม้แต่วันที่ของภาพจะเขียน
 *
 * 🪤 **แก้ข้อเท็จจริง 29 ส.ค. 2026:** วัดใหม่แล้ว `latest` = **2,627 เซลล์ · 1 ฉาก (2026-08-28)**
 *    ⇒ **"0 เซลล์" เป็นสภาพของ 2 วันนั้น ⛔ ไม่ใช่คุณสมบัติถาวรของรอบ 1 วัน**
 *    ⇒ ⛔ ห้ามใครเขียนโค้ด/เทสที่สมมติว่ารอบ 1 วันว่างเสมอ
 *    ✅ **แต่ค่าเริ่มต้นยังเป็น `30d` เหมือนเดิม** ด้วยเหตุผลที่แข็งกว่าเดิม: รอบ 1 วันครอบคลุมแค่
 *      **9%** ของเซลล์ที่รอบ 30 วันเห็น (2,627 จาก 29,238) ⇒ ตั้งเป็นค่าเริ่มต้นเมื่อไร ผู้ใช้ 91%
 *      ของพื้นที่ที่มีน้ำจะเห็นจอเปล่าโดยไม่รู้ว่าเป็นเพราะกรอบเวลา
 *    📌 ตัวเลขทุกตัวที่ SP0 วัดไว้ (27,612 เซลล์ · เพดาน 4,000 · 39 tile) ก็เป็นของรอบ 30 วันอยู่แล้ว
 */
export const DEFAULT_WINDOW: HazardWindow = '30d';

export interface HazardReason {
  code: string;
  th: string;
  en: string;
}

export interface HazardLayerConfig {
  layerId: string;
  label: string;
  labelEn: string;
  enabled: boolean;
  reason: HazardReason | null;
  attribution: { th: string; en: string; url?: string } | null;
}

/** สถานะรอบข้อมูล — ชุดปิด 6 ค่าตาม `C-14` §7 (🔴 `idle` ≠ `warming`) */
export type HazardRoundState = 'disabled' | 'unavailable' | 'idle' | 'warming' | 'ready' | 'stale';

export interface HazardDataRound {
  state: HazardRoundState;
  imageDates: string[];
  latestImageDate: string | null;
  sceneCount: number;
  sourceRevision: string | null;
}

/**
 * 🗺️ หนึ่งใบในทะเบียน 77 จังหวัดที่หลังบ้านส่งมา ([[C-14]] §8)
 * ⛔ **ห้ามสร้างรายชื่อนี้ฝั่งจอไม่ว่ากรณีใด** — ทะเบียนมีเจ้าของอยู่ที่ BE (`provinceRegistry`)
 *    จอที่ถือรายชื่อเองคือก๊อปที่ 2 ที่จะเพี้ยนเงียบ ๆ วันที่ทะเบียนเปลี่ยน ([[L-415]])
 */
export interface HazardProvince {
  code: string;
  th: string;
  en: string;
  /** จุดกึ่งกลางจังหวัด — ⛔ ไม่ใช่ตำแหน่งของเหตุการณ์ · ใช้เลื่อนกล้องอย่างเดียว */
  lat: number;
  lon: number;
}

export interface HazardConfig {
  stage: string;
  layers: HazardLayerConfig[];
  quakeThresholds: Record<string, number>;
  quakeThresholdSource: string;
  basemapAttribution: { th: string; en: string; url?: string } | string | null;
  copy: HazardCopyPayload;
  dataRounds: { flood: Record<string, HazardDataRound> };
  /** 🆕 [[C-14]] §8 — อาจไม่มีถ้าหลังบ้านยังเป็นรุ่นก่อน ⇒ จอต้องทำงานต่อได้โดยไม่แยกป้าย */
  provinces?: HazardProvince[];
}

/**
 * ชุดชื่อจังหวัดสำหรับ **เทียบตรงตัวหลัง trim** — ⛔ ไม่มีการตัดคำนำหน้าที่นี่
 *
 * 🔴 กติกา "ตัด `จังหวัด`/`จ.` ออกก่อนเทียบ" เป็นของ `provinceRegistry.findByThaiName` **ที่เดียว**
 *    ([[C-14]] §8 ข้อ 4) ⇒ เขียนซ้ำที่นี่เมื่อไร = ก๊อปที่ 2 ของกติกาที่ด่านสแกนสตริงมองไม่เห็น
 *    🔬 และชั้น `places` ของไฟล์แผนที่ไม่เคยส่งชื่อที่มีคำนำหน้ามาเลย (ยิงของจริง 29 ส.ค. 2026)
 *
 * ⚠️ **หลังบ้านรุ่นเก่าไม่ส่ง `provinces` มา** ⇒ คืนชุดว่าง ⇒ จอกลับไปแสดงป้ายแบบเดิมทั้งหมด
 *    ⛔ ไม่ใช่เดาว่าใบไหนเป็นจังหวัด (ป้ายที่ติดยศผิดแย่กว่าป้ายที่ไม่มียศ)
 */
export function provinceNameSet(config: HazardConfig | null): { th: Set<string>; en: Set<string> } {
  const list = config?.provinces;
  if (!Array.isArray(list)) return { th: new Set(), en: new Set() };
  return {
    th: new Set(list.map((p) => p.th)),
    en: new Set(list.map((p) => p.en)),
  };
}

export function findLayer(config: HazardConfig | null, layerId: string): HazardLayerConfig | null {
  if (!config) return null;
  return config.layers.find((l) => l.layerId === layerId) || null;
}

export function floodRound(config: HazardConfig | null, window: HazardWindow): HazardDataRound | null {
  const round = config?.dataRounds?.flood?.[window];
  return round || null;
}

/**
 * ตรวจว่าก้อนที่ได้มาใช้ได้จริงก่อนเอาไปเชื่อ
 *
 * 🔴 **ไม่มีก้อน `copy` = ใช้ไม่ได้** ⛔ ไม่ใช่ "ใช้ได้แต่ไม่มีข้อความ" — จอนี้ทั้งจอสร้างจากถ้อยคำ
 *    ของกลาง ถ้าไม่มี เราจะเหลือแค่รูปสีน้ำเงินที่ไม่มีคำอธิบายข้อจำกัด ซึ่งเป็นสภาพที่อันตรายที่สุด
 *    (ผู้ใช้เห็นแผนที่ที่ดูน่าเชื่อถือ โดยไม่มีประโยคที่บอกว่ามันบอกอะไรไม่ได้บ้าง)
 */
export function isUsableConfig(value: unknown): value is HazardConfig {
  const c = value as HazardConfig | null;
  if (!c || typeof c !== 'object') return false;
  if (!Array.isArray(c.layers)) return false;
  if (!c.copy || typeof c.copy !== 'object') return false;
  if (!c.copy.entries || typeof c.copy.entries !== 'object') return false;
  if (!c.copy.version) return false;
  return true;
}

export class HazardConfigError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'HazardConfigError';
    this.code = code;
  }
}

/**
 * ดึงสถานะจาก BFF ของเราเอง (`/api/web/hazard/config` — ไม่ใช่หลังบ้านตรง)
 *
 * 🔑 `cache: 'no-cache'` = **บังคับ revalidate ทุกครั้ง แต่ยังใช้ `ETag` ได้เต็มที่**
 *    ⇒ ได้ `304` ตัวเปล่าเมื่อไม่มีอะไรเปลี่ยน (ก้อน `copy` ~7.4 KB ไม่ถูกโหลดซ้ำ)
 *    ⛔ **ห้ามใช้ `no-store`** — จะทิ้ง 304 ทั้งหมด ⇒ จอที่เปิดค้าง 10 นาทีโหลดถ้อยคำซ้ำ 60 รอบ
 *    ⛔ **ห้ามใช้ค่า default** — เบราว์เซอร์จะเสิร์ฟจากแคชตาม `max-age=15` โดยไม่ถามหลังบ้านเลย
 *       ⇒ กินเวลาของงบ 30 วินาทีไปฟรี ๆ ในจังหวะที่แอดมินเพิ่งสั่งปิดชั้นข้อมูล
 */
export async function fetchHazardConfig(signal?: AbortSignal): Promise<HazardConfig> {
  const res = await fetch('/api/web/hazard/config', { cache: 'no-cache', signal });
  if (!res.ok) {
    throw new HazardConfigError('CONFIG_HTTP_ERROR', `hazard config: HTTP ${res.status}`);
  }
  const json: unknown = await res.json();
  if (!isUsableConfig(json)) {
    throw new HazardConfigError('CONFIG_SHAPE_INVALID', 'hazard config: ก้อนที่ได้ไม่มีถ้อยคำของกลาง');
  }
  return json;
}
