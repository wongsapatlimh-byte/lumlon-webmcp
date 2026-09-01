// src/webmcp/watchStore.ts
// ────────────────────────────────────────────────────────────────────────────
// 🔔 **เครื่องเฝ้าระวังที่ทำงานจริงในเบราว์เซอร์** (`C4` ของ scope · มติ D-2)
//
// 🔴 **ทำไมถึงเป็น "ของจริง" ไม่ใช่ฉากจำลอง:** ครบวงจร **สร้าง → ประเมินกับข้อมูลสด → เตือนจริง**
//    ⇒ ในวิดีโอสาธิตไม่มีช็อตไหนที่ต้องจัดฉาก (มติ D-22 ห้ามฉากจัด) · ผู้ตรวจนัดชี้ขาดค้านร่างแรก
//    ตรงนี้พอดี: *"UI ที่บันทึกกฎแล้วไม่มีอะไรเกิดขึ้น = เดโม ไม่ใช่ผลิตภัณฑ์"*
//
// ── 🗣️ ถ้อยคำที่ต้องตรงไปตรงมา (บังคับ) ──
//   บนจอและในคำตอบของ tool ต้องบอกว่า **"เฝ้าในเบราว์เซอร์นี้ · ปิดหน้าแล้วหยุด · ไม่ส่งต่อไปที่ไหน"**
//   ⛔ ห้ามเขียนให้เข้าใจว่าปิดเครื่องแล้วยังเตือน — นั่นคือคำสัญญาที่เราทำไม่ได้ และเป็นคำสัญญา
//   เรื่องความปลอดภัย ซึ่งเป็นชนิดที่ผิดแล้วเสียหายที่สุด
//
//   🔴🔴 **แก้ 1 ก.ย. 2026 — บรรทัดนี้เคยสั่งให้เขียนคำเคลมเท็จ ⛔ ห้ามเขียนกลับ**
//   ของเดิมสั่งไว้ว่า: *"เฝ้าในเบราว์เซอร์นี้ · **เวอร์ชันจริงส่งผ่าน LINE**"*
//   🪤 **นี่คือกับดักที่อันตรายที่สุดในโมดูลนี้ — กติกาที่เขียนขึ้นเพื่อ *กัน* คำสัญญาที่เกินจริง
//      กลับกลายเป็นตัว *สั่งผลิต* คำสัญญาที่เกินจริงเสียเอง** และเพราะมันอยู่ในบล็อก "บังคับ"
//      คนอ่านจะเชื่อว่าเรื่องนี้ผ่านการคิดมาแล้ว ⇒ ไม่มีใครตั้งคำถามกับมันเลย 5 วัน
//   📌 ประวัติ: 31 ส.ค. (`558d5fc`) ทีมถอดคำเคลมนี้ออกจาก **หน้าเว็บ + README** และบันทึกเองว่า
//      *ต้นตอคือกติกาในไฟล์นี้* — **แต่ไม่ได้แก้กติกา** ⇒ 1 ก.ย. พบว่ามันยังงอกอยู่อีก 2 ที่:
//      `tools/watchTools.ts` (`SCOPE_NOTE` — อยู่ใน **คำตอบของ tool** ⇒ agent พูดต่อได้)
//      และ `locales/translations.ts` (**5 ภาษา**: th · en · zh · ja · es)
//   🔑 **บทเรียนที่ใช้ได้กับทุกเลน: ถอนคำเคลมเท็จต้องถอน "กติกาที่สั่งให้เขียนมัน" ด้วยเสมอ**
//      ไม่งั้นถอนแค่ปลายทาง แล้วมันงอกกลับมาทางไฟล์ที่ยังไม่มีใครเปิด
//
//   🔬 สถานะจริงของตัวส่งเตือนภัย (วัด 1 ก.ย. 2026 ⛔ ไม่ใช่เชื่อความจำ):
//      โค้ดฝั่งหลังบ้าน **มีจริงและต่อครบเส้น** (`alertsWorker.js` ← `cron.controller.js:729`
//      · route `/api/internal/cron/alerts-sweep` · `alertDelivery.js:147` ⇒ `channel: 'line'`)
//      🔴 **แต่สวิตช์ `MODULES.alerts` = `default: 'off'` · `failSafe: 'off'`** (`moduleRegistry.js:55`)
//      และหัว `alertsWorker.js` เขียนเองว่าวันที่ scheduler ยิงสำเร็จ *ขณะสวิตช์เปิด*
//      คือวันที่ข้อความออกไปหาผู้ใช้จริง ⇒ **ยังไม่เคยส่งจริงสักครั้ง**
//      ⇒ พูดได้แค่ **"มีเส้นทางอยู่"** ⛔ ห้ามพูดว่า **"delivers / ส่ง"** ซึ่งเป็นปัจจุบันกาล
//
// ── 📍 เรื่องความเป็นส่วนตัว (ต่างจากกติกาของช่องค้นหาบนแผนที่) ──
//   เลน 3 ห้ามเก็บ *คำค้น* ลง localStorage เพราะนั่นคือ **ความสนใจเชิงตำแหน่งที่ผู้ใช้ไม่ได้ขอให้เก็บ**
//   ส่วนที่นี่ผู้ใช้ **สั่งให้จำ** ด้วยตัวเอง และเก็บแค่ **รหัสจังหวัด** ⛔ ไม่ใช่พิกัด (GEO-0 / D-26)
//   ⇒ คนละคำถามกัน — และเป็นเหตุผลที่ไฟล์นี้เขียนกติกาไว้ตรงนี้ ไม่ใช่ให้คนอ่านเดาเอง

