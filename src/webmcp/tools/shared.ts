// src/webmcp/tools/shared.ts
// ────────────────────────────────────────────────────────────────────────────
// 🧰 **ตัวช่วยที่ tool ทุกตัวใช้ร่วมกัน** — การอ่าน input และการย่อผลลัพธ์
//
// 🔑 **หลัก "validate strictly in code, loosely in schema"** (Chrome best practices):
//    schema ปล่อยหลวมพอให้ agent ลองใหม่เองได้ ⇒ **ด่านจริงอยู่ที่นี่** และต้องคืนข้อความ
//    ที่ **บอกทางไปต่อ** เสมอ ไม่ใช่แค่บอกว่าผิด

import { ToolError } from '../defineTool';
import type { EnvironmentSnapshot, LocationHit } from '../providers/types';
import type { UiPlaceRef, UiSnapshotSummary } from '../uiBridge';

/** ความยาวคำค้นสูงสุด — เท่ากับที่หลังบ้านรับ (`q.length > 120` = ปฏิเสธ) ⇒ ไม่ยิงของที่รู้ว่าโดนตีกลับ */
export const MAX_QUERY_CHARS = 120;

/** ตัวอย่างที่ใส่ในข้อความ error — ให้ agent ลองใหม่ได้ทันทีโดยไม่ต้องถามผู้ใช้ */
export const EXAMPLE_PLACES = 'Chiang Mai, Bangkok, Phuket';

/** input ของ tool มาเป็น `unknown` เสมอ (agent ส่งอะไรมาก็ได้) ⇒ อ่านแบบไม่เชื่ออะไรเลย */
function asRecord(input: unknown): Record<string, unknown> {
  return input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
}

/**
 * อ่านช่องข้อความที่ **จำเป็น**
 *
 * ⚠️ ตัวเลข/บูลีนที่ agent ส่งมาแทนสตริง **แปลงให้** — ไม่ใช่ปฏิเสธ ("50" กับ 50 คือเจตนาเดียวกัน)
 *    ⛔ แต่ `object`/`array` ไม่แปลง เพราะนั่นแปลว่า agent เข้าใจ schema ผิดจริง ๆ
 */
export function requiredText(input: unknown, field: string): string {
  const raw = asRecord(input)[field];
  const text =
    typeof raw === 'string' ? raw : typeof raw === 'number' || typeof raw === 'boolean' ? String(raw) : '';
  const trimmed = text.trim();
  if (!trimmed) {
    throw new ToolError(
      'missing_field',
      `Missing "${field}". Provide a place name or province code, for example: ${EXAMPLE_PLACES}.`,
    );
  }
  if (trimmed.length > MAX_QUERY_CHARS) {
    throw new ToolError(
      'field_too_long',
      `"${field}" is longer than ${MAX_QUERY_CHARS} characters — send just the place name, for example: ${EXAMPLE_PLACES}.`,
    );
  }
  return trimmed;
}

/** อ่านช่องที่ต้องเป็นค่าในทะเบียนปิด — ไม่ส่งมาก็ใช้ค่าเริ่มต้น (agent ไม่ควรถูกบังคับให้เดา) */
export function optionalEnum<T extends string>(
  input: unknown,
  field: string,
  allowed: readonly T[],
  fallback: T,
): T {
  const raw = asRecord(input)[field];
  if (raw === undefined || raw === null || raw === '') return fallback;
  const text = String(raw).trim().toLowerCase();
  const hit = allowed.find((value) => value.toLowerCase() === text);
  if (!hit) {
    throw new ToolError(
      'invalid_value',
      `"${field}" must be one of: ${allowed.join(', ')}. Received "${String(raw)}".`,
    );
  }
  return hit;
}

/**
 * ย่อข้อความยาวให้อยู่ในงบผลลัพธ์
 * 🔑 ย่อ **ข้อความ** ไม่ใช่ตัด **รายการ** ทิ้งเงียบ ๆ — จำนวนที่หายไปต้องมีคนบอก (ดู `capList`)
 */
export function clip(text: string | null, max: number): string | null {
  if (typeof text !== 'string') return null;
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed || null;
  return `${trimmed.slice(0, max - 1)}…`;
}

/**
 * ตัดรายการให้สั้นลง **พร้อมบอกว่าตัดไปกี่ใบ**
 * ⛔ การตัดเงียบ ๆ = agent อ่านว่า "มีแค่ 3 ใบ" ทั้งที่มี 12 ใบ ⇒ คำตอบผิดโดยที่ไม่มีใครเห็น
 */
