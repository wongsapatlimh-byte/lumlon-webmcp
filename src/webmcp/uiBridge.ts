// src/webmcp/uiBridge.ts
// ────────────────────────────────────────────────────────────────────────────
// 🌉 **สะพานจาก tool → จอที่คนมองอยู่** (`B4` ของ scope)
//
// 🔴 **นี่คือหัวใจของธีมการแข่งขัน ไม่ใช่ของประดับ:** โจทย์คือ *"คนกับ agent ทำงานร่วมกัน
//    บนจอเดียว"* ⇒ tool ที่ทำงานเสร็จแล้วจอไม่ขยับ = เว็บกลายเป็น API ที่บังเอิญมีหน้าตา
//    และคนที่นั่งอยู่หน้าจอไม่มีทางรู้ว่า agent เพิ่งทำอะไรแทนเขาไป
//
// 🔑 **เหตุผลเชิงเทคนิคที่คู่มือ Chrome ยกมาเอง:** agent วางแผนก้าวถัดไปจากสิ่งที่ *เห็นบนจอ*
//    ⇒ จอที่อัปเดตคือ feedback loop ของ agent ด้วย ไม่ใช่แค่ของผู้ใช้
//
// ── ทำไมเป็น event bus ไม่ใช่ Context ──
//   tool ถูกเรียกจาก **นอกวงจร React** (เบราว์เซอร์เรียก `execute` ตรง ๆ) ⇒ ไม่มี component tree
//   ให้เกาะ · bus เล็ก ๆ ที่ไม่ผูกกับ React ทำให้ตัว tool ทดสอบได้โดยไม่ต้อง render อะไรเลย

/** ตำแหน่งที่ tool อ้างถึง — **ชื่อ/รหัสเท่านั้น** ⛔ ไม่มีพิกัด (มติ D-26 / GEO-0) */
export interface UiPlaceRef {
  /** รหัสจังหวัดจากทะเบียนหลังบ้าน — 2 หลัก เช่น `"50"` — `null` เมื่อเป็นสถานที่ย่อยที่ไม่มีรหัส */
  code: string | null;
  labelTh: string;
  labelEn: string;
}

/**
 * เหตุการณ์ที่ tool ประกาศให้จอรู้
 *
 * ⚠️ **ชนิดปิด (union) โดยตั้งใจ** — เพิ่มเหตุการณ์ใหม่ต้องมาแก้ที่นี่ ⇒ คนที่เพิ่ม tool
 *    ถูกบังคับให้ตอบคำถาม *"แล้วจอจะขยับยังไง"* ตั้งแต่ตอนเขียน ไม่ใช่ตอนถ่ายวิดีโอ
 */
/**
 * สรุปสิ่งที่ agent เพิ่งอ่าน — **รูปสำหรับจอ ⛔ ไม่ใช่รูปสำหรับ agent**
 *
 * 🔑 จอกับ agent ต้องการคนละอย่าง: agent ต้องการ JSON ที่ประหยัด context ส่วนคนต้องการ
 *    *"ตอนนี้กี่ · เมื่อไร · จากไหน · อะไรหาย"* ⇒ แยกรูปกัน ⛔ อย่าให้จอไป parse ผลของ tool
 */
export interface UiSnapshotSummary {
  aqi: number | null;
  pm25: number | null;
  category: string | null;
  /** 🔴 `null` = **อ่านชั้นประกาศไม่ได้** ⛔ ไม่ใช่ 0 (คนละความหมาย — จอต้องแสดงต่างกัน) */
  alertCount: number | null;
  topAlert: string | null;
  observedAt: string | null;
  source: string | null;
  cached: boolean;
  /** ชื่อส่วนที่ขาด — จอต้องเขียนให้เห็น ⛔ ไม่ใช่ซ่อนแล้วโชว์เฉพาะตัวเลขที่มี */
  gaps: string[];
  /**
   * 🕒 **แสตมป์แยกรายชั้น** (เพิ่ม 31 ส.ค. 2026 — เจอตอนเอาการ์ดขึ้นหน้าแรกแล้วดูด้วยตา)
   *
   * 🔴 **ปัญหาที่ช่องนี้มาแก้ — เป็นเรื่องความซื่อสัตย์ ⛔ ไม่ใช่ความสวยงาม:**
   *    การ์ด 1 ใบถือของ **2 ชั้นที่สดไม่เท่ากัน** — อากาศ *สดทุกคำขอ* · ประกาศเตือนภัย
   *    *เป็นสแนปช็อตติดวันที่* · แต่แสตมป์เดิมมีชุดเดียว และเลือก **ของชั้นประกาศก่อน**
   *    ⇒ การ์ดที่โชว์ PM2.5 สด ๆ ติดป้ายว่า `29 ส.ค. · cached copy`
   *    ⇒ **โกหก 2 ทิศพร้อมกัน**: ทำให้ของสดดูเก่า และยกเครดิตค่าอากาศไปให้กรมอุตุฯ
   *    🔬 มองไม่เห็นมาตลอดเพราะการ์ดเคยขึ้นเฉพาะตอน agent เรียก ⇒ ไม่มีใครนั่งอ่านนาน ๆ
   *
   * 🔑 **เป็นช่องเสริม (`?`) โดยตั้งใจ** — ของเดิมที่ไม่ส่งมายังแสดงแบบเดิมได้ครบ
   *    ⇒ ไม่ต้องแตะ call site ที่พิสูจน์แล้วแม้แต่ที่เดียว (กติกา K7)
   */
  layers?: {
    air?: StampedLayer | null;
    alerts?: StampedLayer | null;
  };
}