import type { UiPlaceRef } from './uiBridge';

/** ตัวชี้วัดที่เฝ้าได้ — ค่าเชิงความหมาย ⛔ ไม่ใช่รหัสภายใน */
export type WatchMetric = 'pm25' | 'aqi';

export const WATCH_METRICS: readonly WatchMetric[] = ['pm25', 'aqi'] as const;

export interface Watch {
  id: string;
  place: UiPlaceRef;
  metric: WatchMetric;
  threshold: number;
  /** ISO 8601 */
  createdAt: string;
  /** ครั้งล่าสุดที่กฎนี้เตือนไปแล้ว — `null` = ยังไม่เคยเตือน */
  lastTriggeredAt: string | null;
}

/**
 * 🔒 **เพดานจำนวนกฎ** — กันทั้งการใช้ผิด (agent วนสร้างรัว) และกัน localStorage บวม
 * 🔑 เพดานที่เตี้ยพอให้คนอ่านรายการจบในจอเดียว = คนคุมสิ่งที่ agent สร้างไว้ได้จริง
 */
export const MAX_WATCHES = 5;

/** พิสัยของเกณฑ์ที่รับได้ — นอกช่วงนี้คือพิมพ์ผิด ไม่ใช่เจตนา */
export const THRESHOLD_MIN = 1;
export const THRESHOLD_MAX = 500;

/**
 * ⏱️ **เวลาพักหลังเตือน 1 ครั้ง** — ไม่มีตัวนี้ กฎเดียวจะเตือนซ้ำทุกรอบประเมิน
 *    ตราบใดที่ค่ายังเกินเกณฑ์ ⇒ ผู้ใช้ปิดแบนเนอร์ไม่ทัน และเลิกอ่านคำเตือนไปเลย
 *    (การเตือนที่ถี่เกินไปทำให้คนเพิกเฉยต่อการเตือน — อันตรายกว่าไม่เตือน)
 */
export const RETRIGGER_COOLDOWN_MS = 30 * 60 * 1000;

const STORAGE_KEY = 'lumlon.webmcp.watches.v1';

/** ผิดพลาดที่เกิดจากคำสั่งของผู้ใช้/agent — ตัว tool แปลงเป็นข้อความที่มีทางไปต่อ */
export class WatchRejected extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'WatchRejected';
    this.code = code;
  }
}

