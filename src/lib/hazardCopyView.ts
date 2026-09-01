// src/lib/hazardCopyView.ts
// ────────────────────────────────────────────────────────────────────────────
// 🗣️ **ตัวอ่านถ้อยคำของกลางฝั่งจอ** (`v7.1/SP2` WP4 · เลน 3)
//
// 🔴 **ไฟล์นี้ไม่ได้เป็นเจ้าของถ้อยคำแม้แต่ประโยคเดียว** — เจ้าของคือ `hazardCopyRegistry.js`
//    ฝั่งหลังบ้าน (สัญญา [[C-15]]) และถ้อยคำเดินทางมากับ `/api/web/hazard/config` ก้อน `copy`
//    ไฟล์นี้มีหน้าที่เดียวคือ **หยิบเซลล์ที่ถูกต้องออกมาเติมค่าให้ถูกกติกา**
//
// ── ทำไมต้องมีไฟล์นี้ ไม่เรนเดอร์ตรง ๆ ในจอ ──
//   กติกาของ `C-15` มี 3 ข้อที่ "ถ้าไม่เขียนเป็นโค้ดกลาง เดี๋ยวก็มีคนทำผิดที่ใดที่หนึ่ง":
//     ① `null` (ตั้งใจไม่แสดง) **ไม่เท่ากับ** ไม่มีคีย์ (ลืม) — ต้องแยกให้ออก ⛔ ห้ามยุบเป็น "ไม่มีข้อความ"
//     ② ช่องเติมค่าที่ไม่มีค่ามาให้ = **โยน** ⛔ ห้ามปล่อยเป็นข้อความว่าง
//        เพราะ *"ภาพวันที่ ___"* ยังอ่านรู้เรื่อง ⇒ ผู้ใช้จะไม่เอะใจว่าเวลาหายไป
//     ③ ภาษาอื่นนอก TH/EN ตกมาที่ EN ⛔ ห้ามแปลเพิ่มเองแล้วเอาขึ้นจอ
//
// 🔑 **ตัวจัดรูปแบบวันที่/เวลาเป็นสัญญาข้ามรีโป** (`C-15` §6) — เขียนที่นี่เพราะ `require()`
//    ข้ามรีโปไม่ได้ แต่ **ถูกผูกไว้ด้วย `copy.placeholders.date.examples` ที่มากับ payload**
//    ⇒ `hazardCopyView.test.ts` ทาบผลของฟังก์ชันนี้กับ `examples` ทุกตัวอย่าง
//    ⛔ ห้ามแก้รูปแบบที่นี่ฝ่ายเดียว — วันเดียวกันที่เขียนคนละรูปบนจอกับในข้อความ LINE
//       ผู้ใช้จะอ่านว่าเป็น **คนละรอบข้อมูล**

/** ภาษาที่ทะเบียนถ้อยคำรองรับจริง — ⛔ ไม่ใช่รายการภาษาของแอป */
export type CopyLang = 'th' | 'en';

/** ตำแหน่งที่ข้อความถูกใช้บนจอ (ตรงกับ `copy.positions`) */
export type CopyPosition = 'summary' | 'sheet' | 'chip';

export interface CopyText {
  th: string;
  en: string;
}

export interface CopyEntry {
  layerId: string | null;
  placeholders: string[];
  requiresCanonical: CopyPosition[];
  requiresFreshSource: boolean;
  hidden: CopyPosition[];
  text: Record<CopyPosition, CopyText | null>;
}

export interface CopyPlaceholderExample {
  iso: string;
  th: string;
  en: string;
}

/** ตัวอย่างของ **ช่วงวันที่** (`C-15` §6.1) — ผูกรูปแบบข้ามรีโปเหมือน `examples` ของวันเดียว */
export interface CopyRangeExample {
  dates: string[];
  th: string;
  en: string;
}

export interface CopyPlaceholderSpec {
  meaning: string;
  source: string;
  timeZone?: string;
  format?: { th: string; en: string };
  examples?: CopyPlaceholderExample[];
  range?: {
    meaning: string;
    source: string;
    format: { th: string; en: string };
    examples: CopyRangeExample[];
  };
  authoredElsewhere?: boolean;
}

