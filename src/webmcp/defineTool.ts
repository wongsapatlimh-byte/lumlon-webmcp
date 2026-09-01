// src/webmcp/defineTool.ts
// ────────────────────────────────────────────────────────────────────────────
// 🧱 **ตัวช่วยนิยาม tool 1 ตัว** (`B1` ของ scope · มติ D-7/D-9)
//
// 🔴 **ทำไมต้องมีชั้นนี้ แทนที่จะเรียก `registerTool` ตรง ๆ:**
//   ① **ด่านตอนสร้าง** — ชื่อผิดรูป / คำอธิบายเกินงบ / ลืมประกาศขอบเขตไทย = พังตั้งแต่ import
//      ⇒ เทสจับได้ ⛔ ไม่ใช่ไปเจอตอนกรรมการเปิดแผง Site tools แล้ว tool หายไปเงียบ ๆ
//   ② **ที่เดียวที่ห่อ `execute`** — telemetry · งบผลลัพธ์ · การยกเลิก · การแปลง error
//      ให้เป็นข้อความที่ agent เอาไปเล่าต่อได้ ⇒ ไม่ต้องเขียนซ้ำใน tool ทุกตัว
//   ③ **จุดเสียบด่าน consent/PDPA ในอนาคต** (มติ D-9) — `requires` ถูกอ่านที่นี่ที่เดียว
//
// ⛔ **ห้ามเพิ่ม dependency** (มติ D-7 · นโยบายรีโป) ⇒ ทั้งไฟล์เป็น TypeScript เปล่า ๆ

import {
  DESCRIPTION_BUDGET,
  PARAM_DESCRIPTION_BUDGET,
  OUTPUT_BUDGET,
  TOOL_NAME_PATTERN,
  THAILAND_SCOPE_PHRASE,
  measureOutput,
} from './budgets';
import { recordToolCall, type ToolOutcome } from './telemetry';
import type {
  JsonSchemaObject,
  ToolAnnotations,
  ToolExecuteContext,
  ToolOutput,
  ToolRequires,
  WebMCPTool,
} from './types';

/**
 * ผิดตั้งแต่ **นิยาม** tool — เป็นบั๊กของเรา ไม่ใช่ของผู้ใช้/agent
 * ⇒ โยนตอน import ให้ตายเสียงดังตั้งแต่เทสรอบแรก
 */
export class ToolSpecError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ToolSpecError';
  }
}

/**
 * ผิดตอน **เรียกใช้** — agent ส่งอะไรมาไม่ถูก หรือของที่ขอไม่มีจริง
 *
 * 🔑 **ข้อความต้องมีทางไปต่อเสมอ** (Chrome best practices): *"out of coverage — this demo
 *    covers Thailand · try: Chiang Mai, Bangkok"* ดีกว่า *"invalid location"* คนละโลก
 *    เพราะ agent อ่านข้อความนี้แล้ว **ลองใหม่เองได้ทันที** โดยไม่ต้องรบกวนผู้ใช้
 */
export class ToolError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'ToolError';
    this.code = code;
  }
}

export interface ToolSpec {
  name: string;
  /** ป้ายภาษาผู้ใช้ (มติ D-10) — ไม่ใส่ก็ได้ เบราว์เซอร์จะใช้ `name` แทน */
  title?: string;
  /** EN · ต้องมีประโยคขอบเขตไทย (D-27) · ≤500 ตัว */
  description: string;
  inputSchema: JsonSchemaObject;
  annotations: ToolAnnotations;
  requires?: ToolRequires;
  execute(input: unknown, ctx: ToolExecuteContext): Promise<ToolOutput>;
}

/**
 * 🪤 **ทำไมถึงบังคับให้ประกาศ `readOnlyHint` ทุกตัว แม้ค่าจะเป็น `false`:**
 *    tool ที่ไม่ติดป้ายเลย = agent ต้องเดาว่าเรียกแล้วมีผลข้างเคียงไหม ⇒ ท่าที่ปลอดภัยของ agent
 *    คือ *"ถามผู้ใช้ก่อนทุกครั้ง"* ซึ่งทำให้ tool อ่านอย่างเดียวใช้งานไม่ลื่นโดยไม่จำเป็น
 *    ⇒ บังคับให้ **ตอบคำถามนี้ตรง ๆ ตอนเขียน** ⛔ ไม่ใช่ปล่อยว่างแล้วให้ปลายทางเดา
 *    (`false` ที่เขียนไว้ชัด ๆ มีค่ามากกว่าการไม่เขียนอะไรเลย — คนอ่านโค้ดรู้ว่าคิดมาแล้ว)
 */
