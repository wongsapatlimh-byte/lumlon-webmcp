// src/lib/hazardSearch.ts
// ────────────────────────────────────────────────────────────────────────────
// 🔎 **ค้นหาสถานที่บนจอแผนที่ภัยพิบัติ** (`v7.1/SP2` WP7 · เลน 3)
//
// **คำสั่งเจ้าของ 28 ส.ค. 2026 ค่ำ:** *"ช่อง search — ทำด้วยครับ ไม่ต้องรอ WebMCP"*
//
// ── 🔴 ข้อบังคับที่ทำให้ช่องค้นหานี้ต่างจากช่องค้นหาทั่วไป ──
//   ⛔ **ห้ามส่งคำค้นไปหลังบ้าน** — กติกาเหล็กของเลนคือ *"ห้ามรับพิกัดจากผู้ใช้"* และ
//      *"ห้าม log ระดับ request เกิน aggregate"* · log ที่บันทึกว่า *ผู้ใช้คนนี้ค้นหา "บ้านโป่ง"*
//      คือ **ข้อมูลความสนใจเชิงตำแหน่ง** ซึ่งเป็นสิ่งเดียวกับที่ทั้งเลนออกแบบมาไม่ให้ออกจากเบราว์เซอร์
//      (ถึงขั้นยอมใช้กริดตายตัว `z/x/y` แทนการรับพิกัด)
//   ⛔ **ห้ามเก็บคำค้นลง `localStorage`** — ข้อห้ามเดียวกับพิกัด (`hazardPrefs.ts` มีเทสยึด)
//   ⇒ **ทั้งไฟล์นี้เป็นฟังก์ชันบริสุทธิ์ ไม่มี I/O เลยแม้แต่บรรทัดเดียว** — ตรวจได้ด้วยตาและด้วยเทส
//
// ── ✅ แหล่งข้อมูลที่ใช้ได้โดยไม่ต้องยิงใคร ──
//   ① **ทะเบียน 77 จังหวัด** ที่มากับ `/config` ([[C-14]] §8) — ครบทั้งประเทศเสมอ
//   ② **ชั้น `places`** ของกระเบื้องที่ **โหลดแล้ว** — 🪤 มีเฉพาะบริเวณที่เคยมองเห็น
//      ⇒ **ค้นหาอำเภอที่อยู่นอกจอจะไม่เจอ** ⇒ ⛔ **ห้ามให้จอเงียบ** ต้องบอกว่าไม่เจอเพราะอะไร

import type { HazardProvince } from './hazardConfig';
import type { PlaceCandidate } from './hazardPlaceLabels';

export type SearchResultKind = 'province' | 'place';

export interface SearchResult {
  kind: SearchResultKind;
  /** ชื่อที่แสดงในรายการ — มาจากทะเบียน/ไฟล์แผนที่ ⛔ ไม่ได้ประกอบขึ้นเอง */
  label: string;
  /** ชื่อรอง (อีกภาษา) ถ้ามี — ช่วยให้ผู้ใช้ยืนยันว่าเลือกถูกใบ */
  sublabel: string | null;
  lat: number;
  lon: number;
  /** zoom ที่จะเลื่อนไปหา — จังหวัดกว้างกว่าจึงซูมน้อยกว่า */
  zoom: number;
  /** คะแนนความตรง (มากกว่า = ตรงกว่า) — เปิดไว้ให้เทสตรวจลำดับได้ */
  score: number;
}

/**
 * 🔴 **ตัวปรับข้อความก่อนเทียบ — สำหรับ *สิ่งที่ผู้ใช้พิมพ์* เท่านั้น**
 *
 * ⚠️ ⛔ **ห้ามเอาไปใช้จำแนกป้ายบนแผนที่** — การจำแนกป้ายต้องเทียบ **ตรงตัว** กับทะเบียน
 *    ([[C-14]] §8 ข้อ 4) เพราะที่นั่นเรากำลังตัดสิน *ข้อเท็จจริง* ว่าใบไหนเป็นจังหวัด
 *    ส่วนที่นี่เรากำลังเดา *เจตนาของคนพิมพ์* ซึ่งยอมพลาดฝั่งกว้างได้
 *    🔑 2 อย่างนี้เป็นคนละปัญหา และการเอามารวมกันคือทางที่จะทำให้ป้ายติดยศผิด
 *
 * สิ่งที่ตัดออก (ทั้งหมดคือของที่คนพิมพ์ใส่/ไม่ใส่ก็ได้ ⛔ ไม่ใช่ของที่เปลี่ยนความหมาย):
 *   · ช่องว่างทุกชนิด — `กรุง เทพ` = `กรุงเทพ`
 *   · `ฯ` (ไปยาลน้อย) — `กรุงเทพฯ` = `กรุงเทพ`
 *   · จุด/ขีด/วงเล็บ — `จ.ลพบุรี` เทียบได้กับ `จลพบุรี` (ยังไม่ตรงกับ `ลพบุรี` — ดูการจับคำนำหน้าข้างล่าง)
 *   · วรรณยุกต์ไทย + ทัณฑฆาต (U+0E48–U+0E4C) — คนพิมพ์เร็วมักใส่ไม่ครบ
 *   · ตัวพิมพ์ใหญ่/เล็กของอังกฤษ
 */
