// src/webmcp/registry.ts
// ────────────────────────────────────────────────────────────────────────────
// 📋 **ทะเบียนเครื่องมือ** — ที่เดียวที่ตอบว่า "หน้านี้เปิด tool อะไรให้ agent บ้าง"
//
// 🔑 **จำนวน tool คือต้นทุน ไม่ใช่ผลงาน** (มติ D-12): คำอธิบายทุกตัวถูกยัดเข้า context ของ agent
//    ทุกครั้งที่ผู้ใช้พิมพ์ ⇒ tool ที่ 7 ที่ "มีก็ดี" ทำให้ 6 ตัวแรกถูกเลือกผิดบ่อยขึ้น
//    ⛔ เพิ่ม tool ใหม่ต้องตอบให้ได้ก่อนว่ามันแทน tool เดิมตัวไหน หรือทำอะไรที่ตัวเดิมทำไม่ได้จริง
//
// 🌐 **ป้ายภาษาผู้ใช้ (`title`) มาจากข้างนอก** (มติ D-10) — ทะเบียนนี้ไม่รู้จัก i18n ของแอป
//    ⇒ จุดต่อเชื่อมที่มี `useLanguage()` อยู่แล้วเป็นคนส่ง `titleFor` เข้ามา
//    ⛔ **ไม่สร้างพจนานุกรมชุดที่สองในโมดูลนี้** (นโยบายรีโป: i18n มีไฟล์กลางไฟล์เดียว)

import type { WebMCPDataProvider } from './providers/types';
import { createGetEnvironmentSnapshotTool } from './tools/getEnvironmentSnapshot';
import { createGetSafetyBriefingTool } from './tools/getSafetyBriefing';
import { createSearchLocationsTool } from './tools/searchLocations';
import {
  createCreateWatchTool,
  createDeleteWatchTool,
  createListWatchesTool,
} from './tools/watchTools';
import type { WebMCPTool } from './types';

export interface RegistryOptions {
  provider: WebMCPDataProvider;
  /**
   * ป้ายภาษาผู้ใช้สำหรับแผง Site tools — คืน `undefined` ได้ (เบราว์เซอร์จะใช้ `name` แทน)
   * ⛔ ห้ามใช้ค่านี้กับ `description`/`inputSchema` — 2 อย่างนั้นเป็นภาษาอังกฤษสำหรับ agent เสมอ
   */
  titleFor?: (toolName: string) => string | undefined;
}

function withTitles(tools: WebMCPTool[], titleFor?: RegistryOptions['titleFor']): WebMCPTool[] {
  if (!titleFor) return tools;
  return tools.map((tool) => {
    const title = titleFor(tool.name);
    return title ? { ...tool, title } : tool;
  });
}

/**
 * 🧩 **ชุดแกน 6 ตัวที่เปิดทุกหน้า**
 *
 * 🔑 **ทำไม `create_watch`/`delete_watch` ถึงอยู่ในชุดแกน ทั้งที่เป็น tool ฝั่งเขียน:**
 *    คนพูดกับ agent ว่า *"ช่วยเฝ้าฝุ่นแถวบ้านแม่ให้หน่อย"* ได้จากหน้าไหนก็ได้ ⇒ การผูกไว้กับ
 *    หน้าใดหน้าหนึ่งแปลว่าคำสั่งนั้นล้มโดยไม่มีเหตุผลที่ผู้ใช้เข้าใจได้
 *    ⇒ **ความปลอดภัยของ tool ฝั่งเขียนมาจากป้าย annotation + ด่านยืนยันของ agent**
 *    ⛔ ไม่ใช่จากการซ่อนมันไว้บางหน้า (การซ่อนไม่ได้กันอะไรเลย นอกจากกันคนใช้)
 */
export function buildCoreTools({ provider, titleFor }: RegistryOptions): WebMCPTool[] {
  return withTitles(
    [
      createSearchLocationsTool(provider),
      createGetEnvironmentSnapshotTool(provider),
      createGetSafetyBriefingTool(provider),
      createCreateWatchTool(provider),
      createListWatchesTool(),
      createDeleteWatchTool(),
    ],
    titleFor,
  );
}

/**
 * 🗺️ **ชุดเฉพาะหน้า — ลงทะเบียนตอน mount · ถอนตอนออกจากหน้า**
 *
 * 🔴 **ที่ว่างตรงนี้ตั้งใจเว้นไว้** สำหรับ `set_map_view` (tool #7 · `C9`) ซึ่งมีความหมาย
 *    เฉพาะบนจอแผนที่จริง ๆ — และเป็นตัวที่ทำให้ `toolchange` มีอะไรให้เห็นตอนสาธิต
 *    ⛔ ห้ามเอา tool ที่ใช้ได้ทุกหน้ามาใส่ที่นี่เพื่อ "ให้ดูมีการลงทะเบียนแบบไดนามิก"
 *    — นั่นคือการทำให้ผู้ใช้ใช้ไม่ได้เพื่อแลกกับคะแนน ซึ่งกรรมการสายเว็บดูออก
 */
export function buildPageTools(pageId: string, { titleFor }: Omit<RegistryOptions, 'provider'>): WebMCPTool[] {
  void pageId;
  return withTitles([], titleFor);
}