export interface HazardCopyPayload {
  version: string;
  langs: CopyLang[];
  fallbackLang: CopyLang;
  positions: CopyPosition[];
  /**
   * 🔴 **ประโยคบังคับมีมากกว่า 1 ใบตั้งแต่ 28 ส.ค. 2026** ([[C-15]] §8.5)
   *    `uncoloredAreas` = ชั้นน้ำท่วม · `thresholdOnly` = ชั้นแผ่นดินไหว
   */
  canonical: Record<string, CopyText>;
  /**
   * 🔑 **ชั้นไหนต้องติดประโยคบังคับใบไหน** — จอต้องอ่านจากตารางนี้
   *    ⛔ ห้ามเดาจากชื่อคีย์ และ ⛔ ห้ามสมมติว่ามีใบเดียว (ของเดิมสมมติแบบนั้นและมันถูกเฉพาะตอนมีชั้นเดียว)
   *    `null` = ชั้นนั้นไม่มีประโยคบังคับโดยตั้งใจ (เช่น `alerts` — ประกาศ CAP เป็นคำพูดของหน่วยงาน)
   */
  canonicalByLayer: Record<string, string | null>;
  /** 🌏 คำอ่านของเขตแผ่นดินไหว (ชุดปิด 4 ค่า) — ของกลางจากหลังบ้าน ⛔ จอห้ามแปลเอง */
  zoneLabels: Record<string, CopyText>;
  placeholders: Record<string, CopyPlaceholderSpec>;
  entries: Record<string, CopyEntry>;
}

/** โซนเวลาเดียวที่จอนี้ใช้ — ตรงกับ `copy.placeholders.date.timeZone` ของหลังบ้าน */
export const COPY_TIME_ZONE = 'Asia/Bangkok';

/**
 * ภาษาของแอปมี 5 ตัว (`TH·EN·CN·JP·ES`) แต่ทะเบียนถ้อยคำมี 2
 * ⇒ ที่เหลือ **ตกมาที่ EN ตามสัญญา** (`C-15` §4 ข้อ 7)
 * ⛔ ห้ามแปลเพิ่มเองแล้วเอาขึ้นจอ — คำแปลที่ยังไม่ผ่านด่านถ้อยคำ คือช่องที่ความหมาย
 *    *"อาจยังมีน้ำท่วม"* หลุดหายไปเงียบ ๆ
 */
export function resolveCopyLang(appLang: string | null | undefined): CopyLang {
  return String(appLang || '').trim().toUpperCase() === 'TH' ? 'th' : 'en';
}

export class HazardCopyError extends Error {
  readonly copyKey: string;
  readonly position: CopyPosition;

  constructor(message: string, copyKey: string, position: CopyPosition) {
    super(message);
    this.name = 'HazardCopyError';
    this.copyKey = copyKey;
    this.position = position;
  }
}

/** คีย์นี้มีอยู่ในทะเบียนที่โหลดมาไหม */
export function isKnownCopyKey(copy: HazardCopyPayload | null, key: string): boolean {
  return Boolean(copy && Object.prototype.hasOwnProperty.call(copy.entries, key));
}

/**
 * 🔴 **แยก "ตั้งใจไม่แสดง" ออกจาก "ลืม"** (`C-15` §4 ข้อ 2)
 *
 * `null` + ประกาศใน `hidden[]` = ตั้งใจ (เช่น `LAYER_OFF_SYSTEM` ไม่ขึ้นแถบสรุปเพื่อลดความรก)
 * `null` โดยไม่ประกาศใน `hidden[]` = ทะเบียนมีรู ⇒ **โยน** ⛔ ไม่เงียบ
 */
export function isIntentionallyHidden(
  copy: HazardCopyPayload,
  key: string,
  position: CopyPosition,
): boolean {
  const entry = copy.entries[key];
  if (!entry) return false;
  return entry.text[position] === null && entry.hidden.includes(position);
}

