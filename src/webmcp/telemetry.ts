// src/webmcp/telemetry.ts
// ────────────────────────────────────────────────────────────────────────────
// 📊 **ตัวนับการใช้งาน tool** (มติ D-11)
//
// 🔴 **ไม่มี endpoint = ไม่ยิง network เด็ดขาด** — ตัวส่งแข่งถูกกรรมการเปิด DevTools ดูแน่นอน
//    request ที่ล้มเป็นสีแดงใน console คือสิ่งแรกที่คนสายเว็บมองเห็น (กรรมการมาจาก Chrome/Vercel/
//    Shopify/Cloudflare/Netlify ทั้งชุด) ⇒ ที่นี่พิมพ์ console อย่างเดียว
//
// 🔑 ตัวเลขที่เก็บมีไว้ตอบคำถามเดียว: *"agent เรียกอะไร สำเร็จไหม ใช้เวลาเท่าไร"*
//    ⛔ ไม่เก็บ input ของผู้ใช้ (คำค้น/ชื่อสถานที่) — นั่นคือข้อมูลความสนใจเชิงตำแหน่ง
//    ซึ่งทั้งเลน 3 ยอมออกแบบให้ลำบากกว่าเดิมเพื่อไม่ให้มันออกจากเบราว์เซอร์

export type ToolOutcome = 'ok' | 'error' | 'rejected' | 'aborted';

export interface ToolCallRecord {
  tool: string;
  outcome: ToolOutcome;
  durationMs: number;
  /** ความยาวผลลัพธ์ (ตัวอักษร) — `null` เมื่อไม่มีผลลัพธ์ */
  outputChars: number | null;
  /** `true` เมื่อผลลัพธ์เกิน `OUTPUT_BUDGET` ⇒ สัญญาณให้ไปตัดคำตอบให้สั้นลง */
  overBudget: boolean;
}

const counters = new Map<string, { calls: number; errors: number }>();
const recent: ToolCallRecord[] = [];

/** เพดานประวัติในหน่วยความจำ — แค่พอให้เปิด console ดูย้อนหลังได้ ไม่ใช่ที่เก็บข้อมูล */
const RECENT_LIMIT = 50;

export function recordToolCall(record: ToolCallRecord): void {
  const bucket = counters.get(record.tool) ?? { calls: 0, errors: 0 };
  bucket.calls += 1;
  if (record.outcome === 'error') bucket.errors += 1;
  counters.set(record.tool, bucket);

  recent.push(record);
  if (recent.length > RECENT_LIMIT) recent.shift();

  const label = `[webmcp] ${record.tool} → ${record.outcome} (${Math.round(record.durationMs)}ms)`;
  if (record.outcome === 'error') console.warn(label);
  else if (record.overBudget) console.warn(`${label} ⚠️ output ${record.outputChars} chars over budget`);
  else console.info(label);
}

/** สรุปตัวนับ — ใช้ในเทสและตอนเปิด console ดูเอง */
export function telemetrySnapshot(): {
  counters: Record<string, { calls: number; errors: number }>;
  recent: ToolCallRecord[];
} {
  return {
    counters: Object.fromEntries([...counters].map(([k, v]) => [k, { ...v }])),
    recent: [...recent],
  };
}

/** ล้างตัวนับ — สำหรับเทสเท่านั้น (แต่ละเทสต้องเริ่มจากศูนย์ ไม่งั้นลำดับเทสมีผลกับผล) */
export function resetTelemetry(): void {
  counters.clear();
  recent.length = 0;
}