export function capList<T>(items: T[], max: number): { shown: T[]; omitted: number } {
  if (items.length <= max) return { shown: items, omitted: 0 };
  return { shown: items.slice(0, max), omitted: items.length - max };
}

/** แปลงผลค้นหาเป็นรูปที่ `uiBridge` ใช้ — ที่เดียวเพื่อไม่ให้แต่ละ tool ประกอบเองคนละแบบ */
export function toPlaceRef(hit: LocationHit): UiPlaceRef {
  return { code: hit.code, labelTh: hit.nameTh, labelEn: hit.nameEn };
}

/**
 * 🖥️ **แปลงคำตอบของ provider → รูปที่จอใช้** — ที่เดียวสำหรับ *ทุก* ทางที่ข้อมูลขึ้นจอ
 *
 * 🔴 **ทำไมต้องเป็นฟังก์ชันกลาง ⛔ ไม่ปล่อยให้แต่ละที่ประกอบเอง** (31 ส.ค. 2026):
 *    ตั้งแต่มีกระดาน `LiveBoard` หน้าเว็บมีของที่อ่านสแนปช็อต **2 ทาง** —
 *    ① tool ที่ agent เรียก ② กระดานที่หน้าเว็บโหลดเองตอนเปิดหน้า
 *    ⇒ ถ้าต่างคนต่างประกอบ วันไหนกติกาเปลี่ยน (เช่น `cached` ต้องนับชั้นอากาศด้วย)
 *      จะแก้ที่เดียวแล้วอีกที่เพี้ยนเงียบ ๆ ⇒ **ตัวเลข 2 ก้อนบนจอเดียวกันไม่ตรงกัน**
 *      ซึ่งเป็นสิ่งเดียวที่หน้านี้ทั้งหน้าพยายามพิสูจน์ว่าไม่เกิด (คำมั่น «จอเห็นสิ่งเดียวกับที่ agent อ่าน»)
 *
 * 🔑 **`maxAlerts` คือจำนวนที่ *agent* ได้เห็น** — จอหยิบ `topAlert` จากชุดเดียวกันนั้น
 *    ⇒ ประกาศใบที่ขึ้นจอ = ใบที่ agent อ่าน ⛔ ไม่ใช่คนละใบเพราะคนละวิธีตัด
 */
export function summarizeSnapshot(snapshot: EnvironmentSnapshot, maxAlerts: number): UiSnapshotSummary {
  const alerts = snapshot.alerts;
  const capped = alerts ? capList(alerts.value, maxAlerts) : { shown: [], omitted: 0 };

  return {
    aqi: snapshot.air?.value.aqi ?? null,
    pm25: snapshot.air?.value.pm25 ?? null,
    category: snapshot.air?.value.category ?? null,
    /** 🔴 `null` = **อ่านชั้นประกาศไม่ได้** ⛔ ไม่ใช่ 0 — จอแสดงคนละอย่าง */
    alertCount: alerts ? alerts.value.length : null,
    topAlert: capped.shown[0]?.event ?? null,
    observedAt: alerts?.observedAt ?? snapshot.air?.observedAt ?? null,
    source: alerts?.source ?? snapshot.air?.source ?? null,
    cached: Boolean(alerts?.cached || snapshot.air?.cached),
    /** ⛔ ส่งเฉพาะตัวเลขที่มี = จอดูสมบูรณ์กว่าความจริง ⇒ ส่วนที่ขาดต้องติดไปด้วยเสมอ */
    gaps: snapshot.gaps.map((gap) => gap.part),
    /**
     * 🕒 **แสตมป์แยกรายชั้น — จอจะได้บอกได้ว่า *อะไรสด อะไรเป็นสำเนา*** (เหตุผลเต็มที่ `uiBridge.ts`)
     *    ⛔ ห้ามยุบกลับเป็นชุดเดียว — การ์ดใบเดียวถือของ 2 ชั้นที่สดไม่เท่ากัน
     */
    layers: {
      air: snapshot.air
        ? { observedAt: snapshot.air.observedAt, source: snapshot.air.source, cached: snapshot.air.cached }
        : null,
      alerts: alerts ? { observedAt: alerts.observedAt, source: alerts.source, cached: alerts.cached } : null,
    },
  };
}