/**
 * หยิบแม่พิมพ์ข้อความ (ยังไม่เติมค่า)
 * @returns `null` = ตั้งใจไม่แสดงตำแหน่งนี้ · โยนเมื่อคีย์ไม่รู้จัก หรือช่องว่างโดยไม่ได้ประกาศ
 */
export function getCopyTemplate(
  copy: HazardCopyPayload,
  key: string,
  position: CopyPosition,
  lang: CopyLang,
): string | null {
  const entry = copy.entries[key];
  if (!entry) {
    throw new HazardCopyError(`ไม่รู้จักคีย์ถ้อยคำ '${key}' ในก้อน copy ที่โหลดมา`, key, position);
  }
  const cell = entry.text[position];
  if (cell === null || cell === undefined) {
    if (entry.hidden.includes(position)) return null;
    throw new HazardCopyError(
      `ถ้อยคำ '${key}.${position}' ว่างโดยไม่ได้ประกาศใน hidden[] — ทะเบียนฝั่งหลังบ้านมีรู`,
      key,
      position,
    );
  }
  return cell[lang] ?? cell[copy.fallbackLang];
}

/**
 * เติมค่าลงแม่พิมพ์
 *
 * 🔴 **ขาดค่า = โยน** ⛔ ไม่ปล่อยเป็นข้อความว่าง และไม่ปล่อยให้ `{date}` โผล่ดิบ ๆ บนจอ
 *    (กติกาเดียวกับ `render()` ฝั่งหลังบ้าน — จงใจให้พังเหมือนกันทั้งสองฝั่ง)
 */
export function renderCopy(
  copy: HazardCopyPayload,
  key: string,
  position: CopyPosition,
  lang: CopyLang,
  vars: Record<string, string | null | undefined> = {},
): string | null {
  const template = getCopyTemplate(copy, key, position, lang);
  if (template === null) return null;

  const missing: string[] = [];
  const out = template.replace(/\{([a-z_]+)\}/gi, (whole: string, name: string) => {
    const v = vars[name];
    if (v === undefined || v === null || String(v).trim() === '') {
      missing.push(name);
      return whole;
    }
    return String(v);
  });

  if (missing.length) {
    throw new HazardCopyError(
      `ถ้อยคำ '${key}.${position}.${lang}' ขาดค่าของช่อง: ${missing.join(', ')}`,
      key,
      position,
    );
  }
  return out;
}

/**
 * ⚠️ **ทางออกฉุกเฉินของ "ห้ามปล่อยประโยคที่ค่าหายไป"**
 *
 * `renderCopy()` โยนตามสัญญา — แต่ถ้าปล่อยให้มันโยนกลาง React จอทั้งจอจะขาว
 * ซึ่งบนจอภัยพิบัติแย่กว่าการบอกตรง ๆ ว่าแสดงข้อความนี้ไม่ได้
 * ⇒ ตัวห่อนี้ **ไม่กลบความผิดพลาด**: มันคืน `null` (ให้ผู้เรียกขึ้นป้าย chrome ว่าแสดงไม่ได้)
 *    พร้อม `console.error` ⛔ **ห้ามคืนข้อความครึ่ง ๆ กลาง ๆ ที่ยังอ่านรู้เรื่อง**
 */
export function renderCopySafe(
  copy: HazardCopyPayload,
  key: string,
  position: CopyPosition,
  lang: CopyLang,
  vars: Record<string, string | null | undefined> = {},
): { text: string | null; failed: boolean } {
  try {
    return { text: renderCopy(copy, key, position, lang, vars), failed: false };
  } catch (error) {
    console.error('[hazard copy]', (error as Error).message);
    return { text: null, failed: true };
  }
}

/**
 * รับเฉพาะค่าที่เป็นวันเวลาได้จริง
 *
 * 🪤 **`new Date(null)` = 1 ม.ค. 2513 ไม่ใช่ Invalid Date** (ตระกูลเดียวกับ `Number(null) = 0`
 *    · [[L-384]]) ⇒ ถ้ารับ `null` เข้ามาตรง ๆ จอจะขึ้นวันที่ที่ **ดูเหมือนวันที่จริง**
 *    ผู้ใช้ไม่มีทางเอะใจ · บั๊กนี้เกิดจริงตอนหลังบ้านเขียนรอบแรกและถูกเทสจับได้
 */