function storage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage;
  } catch {
    /**
     * 🪤 บางเบราว์เซอร์โยน error ตอน *เข้าถึง* `localStorage` (โหมดส่วนตัว/ปิดคุกกี้)
     *    ⇒ ต้องรอดมาได้โดยไม่ทำให้ทั้งหน้าพัง — ฟีเจอร์เฝ้าหายไป แต่ tool อ่านอย่างเดียวยังทำงาน
     */
    return null;
  }
}

function isWatch(value: unknown): value is Watch {
  if (!value || typeof value !== 'object') return false;
  const w = value as Record<string, unknown>;
  return (
    typeof w.id === 'string' &&
    typeof w.threshold === 'number' &&
    (w.metric === 'pm25' || w.metric === 'aqi') &&
    Boolean(w.place) &&
    typeof w.place === 'object'
  );
}

/** อ่านรายการกฎ — ของเสียรูปถูกทิ้งเงียบ ๆ ⛔ ไม่ล้มทั้งรายการเพราะใบเดียวพัง */
export function listWatches(): Watch[] {
  const store = storage();
  if (!store) return [];
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isWatch).slice(0, MAX_WATCHES);
  } catch {
    return [];
  }
}

/**
 * 🔴 **เขียนไม่ลง = ปฏิเสธเสียงดัง ⛔ ห้ามเงียบ** — `create_watch` เป็น tool ฝั่งเขียน
 *    ผู้ใช้กดยืนยันไปแล้วว่าให้จำ ⇒ การบอกว่าสำเร็จทั้งที่ไม่ได้จำ คือคำตอบที่หลอกผู้ใช้
 *    และเป็นคำโกหกเรื่องความปลอดภัย (เขาจะเดินออกจากบ้านโดยคิดว่ามีระบบเฝ้าให้อยู่)
 *
 * 🔬 **ผู้ตรวจจับได้เป็น P0 และมันจริง (29 ส.ค. 2026):** เดิมบรรทัดแรกเป็น `if (!store) return;`
 *    ⇒ **โหมดส่วนตัว/ปิดที่เก็บข้อมูล = เงียบสนิทแล้วตอบว่าสำเร็จ** เพราะ `storage()` คืน `null`
 *    ตั้งแต่ต้น จึงไม่มีวันไปถึง `try/catch` ที่เขียนดักไว้ ⇒ **คอมเมนต์เดิมบรรยายสิ่งที่โค้ดไม่ได้ทำ**
 *    ⇒ ทั้งสองกรณี (ไม่มีที่เก็บ · เขียนไม่ลง) ต้องออกทางเดียวกัน
 */
function persist(watches: Watch[]): void {
  const store = storage();
  if (!store) {
    throw new WatchRejected(
      'storage_unavailable',
      'This browser will not let the page save watches (private mode or site data is blocked).',
    );
  }
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(watches));
  } catch {
    throw new WatchRejected(
      'storage_unavailable',
      'This browser will not let the page save watches (private mode or storage is full).',
    );
  }
}

/** รหัสกฎ — ไม่ต้องเดายาก แค่ต้องไม่ชนกันเองและอ่านออกตอนไล่ปัญหา */
function nextId(existing: Watch[]): string {
  let n = existing.length + 1;
  const used = new Set(existing.map((w) => w.id));
  let id = `w${n}`;
  while (used.has(id)) {
    n += 1;
    id = `w${n}`;
  }
  return id;
}

export interface CreateWatchInput {
  place: UiPlaceRef;
  metric: WatchMetric;
  threshold: number;
  now?: Date;
}

/**
 * สร้างกฎ 1 ใบ — **fail-closed เต็มรูป** (tool ฝั่งเขียน)
 *
 * 🔑 ต่างจาก tool ฝั่งอ่านโดยสิ้นเชิง: ที่นี่ validate ไม่ผ่าน = **ปฏิเสธทั้งคำสั่ง**
 *    ⛔ ไม่มีการ "บันทึกไปก่อนแล้วค่อยเตือนว่าบางช่องแปลก" — กฎที่ถูกบันทึกครึ่งใบ
 *    จะเงียบไปตลอดกาลโดยที่ผู้ใช้คิดว่าตัวเองมีระบบเฝ้าอยู่
 */
