// src/webmcp/types.ts
// ────────────────────────────────────────────────────────────────────────────
// 🔌 **ชนิดข้อมูลแกนของโมดูล WebMCP** (เลน W · `W7` — แผน `docs/tasks/2026-08-27_webmcp_challenge_plan.md` §3.1)
//
// 🔴 **โมดูลนี้ถูกออกแบบให้อยู่ในผลิตภัณฑ์จริงถึงวันเปิดตัว** ไม่ใช่ของใช้แล้วทิ้งสำหรับงานแข่ง
//    (คำสั่งเจ้าของ 27 ส.ค. 2026 ค่ำ) ⇒ ทุกชนิดในไฟล์นี้ต้องอ่านรู้เรื่องโดยไม่ต้องรู้จักการแข่งขัน
//
// ── ⛔ ข้อห้ามที่ยึดทั้งโมดูล ──
//   · **ห้ามเพิ่ม dependency** (มติ D-7) ⇒ JSON Schema เขียนมือ ไม่มี zod/ajv
//   · **ห้ามให้ตัว tool มี business logic** ⇒ `execute` เรียก "ชั้น provider" อย่างเดียว (มติ D-6)
//   · **ห้ามรับพิกัดผู้ใช้เป็น input หลัก** ⇒ ตำแหน่ง = ชื่อ/รหัสจังหวัด (มติ D-26 / GEO-0)

/** ชนิดพื้นฐานของ JSON Schema ที่โมดูลนี้ยอมรับ — จงใจแคบ เพราะ schema ที่ agent อ่านควรเรียบ */
export type JsonSchemaScalar = 'string' | 'number' | 'integer' | 'boolean';

/**
 * คุณสมบัติ 1 ช่องของ input schema
 *
 * 🔑 **หลัก "validate strictly in code, loosely in schema"** (Chrome best practices §3.4 ของไฟล์วิจัย):
 *    schema หลวมพอให้ agent ลองใหม่ได้เอง ส่วนการตรวจจริงอยู่ในโค้ด `execute`
 *    ⇒ ที่นี่จึงไม่มี `pattern`/`minLength` ให้ใส่ โดยตั้งใจ
 */
export interface JsonSchemaProperty {
  type: JsonSchemaScalar;
  /** ⚠️ งบ 150 ตัวอักษร — `defineTool` โยน error ถ้าเกิน (ดู `budgets.ts`) */
  description: string;
  /** ค่าที่ยอมรับ — ใช้ **ค่าเชิงความหมาย** เท่านั้น (`layer="flood"` ⛔ ไม่ใช่ `layer_id=3`) */
  enum?: readonly string[];
  minimum?: number;
  maximum?: number;
}

/** input schema ของ tool — ต้องเป็น object ปิด (`additionalProperties: false`) เสมอ */
export interface JsonSchemaObject {
  type: 'object';
  properties: Record<string, JsonSchemaProperty>;
  required?: readonly string[];
  additionalProperties: false;
}

/**
 * ป้ายบอกลักษณะของ tool ที่ฝั่ง agent ใช้ตัดสินใจว่าต้องขอยืนยันผู้ใช้ไหม
 *
 * 🔴 `untrustedContentHint` **ติดกว้างกว่าที่คิด** (มติ D-14): ทุก tool ที่คืนข้อความ
 *    ซึ่งมีต้นทางจากภายนอก/ผู้ใช้ (ชื่อสถานที่ · หัวข้อประกาศเตือนภัย · ป้ายที่ผู้ใช้ตั้งเอง)
 *    ⇒ ภัยหลักของโลก agent คือ **indirect prompt injection** ไม่ใช่ข้อมูลผิด
 */
export interface ToolAnnotations {
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  untrustedContentHint?: boolean;
}

/**
 * เงื่อนไขที่ต้องผ่านก่อน tool ทำงาน — **ประกาศไว้ที่นิยาม ไม่ใช่เช็คใน `execute`** (มติ D-9)
 *
 * 🔑 เหตุผลเชิงอายุยืน: วันที่ระบบ consent/PDPA ของจริงมาเสียบ ด่านจะดักที่ **wrapper เดียว**
 *    ⛔ ไม่ใช่กระจาย `if (!user) throw` ไว้ใน execute ของทุกตัว ซึ่งเป็นก๊อปที่ลืมอัปเดตแน่นอน
 *    (ตัวแข่งเป็น guest ล้วน ⇒ ทุก tool ที่ส่งแข่ง `auth` ต้องไม่เป็น `true`)
 */
export interface ToolRequires {
  auth?: boolean;
  /** วัตถุประสงค์ตามทะเบียน PDPA — ยังไม่มีตัวบังคับใช้ ณ วันนี้ ประกาศไว้ให้ด่านอนาคตอ่าน */
  consentPurpose?: string;
}

/** บริบทที่ tool ได้รับตอนถูกเรียก — `signal` มาจากฝั่งเบราว์เซอร์/ผู้เรียก */
export interface ToolExecuteContext {
  signal?: AbortSignal;
}

/**
 * 🔴 **ผลลัพธ์ของ tool = object JSON ล้วน**
 *
 * ⛔ ห้ามคืน HTML/สตริงที่ตั้งใจให้ไป render — ผลทุกชิ้นผ่าน React escaping เท่านั้น (มติ D-17)
 */
