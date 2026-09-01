// src/webmcp/providers/provinceMatch.ts
// ────────────────────────────────────────────────────────────────────────────
// 🔎 **การแปลง "สิ่งที่ agent ส่งมา" → "ใบในทะเบียน"** — ที่เดียวสำหรับทั้ง 2 provider
//
// 🔴 **ทำไมต้องแยกออกมา:** `realProvider` กับ `demoProvider` ต้องตีความคำเดียวกันเหมือนกันเป๊ะ
//    ⇒ ถ้าเขียนคนละที่ วันหนึ่งตัวส่งแข่งกับผลิตภัณฑ์จริงจะ **หาสถานที่เจอไม่เท่ากัน**
//    ซึ่งเป็นบั๊กที่ไม่มีใครสังเกตจนกว่าจะมีคนถามคำถามเดียวกันกับ 2 เว็บแล้วได้คนละคำตอบ
//
// 🔑 **นี่คือการเดา "เจตนาของผู้เรียก" ⛔ ไม่ใช่การตัดสิน "ข้อเท็จจริงของทะเบียน"**
//    (กติกาเดียวกับที่ `hazardSearch` แยกไว้ — ฝั่งคำค้นยอมหลวมได้ ฝั่งทะเบียนต้องตรงตัว)
//    ⇒ รับรูปที่คนและ agent เขียนกันจริง แล้ว **เทียบกับทะเบียนแบบตรงตัวเสมอ**
//    ⛔ ห้ามใช้ที่นี่ไปสร้าง/เดารหัสที่ทะเบียนไม่มี

import { normalizeSearchText, searchPlaces } from '@/lib/hazardSearch';

/** รูปขั้นต่ำที่ตัวจับคู่ต้องการ — ทั้ง `HazardProvince` และ `ChallengeProvince` เข้ารูปนี้ */
export interface MatchableProvince {
  code: string;
  th: string;
  en: string;
  lat: number;
  lon: number;
}

/**
 * 🔢 รูปรหัสที่ยอมรับ
 *
 * 🔬 **ยิงของจริง 29 ส.ค. 2026:** ทะเบียนใช้รหัส **2 หลัก** (`"10"` `"50"`)
 *    ⛔ **ไม่ใช่ `"TH-50"`** — แต่ LLM เดารูป ISO เองบ่อยมากเพราะเป็นรูปมาตรฐานที่โมเดลรู้จักดี
 *    ⇒ ไม่รับรูปนั้นด้วย = agent จะได้ *"ไม่รู้จักสถานที่"* ทั้งที่จังหวัดนั้นมีอยู่ ([[L-434]])
 */
export function provinceCodeCandidates(raw: string): string[] {
  let s = String(raw || '').trim().toUpperCase();
  if (s.startsWith('TH-')) s = s.slice(3);
  if (!/^\d{1,2}$/.test(s)) return [];
  return [...new Set([s, s.padStart(2, '0')])];
}

/**
 * หาจังหวัดจากรหัสหรือชื่อ (ไทย/อังกฤษ/สะกดหลวม) — คืน `null` เมื่อไม่มีในทะเบียน
 *
 * ⛔ **ไม่โยน error** โดยตั้งใจ — ผู้เรียกเป็นคนตัดสินว่า "ไม่พบ" แปลว่าอะไรในบริบทของมัน
 *    (ค้นหา = คำตอบปกติ · snapshot = ปฏิเสธพร้อมบอกทางไปต่อ)
 */
export function matchProvince<T extends MatchableProvince>(list: readonly T[], location: string): T | null {
  const raw = String(location || '').trim();
  if (!raw) return null;

  const candidates = provinceCodeCandidates(raw);
  if (candidates.length) {
    const byCode = list.find((p) => candidates.includes(p.code));
    if (byCode) return byCode;
  }

  const hits = searchPlaces({ query: raw, provinces: [...list], places: [], limit: 1 });
  if (!hits.length) return null;
  const label = normalizeSearchText(hits[0].label);
  return list.find((p) => normalizeSearchText(p.th) === label) ?? null;
}

/**
 * ค้นหาหลายใบ — คืนใบจากทะเบียนจริง ⛔ ไม่ประกอบใบใหม่จากผลค้นหา
 * 🔑 เพราะผลค้นหาให้แค่ `label` ส่วน **รหัส** ต้องมาจากทะเบียนเท่านั้น ([[L-415]])
 */
export function searchProvinces<T extends MatchableProvince>(
  list: readonly T[],
  query: string,
  limit: number,
): T[] {
  return searchPlaces({ query, provinces: [...list], places: [], limit })
    .map((hit) => list.find((p) => normalizeSearchText(p.th) === normalizeSearchText(hit.label)))
    .filter((p): p is T => Boolean(p));
}