export function createWatch({ place, metric, threshold, now = new Date() }: CreateWatchInput): Watch {
  if (!Number.isFinite(threshold)) {
    throw new WatchRejected('invalid_threshold', 'Threshold must be a number, for example 75.');
  }
  const rounded = Math.round(threshold);
  if (rounded < THRESHOLD_MIN || rounded > THRESHOLD_MAX) {
    throw new WatchRejected(
      'invalid_threshold',
      `Threshold must be between ${THRESHOLD_MIN} and ${THRESHOLD_MAX}. Received ${rounded}.`,
    );
  }
  if (!place.code) {
    throw new WatchRejected(
      'unknown_place',
      'Watches need a province code — call search_locations first and pass the code it returns.',
    );
  }

  const existing = listWatches();

  /**
   * 🪤 **กฎซ้ำต้องถูกปฏิเสธ ⛔ ไม่ใช่สร้างใบที่สอง** — agent ที่ถูกถามซ้ำ ("เฝ้าให้หน่อย")
   *    จะเรียก tool ซ้ำโดยธรรมชาติ ⇒ ปล่อยไว้จะได้ 5 ใบเหมือนกันจนเต็มเพดานภายในบทสนทนาเดียว
   */
  const duplicate = existing.find(
    (w) => w.place.code === place.code && w.metric === metric && w.threshold === rounded,
  );
  if (duplicate) {
    throw new WatchRejected(
      'duplicate_watch',
      `A watch for ${place.labelEn} ${metric} over ${rounded} already exists (id ${duplicate.id}).`,
    );
  }

  if (existing.length >= MAX_WATCHES) {
    throw new WatchRejected(
      'limit_reached',
      `You already have ${MAX_WATCHES} watches, the maximum. Delete one with delete_watch first.`,
    );
  }

  const watch: Watch = {
    id: nextId(existing),
    place,
    metric,
    threshold: rounded,
    createdAt: now.toISOString(),
    lastTriggeredAt: null,
  };
  persist([...existing, watch]);
  return watch;
}

/** ลบกฎ — คืน `true` เมื่อมีของให้ลบจริง (agent ต้องแยกออกระหว่าง "ลบแล้ว" กับ "ไม่มีอยู่แต่แรก") */
export function deleteWatch(id: string): boolean {
  const existing = listWatches();
  const remaining = existing.filter((w) => w.id !== id);
  if (remaining.length === existing.length) return false;
  persist(remaining);
  return true;
}

/** บันทึกว่ากฎนี้เพิ่งเตือนไป — ใช้คู่กับเวลาพัก */
export function markTriggered(id: string, now: Date = new Date()): void {
  const existing = listWatches();
  const updated = existing.map((w) => (w.id === id ? { ...w, lastTriggeredAt: now.toISOString() } : w));
  persist(updated);
}

/** ถึงเวลาเตือนอีกครั้งหรือยัง — แยกออกมาเป็นฟังก์ชันบริสุทธิ์เพื่อให้เทสยึดเวลาได้ */
export function mayTrigger(watch: Watch, now: Date = new Date()): boolean {
  if (!watch.lastTriggeredAt) return true;
  const last = Date.parse(watch.lastTriggeredAt);
  if (!Number.isFinite(last)) return true;
  return now.getTime() - last >= RETRIGGER_COOLDOWN_MS;
}

/** ล้างทั้งหมด — สำหรับเทส และสำหรับปุ่ม "ล้างข้อมูลในเบราว์เซอร์นี้" บนหน้าเว็บ */
export function clearWatches(): void {
  const store = storage();
  if (!store) return;
  try {
    store.removeItem(STORAGE_KEY);
  } catch {
    // ลบไม่ได้ก็ไม่มีอะไรให้ทำต่อ — ไม่ใช่เส้นทางที่ผู้ใช้รออยู่
  }
}