export function normalizeSearchText(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .toLowerCase()
    .replace(/[\s ]+/gu, '')
    .replace(/[ฯ.\-–—()[\]{}'"`,]/gu, '')
    .replace(/[่-์]/gu, '');
}

/**
 * คำนำหน้าเขตการปกครองที่คนไทยพิมพ์ติดมาบ่อย
 * 📌 ตัดออก **เฉพาะฝั่งคำค้นของผู้ใช้** — ⛔ ไม่แตะข้อมูลที่มาจากทะเบียน/ไฟล์แผนที่
 */
const USER_PREFIXES = ['จังหวัด', 'จ', 'อำเภอ', 'อ', 'ตำบล', 'ต', 'เขต', 'แขวง'];

/** ตัดคำนำหน้าที่ผู้ใช้พิมพ์มา — คืนทั้งฉบับเดิมและฉบับตัดแล้ว เพราะบางชื่อขึ้นต้นด้วยตัวเดียวกันจริง */
export function userQueryVariants(query: string): string[] {
  const norm = normalizeSearchText(query);
  if (!norm) return [];
  const out = [norm];
  for (const prefix of USER_PREFIXES) {
    const p = normalizeSearchText(prefix);
    // 🪤 ต้องเหลือตัวอักษรอย่างน้อย 1 ตัว ไม่งั้น `จ` เปล่า ๆ จะกลายเป็นคำค้นว่างที่แมตช์ทุกอย่าง
    if (p && norm.startsWith(p) && norm.length > p.length) out.push(norm.slice(p.length));
  }
  return [...new Set(out)];
}

/**
 * ให้คะแนนความตรง — `0` = ไม่ตรงเลย
 * 🔑 ตรงเป๊ะ > ขึ้นต้นด้วย > มีคำนี้อยู่ข้างใน ⇒ ผู้ใช้ที่พิมพ์ชื่อเต็มได้ผลที่ต้องการเป็นใบแรกเสมอ
 */
function scoreOf(candidate: string, variants: string[]): number {
  const c = normalizeSearchText(candidate);
  if (!c) return 0;
  let best = 0;
  for (const q of variants) {
    if (!q) continue;
    if (c === q) best = Math.max(best, 100);
    else if (c.startsWith(q)) best = Math.max(best, 70);
    else if (c.includes(q)) best = Math.max(best, 40);
  }
  return best;
}

export interface SearchInput {
  query: string;
  /** ทะเบียน 77 จังหวัดจาก `/config` — ⛔ ไม่มี = ค้นหาจังหวัดไม่ได้ (ไม่ใช่เดารายชื่อเอง) */
  provinces: HazardProvince[];
  /** ชั้น `places` ของกระเบื้องที่โหลดแล้ว — 🪤 ไม่ใช่ทั้งประเทศ */
  places: PlaceCandidate[];
  /** จำนวนผลลัพธ์สูงสุด — จอเล็กอ่านได้ไม่กี่บรรทัด */
  limit?: number;
}

/** zoom ปลายทาง — จังหวัดกว้างกว่าอำเภอมาก ⇒ ซูมน้อยกว่าเพื่อให้เห็นทั้งจังหวัด */
export const PROVINCE_ZOOM = 8.2;
export const PLACE_ZOOM = 9.5;

/**
 * ค้นหา — **ฟังก์ชันบริสุทธิ์ ⛔ ไม่มี I/O** (ดูเหตุผลที่หัวไฟล์)
 *
 * 🔑 **จังหวัดมาก่อนเสมอเมื่อคะแนนเท่ากัน** — ด้วยเหตุผลเดียวกับป้ายบนแผนที่:
 *    ประกาศเตือนภัยทางการออกเป็น **รายจังหวัด** ⇒ คนที่พิมพ์ *"ลพบุรี"* ต้องการจังหวัด
 *    ⛔ ไม่ใช่อำเภอเมืองลพบุรีที่บังเอิญชื่อเดียวกัน
 */
export function searchPlaces(input: SearchInput): SearchResult[] {
  const { query, provinces, places, limit = 8 } = input;
  const variants = userQueryVariants(query);
  if (!variants.length) return [];

  const results: SearchResult[] = [];
  const seen = new Set<string>();

  for (const p of provinces || []) {
    const score = Math.max(scoreOf(p.th, variants), scoreOf(p.en, variants));
    if (!score) continue;
    if (!Number.isFinite(p.lat) || !Number.isFinite(p.lon)) continue;
    results.push({ kind: 'province', label: p.th, sublabel: p.en, lat: p.lat, lon: p.lon, zoom: PROVINCE_ZOOM, score });
    seen.add(normalizeSearchText(p.th));
  }

  for (const c of places || []) {
    /**
     * 🪤 **ข้ามใบที่ชื่อซ้ำกับจังหวัดที่เจอไปแล้ว** — ชั้น `places` มีทั้ง *จังหวัด* และ *เมืองหลวงของจังหวัด*
     *    ที่ชื่อเดียวกัน ⇒ ปล่อยไว้จะได้ผลลัพธ์ 2 บรรทัดที่หน้าตาเหมือนกันเป๊ะ ซึ่งผู้ใช้เลือกไม่ถูก
     */
    const key = normalizeSearchText(c.name || c.enName);
    if (!key || seen.has(key)) continue;
    const score = Math.max(scoreOf(c.name, variants), scoreOf(c.enName, variants));
    if (!score) continue;
    if (!Number.isFinite(c.lat) || !Number.isFinite(c.lon)) continue;
    seen.add(key);
    results.push({
      kind: 'place',
      label: c.name || c.enName,
      sublabel: c.name && c.enName && c.name !== c.enName ? c.enName : null,
      lat: c.lat,
      lon: c.lon,
      zoom: PLACE_ZOOM,
      score,
    });
  }

  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // 🔑 คะแนนเท่ากัน ⇒ จังหวัดก่อน (เหตุผลอยู่ที่หมายเหตุของฟังก์ชัน)
    if (a.kind !== b.kind) return a.kind === 'province' ? -1 : 1;
    return a.label < b.label ? -1 : a.label > b.label ? 1 : 0;
  });

  return results.slice(0, limit);
}