export type ToolOutput = Record<string, unknown>;

/**
 * 🕒 **แสตมป์ความสดของข้อมูล 1 ก้อน** (มติ D-16)
 *
 * 🔑 ทุกก้อนข้อมูลที่ออกจาก tool **ต้องบอกได้ว่ามาจากไหนและเมื่อไร** — ไม่มีข้อยกเว้น
 *    เพราะคำตอบของ agent จะถูกอ่านโดยคนที่ไม่เห็นหน้าจอ ⇒ "ค่าฝุ่น 82" ที่ไม่มีเวลา
 *    คือคำตอบที่ **ตรวจสอบไม่ได้** และอาจเก่าเป็นวัน
 */
export interface Freshness {
  /** ISO 8601 — เวลาที่ **ต้นทาง** ออกข้อมูลก้อนนี้ · `null` = ต้นทางไม่บอก (⛔ ห้ามเดาเป็นเวลาปัจจุบัน) */
  observedAt: string | null;
  /** ชื่อแหล่งที่ให้เครดิตได้จริง เช่น `"TMD CAP"` — ใช้ในหน้าเครดิต README ด้วย (R14) */
  source: string;
  /** `true` = ตอบจากสำเนาสำรองเพราะต้นทางล้ม ⇒ ฝั่ง UI/agent ต้องเห็นป้าย "cached" */
  cached: boolean;
}

/** ก้อนข้อมูลที่ติดแสตมป์แล้ว — ใช้ห่อทุกค่าที่ tool คืนออกไป */
export interface Stamped<T> extends Freshness {
  value: T;
}

/**
 * 🚧 **ส่วนที่ขาดของคำตอบ — ประกาศ ไม่ใช่กลบ**
 *
 * 🔑 **หลัก fail-closed ของเลนนี้** (รับจาก [[L-395]] + เคสจอ `/pins`): fail-closed เป็นคุณสมบัติ
 *    ของ *คำถามที่กำลังถาม* ไม่ใช่ของฟังก์ชัน
 *      · **tool ฝั่งอ่าน** ข้อมูลบางส่วนหาย ⇒ ตอบส่วนที่มี + ใส่ `gaps` บอกว่าอะไรหาย เพราะอะไร
 *        ⛔ ห้ามล้มทั้งคำตอบเพราะตัวเลขประกอบตัวเดียว (คนถามว่า "ไปสวนได้ไหม" ไม่ได้ถามค่า PM2.5)
 *      · **tool ฝั่งเขียน** validate ไม่ผ่าน ⇒ ปฏิเสธทั้งคำสั่ง (fail-closed เต็มรูป)
 */
export interface ToolGap {
  /** ชื่อส่วนที่หาย เช่น `"air_quality"` — ค่าเชิงความหมาย ให้ agent เล่าต่อได้ */
  part: string;
  /** เหตุผลระดับเครื่อง เช่น `"requires_sign_in"` · `"upstream_unavailable"` */
  reason: string;
  /** ประโยค EN สั้น ๆ ที่ agent หยิบไปบอกผู้ใช้ได้ทันที */
  detail: string;
}

/** นิยาม tool 1 ตัวหลังผ่าน `defineTool` แล้ว — รูปนี้คือสิ่งที่เอาไปลงทะเบียนกับเบราว์เซอร์ */
export interface WebMCPTool {
  name: string;
  /** ป้ายที่ผู้ใช้เห็นในแผง Site tools — ดึงจาก i18n 5 ภาษา (มติ D-10) · `undefined` = ให้เบราว์เซอร์ใช้ `name` */
  title?: string;
  /** คำอธิบาย **ภาษาอังกฤษ** สำหรับ agent อ่าน (⛔ ไม่แปล — agent ไม่ได้อ่านภาษาผู้ใช้) */
  description: string;
  inputSchema: JsonSchemaObject;
  annotations: ToolAnnotations;
  requires: ToolRequires;
  execute(input: unknown, ctx: ToolExecuteContext): Promise<ToolOutput>;
}

/**
 * 🌐 **รูปของ API เบราว์เซอร์ที่เราต้องคุยด้วย**
 *
 * 🪤 **สเปกยังเป็น Draft (แก้ล่าสุด 26 ส.ค. 2026)** และเอกสาร 2 เจ้าวางของไว้คนละที่:
 *      · คู่มือ ChatGPT ใช้ `document.modelContext`
 *      · บทความ Netlify ใช้ `navigator.modelContext`
 *    ⇒ เราต้อง feature-detect **ทั้งคู่** ⛔ ห้ามยึดที่เดียวแล้วสรุปว่า "เบราว์เซอร์ไม่รองรับ"
 */
export interface ModelContextHost {
  registerTool(
    descriptor: RegisteredToolDescriptor,
    options?: { signal?: AbortSignal },
  ): unknown;
}

/** สิ่งที่ส่งเข้า `registerTool` จริง ๆ — ตรงตามตัวอย่างในคู่มือ Chrome/ChatGPT */
export interface RegisteredToolDescriptor {
  name: string;
  title?: string;
  description: string;
  inputSchema: JsonSchemaObject;
  annotations: ToolAnnotations;
  execute(input: unknown, ctx: ToolExecuteContext): Promise<ToolOutput>;
}