function assertAnnotations(name: string, annotations: ToolAnnotations): void {
  if (typeof annotations.readOnlyHint !== 'boolean') {
    throw new ToolSpecError(
      `[webmcp] tool "${name}" ต้องประกาศ readOnlyHint (true หรือ false) — ห้ามปล่อยให้ agent เดาว่ามีผลข้างเคียงไหม`,
    );
  }
  if (annotations.readOnlyHint && annotations.destructiveHint) {
    throw new ToolSpecError(`[webmcp] tool "${name}" ประกาศทั้ง readOnlyHint และ destructiveHint พร้อมกัน`);
  }
}

function assertSchema(name: string, schema: JsonSchemaObject): void {
  if (schema.type !== 'object' || schema.additionalProperties !== false) {
    throw new ToolSpecError(`[webmcp] tool "${name}" ต้องใช้ inputSchema แบบ object ปิด (additionalProperties: false)`);
  }
  for (const [key, prop] of Object.entries(schema.properties)) {
    if (!prop.description) {
      throw new ToolSpecError(`[webmcp] tool "${name}" ช่อง "${key}" ไม่มีคำอธิบาย — agent จะเดาความหมายเอง`);
    }
    if (prop.description.length > PARAM_DESCRIPTION_BUDGET) {
      throw new ToolSpecError(
        `[webmcp] tool "${name}" ช่อง "${key}" คำอธิบายยาว ${prop.description.length} ตัว (งบ ${PARAM_DESCRIPTION_BUDGET})`,
      );
    }
  }
  for (const req of schema.required ?? []) {
    if (!(req in schema.properties)) {
      throw new ToolSpecError(`[webmcp] tool "${name}" ประกาศ required "${req}" ที่ไม่มีใน properties`);
    }
  }
}

/**
 * สร้าง tool 1 ตัวพร้อมด่านครบ
 *
 * 🔑 **ทุกอย่างที่ตรวจได้ตอนสร้าง ตรวจตอนสร้าง** — เพราะ tool ที่พังตอนกรรมการกดเรียก
 *    ไม่มีใครแก้ทันในช่วง freeze (3–23 ก.ย. ห้าม redeploy)
 */
export function defineTool(spec: ToolSpec): WebMCPTool {
  const { name, title, description, inputSchema, annotations, requires = {}, execute } = spec;

  if (!TOOL_NAME_PATTERN.test(name)) {
    throw new ToolSpecError(`[webmcp] ชื่อ tool "${name}" ผิดรูป — ใช้ได้แค่ a-z 0-9 _ - . ยาว 1-128 ตัว`);
  }
  if (description.length > DESCRIPTION_BUDGET) {
    throw new ToolSpecError(
      `[webmcp] tool "${name}" คำอธิบายยาว ${description.length} ตัว (งบ ${DESCRIPTION_BUDGET})`,
    );
  }
  if (!description.includes(THAILAND_SCOPE_PHRASE)) {
    throw new ToolSpecError(
      `[webmcp] tool "${name}" คำอธิบายต้องมีประโยคขอบเขต "${THAILAND_SCOPE_PHRASE}" (มติ D-27)`,
    );
  }
  assertAnnotations(name, annotations);
  assertSchema(name, inputSchema);

  return {
    name,
    title,
    description,
    inputSchema,
    annotations,
    requires,
    async execute(input, ctx) {
      const startedAt = Date.now();
      let outcome: ToolOutcome = 'ok';
      let outputChars: number | null = null;
      let overBudget = false;

      try {
        /**
         * 🔴 **ยกเลิกแล้วต้องไม่ทำงานต่อ** — agent เปลี่ยนใจระหว่างทางเป็นเรื่องปกติ
         *    (ผู้ใช้พิมพ์ต่อ / ปิดแท็บ) ⇒ เช็คก่อนเริ่ม ไม่ใช่ปล่อยให้ยิง network ทิ้ง
         */
        ctx.signal?.throwIfAborted();

        const output = await execute(input, ctx);
        outputChars = measureOutput(output);
        overBudget = outputChars > OUTPUT_BUDGET;
        return output;
      } catch (error) {
        if (ctx.signal?.aborted) outcome = 'aborted';
        else if (error instanceof ToolError) outcome = 'rejected';
        else outcome = 'error';
        /**
         * 🔑 **โยนต่อ ⛔ ไม่กลืนเป็นผลลัพธ์สำเร็จ** — ช่องทางผลลัพธ์ของสเปกแปลว่า "สำเร็จ"
         *    ⇒ การคืน `{ error: ... }` ทำให้ agent เข้าใจว่างานเสร็จแล้วและเล่าคำตอบผิดให้ผู้ใช้
         *    ซึ่งอันตรายกว่าการไม่ตอบ โดยเฉพาะกับคำถามเรื่องความปลอดภัย
         */
        throw error;
      } finally {
        recordToolCall({
          tool: name,
          outcome,
          durationMs: Date.now() - startedAt,
          outputChars,
          overBudget,
        });
      }
    },
  };
}