export function toDateStrict(input: unknown): Date | null {
  if (input instanceof Date) return Number.isFinite(input.getTime()) ? input : null;
  if (typeof input === 'number') return Number.isFinite(input) ? new Date(input) : null;
  if (typeof input !== 'string' || input.trim() === '') return null;
  const d = new Date(input);
  return Number.isFinite(d.getTime()) ? d : null;
}

/**
 * `{date}` — วันที่ของ **ภาพดาวเทียม** (ไม่ใช่วันที่ดึงข้อมูล)
 * TH `24 ส.ค. 2569` (พ.ศ.) · EN `24 Aug 2026` · โซนเวลา `Asia/Bangkok`
 * 🔑 ผูกกับ `copy.placeholders.date.examples` — มีเทสทาบทุกตัวอย่าง
 */
export function formatCopyDate(input: unknown, lang: CopyLang): string | null {
  const d = toDateStrict(input);
  if (!d) return null;
  return d.toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-GB', {
    timeZone: COPY_TIME_ZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * `{t}` — เวลาที่ระบบดึงข้อมูลรอบล่าสุดสำเร็จ
 * TH `14:32 น.` · EN `14:32 ICT`
 * 🔑 **ต้องพกตัวบอกเขตเวลาเสมอ** — persona P4 (expat) เปิดจอจากนอกประเทศได้
 *    เวลาเปล่า ๆ จะถูกอ่านเป็นเวลาเครื่องตัวเอง (`C-15` §6)
 */
export function formatCopyTime(input: unknown, lang: CopyLang): string | null {
  const d = toDateStrict(input);
  if (!d) return null;
  const hm = d.toLocaleTimeString('en-GB', {
    timeZone: COPY_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return lang === 'th' ? `${hm} น.` : `${hm} ICT`;
}

/** ชิ้นส่วนวัน/เดือน/ปี ตามภาษา — 🔑 `th-TH` ให้ปี พ.ศ. เอง ⛔ ห้ามบวก 543 เอง */
function datePartsOf(d: Date, lang: CopyLang): { day: string; month: string; year: string } {
  const parts = new Intl.DateTimeFormat(lang === 'th' ? 'th-TH' : 'en-GB', {
    timeZone: COPY_TIME_ZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).formatToParts(d);
  const pick = (type: string) => parts.find((p) => p.type === type)?.value || '';
  return { day: pick('day'), month: pick('month'), year: pick('year') };
}

/**
 * `{date}` ฉบับ **ช่วงวันที่** — ใช้เมื่อหน้าต่างเวลามีภาพหลายวัน (`C-15` §6.1)
 *
 * 🔴 ทำไมจอถึงต้องมีของนี้: จอใช้ `window=30d` (รอบ 1 วันว่างทั้งประเทศ — `C-14` §7)
 *    และรอบ 30 วันมีภาพจริงหลายสิบวัน ⇒ การเติมเฉพาะวันล่าสุดทำให้ประโยคที่ผ่าน G1
 *    เป็นเท็จสำหรับเซลล์ที่มาจากภาพวันแรกของรอบ
 * 🔑 กติกาการประกอบ **เป็นของหลังบ้าน** — ที่นี่คือฉบับ mirror ที่ถูกผูกไว้ด้วย
 *    `copy.placeholders.date.range.examples` (ดู `findFormatterDrift`) ⛔ ห้ามแก้ฝ่ายเดียว
 * 🔴 ไม่มีวันที่เลย = **โยน** ⛔ ไม่คืนสตริงว่าง (ประโยค "(ภาพวันที่ )" ยังอ่านรู้เรื่องพอที่จะไม่มีใครเอะใจ)
 */
export function formatCopyDateRange(dates: unknown, lang: CopyLang): string {
  const list = (Array.isArray(dates) ? dates : []).map(toDateStrict).filter(Boolean) as Date[];
  if (!list.length) {
    throw new HazardCopyError(
      'formatCopyDateRange: ไม่มีวันที่ของภาพเลย ⇒ ⛔ ห้ามเติมช่อง {date} — ต้องไปสถานะ "อ่านข้อมูลไม่ได้" แทน',
      'FLOOD_ROUND',
      'summary',
    );
  }

  let from = list[0];
  let to = list[0];
  for (const d of list) {
    if (d.getTime() < from.getTime()) from = d;
    if (d.getTime() > to.getTime()) to = d;
  }

  const a = datePartsOf(from, lang);
  const b = datePartsOf(to, lang);

  if (a.day === b.day && a.month === b.month && a.year === b.year) return formatCopyDate(to, lang) as string;
  if (a.month === b.month && a.year === b.year) return `${a.day}–${b.day} ${b.month} ${b.year}`;
  if (a.year === b.year) return `${a.day} ${a.month} – ${b.day} ${b.month} ${b.year}`;
  return `${formatCopyDate(from, lang)} – ${formatCopyDate(to, lang)}`;
}

/**
 * `{magnitude}` — ขนาดแผ่นดินไหว · **ทศนิยม 1 ตำแหน่งเสมอ** (TH/EN เหมือนกัน)
 *
 * 🪤 **ทะเบียนประกาศ *กลไก* ไม่ใช่คำว่า "ปัดทศนิยม 1 ตำแหน่ง"** — และนั่นสำคัญมาก:
 *    `(6.05).toFixed(1)` = **`'6.0'` ไม่ใช่ `'6.1'`** (6.05 ในฐานสองคือ 6.0499…)
 *    ⇒ ถ้าอีกฝั่ง (ข้อความ LINE ของเลน B) เขียนตัวปัดเอง **ตัวเลขเดียวกันจะไม่ตรงกัน**
 *    ⇒ ที่นี่จึงต้องใช้ `Number#toFixed(1)` ของ JavaScript **เป๊ะ ๆ** ⛔ ห้ามเขียนตัวปัดเอง
 *      (`copy.placeholders.magnitude.examples` มีเคส `6.05` และ `-0.66` ตรึงไว้ · ดู `findFormatterDrift`)
 * 🔴 ค่าที่ไม่ใช่ตัวเลขจริง = `null` ⛔ ไม่ใช่ `'0.0'` (ขนาด 0.0 เป็นคำกล่าวอ้างที่ผิด)
 */
export function formatCopyMagnitude(input: unknown): string | null {
  if (typeof input !== 'number' || !Number.isFinite(input)) return null;
  return input.toFixed(1);
}

/**
 * `{occurred}` — **เวลาที่เกิดเหตุตามที่ต้นทางรายงาน** ⛔ ไม่ใช่เวลาที่ระบบดึงข้อมูล
 * TH `27 ส.ค. 2569 02:21 น.` · EN `27 Aug 2026 02:21 ICT`
 * 🔑 ประกอบจาก `formatCopyDate` + `formatCopyTime` ⇒ ตัวบอกเขตเวลาติดมาเองตามกติกา `C-15` §6
 */
export function formatCopyOccurred(input: unknown, lang: CopyLang): string | null {
  const date = formatCopyDate(input, lang);
  const time = formatCopyTime(input, lang);
  if (!date || !time) return null;
  return `${date} ${time}`;
}

/**
 * `{zone_label}` — คำอ่านของเขตแผ่นดินไหว
 *
 * 🔴 **อ่านจากก้อน `copy.zoneLabels` ของหลังบ้านเท่านั้น ⛔ จอห้ามแปลเอง**
 *    เขตมาจากการจำแนกของระบบ (`quakeGeofence.classifyZone`) และคำอ่านเป็นของกลาง
 *    ⇒ จอที่เขียนคำแปลเองคือก๊อปที่ 2 ที่จะเพี้ยนเงียบ ๆ วันที่หลังบ้านแก้คำ ([[C-15]] §1)
 * 🔴 ไม่รู้จักเขตนี้ = `null` ⇒ ผู้เรียกต้อง **ไม่แสดงใบนั้น** ⛔ ไม่ใช่เติมคำว่า "ไม่ทราบ"
 */
export function formatCopyZoneLabel(
  copy: HazardCopyPayload | null,
  zone: unknown,
  lang: CopyLang,
): string | null {
  if (!copy || typeof zone !== 'string') return null;
  const entry = copy.zoneLabels?.[zone];
  if (!entry) return null;
  const text = entry[lang] ?? entry[copy.fallbackLang];
  return typeof text === 'string' && text.trim() !== '' ? text : null;
}

export interface FormatterDrift {
  placeholder: 'date' | 't' | 'date.range' | 'magnitude' | 'occurred' | 'zone_label';
  iso: string;
  lang: CopyLang;
  expected: string;
  got: string | null;
}

/**
 * 🔑 **ด่านสัญญาข้ามรีโป** — ทาบตัวจัดรูปแบบของจอกับ `examples` ที่มากับ payload
 *
 * ใช้ได้ 2 ที่: ในเทส (บังคับว่าต้องว่าง) และตอนรันจริง (ถ้าไม่ว่าง = หลังบ้านขยับรูปแบบ
 * แล้วจอยังไม่ตาม ⇒ ผู้ใช้จะเห็นวันที่คนละรูปกับในข้อความ LINE ของเรื่องเดียวกัน)
 */
export function findFormatterDrift(copy: HazardCopyPayload): FormatterDrift[] {
  const drift: FormatterDrift[] = [];
  const checks: Array<{ key: 'date' | 't'; fn: (iso: string, lang: CopyLang) => string | null }> = [
    { key: 'date', fn: (iso, lang) => formatCopyDate(iso, lang) },
    { key: 't', fn: (iso, lang) => formatCopyTime(iso, lang) },
  ];

  for (const { key, fn } of checks) {
    const examples = copy.placeholders?.[key]?.examples || [];
    for (const example of examples) {
      for (const lang of ['th', 'en'] as CopyLang[]) {
        const got = fn(example.iso, lang);
        if (got !== example[lang]) {
          drift.push({ placeholder: key, iso: example.iso, lang, expected: example[lang], got });
        }
      }
    }
  }

  /** ช่วงวันที่ (`C-15` §6.1) — ผูกเหมือนกันทุกประการ */
  for (const example of copy.placeholders?.date?.range?.examples || []) {
    for (const lang of ['th', 'en'] as CopyLang[]) {
      let got: string | null = null;
      try {
        got = formatCopyDateRange(example.dates, lang);
      } catch {
        got = null;
      }
      if (got !== example[lang]) {
        drift.push({
          placeholder: 'date.range',
          iso: example.dates.join(','),
          lang,
          expected: example[lang],
          got,
        });
      }
    }
  }

  /** `{occurred}` — วันที่+เวลาของเหตุการณ์ (ผูกเหมือน `{date}`/`{t}` ทุกประการ) */
  for (const example of copy.placeholders?.occurred?.examples || []) {
    for (const lang of ['th', 'en'] as CopyLang[]) {
      const got = formatCopyOccurred(example.iso, lang);
      if (got !== example[lang]) {
        drift.push({ placeholder: 'occurred', iso: example.iso, lang, expected: example[lang], got });
      }
    }
  }

  /**
   * `{magnitude}` — 🪤 ตัวอย่างชุดนี้ใช้ช่อง `raw` (ตัวเลข) ⛔ ไม่ใช่ `iso`
   *    และมีเคส `6.05` → `'6.0'` ตรึงกลไกการปัดไว้โดยเฉพาะ
   */
  for (const example of (copy.placeholders?.magnitude?.examples || []) as unknown as Array<{ raw: number; th: string; en: string }>) {
    for (const lang of ['th', 'en'] as CopyLang[]) {
      const got = formatCopyMagnitude(example.raw);
      if (got !== example[lang]) {
        drift.push({ placeholder: 'magnitude', iso: String(example.raw), lang, expected: example[lang], got });
      }
    }
  }

  /**
   * `{zone_label}` — 🔑 ตัวอย่างใช้ช่อง `zone` · จอไม่ได้แปลเอง แต่ยัง **ต้องพิสูจน์ว่าอ่านถูกก้อน**
   *    (ถ้าวันหนึ่ง `zoneLabels` หายไปจาก payload เทสต้องแดง ⛔ ไม่ใช่จอขึ้นการ์ดที่ไม่มีชื่อเขต)
   */
  for (const example of (copy.placeholders?.zone_label?.examples || []) as unknown as Array<{ zone: string; th: string; en: string }>) {
    for (const lang of ['th', 'en'] as CopyLang[]) {
      const got = formatCopyZoneLabel(copy, example.zone, lang);
      if (got !== example[lang]) {
        drift.push({ placeholder: 'zone_label', iso: example.zone, lang, expected: example[lang], got });
      }
    }
  }

  return drift;
}

/**
 * 🔴 **ประโยคบังคับของชั้นข้อมูลหนึ่ง — อ่านจากตารางของหลังบ้าน ⛔ ห้ามเดาจากชื่อคีย์**
 *    (เพิ่ม 29 ส.ค. 2026 · คลื่น 4 — การ์ด "ตำแหน่งที่คุณแชร์" ต้องใช้)
 *
 * **ทำไมต้องมีตัวนี้:** การ์ดใหม่ต้องเขียนว่า *"ตรงจุดนี้ไม่มีชั้นข้อมูลใดทับอยู่"* ซึ่ง
 * ⛔ **ห้ามจบแค่นั้นเด็ดขาด** — ประโยคนั้นจะถูกอ่านว่า *"ตรงนี้ปลอดภัย"* ทันที
 * ⇒ ต้องพก **ประโยคบังคับของชั้นนั้น** มาด้วย (ของชั้นน้ำท่วมคือประโยคเรื่องพื้นที่ที่ไม่ได้ระบายสี)
 * 🔑 และประโยคนั้น **มีเจ้าของอยู่ที่ทะเบียนของหลังบ้าน** ⇒ ที่นี่มีหน้าที่แค่*หยิบมาให้ถูกใบ*
 *    ⛔ ไม่มีข้อความใดถูกเขียนขึ้นในฟังก์ชันนี้เลย แม้แต่คำเดียว
 *
 * 🪤 **`canonicalByLayer[layerId]` เป็น `null` ได้โดยตั้งใจ** — เช่นชั้นประกาศ CAP
 *    (เป็นคำพูดของหน่วยงานอยู่แล้ว ไม่ต้องมีประโยคบังคับของเรากำกับ)
 *    ⇒ `null` = *"ชั้นนี้ไม่มีประโยคบังคับ"* ⛔ ไม่ใช่ *"หาไม่เจอ"* — ผู้เรียกต้องไม่ขึ้นป้ายผิดพลาด
 *
 * @returns ข้อความของภาษาที่ขอ · `null` = ชั้นนี้ไม่มีประโยคบังคับ **หรือ** ทะเบียนยังไม่มีคีย์นั้น
 */
export function canonicalForLayer(
  copy: HazardCopyPayload | null | undefined,
  layerId: string,
  lang: CopyLang,
): string | null {
  if (!copy || !copy.canonicalByLayer || !copy.canonical) return null;
  const key = copy.canonicalByLayer[layerId];
  if (typeof key !== 'string' || !key) return null;

  const text = copy.canonical[key];
  if (!text) {
    /**
     * 🔴 ทะเบียนประกาศว่าชั้นนี้ *ต้องมี* ประโยคบังคับ แต่หาตัวประโยคไม่เจอ
     *    ⇒ นี่คือทะเบียนที่ไม่สอดคล้องกันเอง ⛔ ไม่ใช่เรื่องปกติ ⇒ ต้องส่งเสียง
     *    (ผู้เรียกจะได้ `null` แล้วต้อง fail-closed คือ **ไม่แสดงคำกล่าวอ้างของชั้นนั้นเลย**)
     */
    console.error(`[hazardCopy] canonicalByLayer ชี้ไปที่ '${key}' แต่ canonical ไม่มีคีย์นี้ (layer=${layerId})`);
    return null;
  }
  return (lang === 'th' ? text.th : text.en) || null;
}