/** เวลา+แหล่ง+สถานะสำเนา ของข้อมูล **ชั้นเดียว** — ⛔ ห้ามเอาไปปนข้ามชั้น */
export interface StampedLayer {
  observedAt: string | null;
  source: string | null;
  cached: boolean;
}

/** เหตุผล 1 ข้อที่จอได้รับ — `code` ให้จอแปล · `detail` เป็นทางตกเป็น EN · `values` ไว้เติมลงแม่แบบ */
export interface UiBriefingReason {
  code: string;
  detail: string;
  values?: Readonly<Record<string, string | number>>;
}

/** คำแนะนำ 1 ข้อ — ไม่มีค่าตัวเลขให้เติม จึงไม่มี `values` */
export interface UiBriefingAdvice {
  code: string;
  detail: string;
}

export type UiEvent =
  | { type: 'search.results'; query: string; places: UiPlaceRef[] }
  | { type: 'snapshot.shown'; place: UiPlaceRef; summary: UiSnapshotSummary }
  | {
      type: 'briefing.shown';
      place: UiPlaceRef;
      activity: string;
      level: string;
      /**
       * 🔤 **ส่ง `code` + `values` มาด้วย ⛔ ไม่ใช่ประโยคอังกฤษล้วน** (แก้ 30 ส.ค. 2026)
       *    จอต้องประกอบประโยคในภาษาที่ผู้ใช้เลือกเองได้ · `detail` เป็นทางตกเมื่อยังไม่มีคำแปล
       *    🔬 เดิมส่งแต่ประโยค EN ⇒ กดปุ่มไทยแล้วการ์ดคำแนะนำยังเป็นอังกฤษ (เจ้าของเห็นกับตา)
       */
      reasons: UiBriefingReason[];
      advice: UiBriefingAdvice[];
    }
  | { type: 'watch.created'; watchId: string; place: UiPlaceRef; metric: string; threshold: number }
  | { type: 'watch.deleted'; watchId: string }
  | { type: 'watch.listed'; count: number }
  | { type: 'watch.triggered'; watchId: string; place: UiPlaceRef; metric: string; observed: number };

export type UiEventListener = (event: UiEvent) => void;

const listeners = new Set<UiEventListener>();

/** ประวัติสั้น ๆ ให้แผงกิจกรรมบนหน้าเว็บอ่านย้อนหลังได้ตอน mount ทีหลัง */
const history: UiEvent[] = [];
const HISTORY_LIMIT = 20;

/** สมัครฟัง — คืนฟังก์ชันถอนการสมัคร (ใช้ตรง ๆ ใน `useEffect` cleanup ได้) */
export function subscribeUi(listener: UiEventListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * ประกาศเหตุการณ์
 *
 * 🪤 **ตัวฟังตัวหนึ่งพังต้องไม่ทำให้ตัวอื่นไม่ได้ยิน** — และห้ามทำให้ `execute` ของ tool ล้ม
 *    ด้วย (จอพังไม่ใช่เหตุผลที่จะไม่ตอบคำถามเรื่องความปลอดภัย) ⇒ ครอบ try/catch รายตัว
 */
export function emitUi(event: UiEvent): void {
  history.push(event);
  if (history.length > HISTORY_LIMIT) history.shift();

  for (const listener of [...listeners]) {
    try {
      listener(event);
    } catch (error) {
      console.warn('[webmcp] ตัวฟัง uiBridge โยน error — ข้ามตัวนี้แล้วแจ้งตัวอื่นต่อ', error);
    }
  }
}

/** เหตุการณ์ล่าสุด (เก่า → ใหม่) */
export function uiHistory(): UiEvent[] {
  return [...history];
}

/** ล้างทั้งบัส — สำหรับเทสเท่านั้น */
export function resetUiBridge(): void {
  listeners.clear();
  history.length = 0;
}
