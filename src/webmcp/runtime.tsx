// src/webmcp/runtime.tsx
// ────────────────────────────────────────────────────────────────────────────
// ⚙️ **ตัวจริงของโมดูล — ถูกโหลดเฉพาะเมื่อสวิตช์เปิด** (`B3` ของ scope · มติ D-8)
//
// 🔴 **ทำไมต้องแยกไฟล์นี้ออกจาก `provider.tsx`:** ทุก `import` ที่นี่ลากของจริงเข้ามาหมด
//    (ทะเบียน → tools → ชั้น provider → client ของเลน 3 → แถบ UI) ⇒ ถ้าอยู่ไฟล์เดียวกับ
//    ตัวเช็คสวิตช์ โค้ดทั้งก้อนจะติดไปกับ bundle ของทุกหน้า **แม้สวิตช์ปิด**
//    ⇒ ไฟล์นี้ถูกเรียกผ่าน `import()` ในกิ่งที่ตายไปเมื่อสวิตช์ปิด ⇒ ไม่ถูกดาวน์โหลดเลย
//
// ⛔ **ห้ามให้ไฟล์อื่นนอกโมดูล import ไฟล์นี้ตรง ๆ** — ทางเข้าเดียวคือ `provider.tsx`

'use client';

import { useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/locales/translations';
import { createActiveProvider } from './providers/active';
import { buildCoreTools } from './registry';
import AgentBar from './ui/AgentBar';
import { useWebMCPTools } from './useWebMCPTool';
import { startWatchEngine } from './watchEngine';

/**
 * 🌐 **จุดผูก i18n จุดเดียวของโมดูล** (มติ D-10)
 *
 * 🔑 ทะเบียน tool ไม่รู้จัก i18n ของแอปโดยตั้งใจ ⇒ การแปลถูกฉีดเข้ามาที่นี่
 *    ⛔ และแปลเฉพาะ `title` (ป้ายที่ **คนอ่าน** ในแผง Site tools) เท่านั้น —
 *    `description`/`inputSchema` เป็นภาษาอังกฤษเสมอเพราะ **agent** เป็นคนอ่าน
 *    (แปล description เมื่อไร agent จะเลือกเครื่องมือผิดทันทีที่ผู้ใช้เปลี่ยนภาษา)
 */
const TITLE_KEYS: Record<string, string> = {
  search_locations: 'webmcpToolSearchLocations',
  get_environment_snapshot: 'webmcpToolGetEnvironmentSnapshot',
  get_safety_briefing: 'webmcpToolGetSafetyBriefing',
  create_watch: 'webmcpToolCreateWatch',
  list_watches: 'webmcpToolListWatches',
  delete_watch: 'webmcpToolDeleteWatch',
};

export interface WebMCPRuntimeProps {
  children?: ReactNode;
}

export default function WebMCPRuntime({ children }: WebMCPRuntimeProps) {
  const { lang } = useLanguage();

  const titleFor = useCallback(
    (toolName: string) => {
      const key = TITLE_KEYS[toolName];
      if (!key) return undefined;
      const dictionary = translations[lang] as Record<string, string> | undefined;
      /** ไม่มีคำแปล = ไม่ส่ง `title` ⇒ เบราว์เซอร์ใช้ `name` แทน ⛔ ไม่ใช่โชว์ชื่อคีย์ให้ผู้ใช้เห็น */
      return dictionary?.[key];
    },
    [lang],
  );

  /**
   * 🪤 **ต้อง `useMemo` ทั้งคู่** — `useWebMCPTools` ถอน/ลงทะเบียนใหม่ทุกครั้งที่ตัวตนของ `tools`
   *    เปลี่ยน ⇒ สร้างใหม่ทุก render = แผง Site tools กะพริบและ `toolchange` ยิงรัว
   * 🔑 `tools` ผูกกับ `titleFor` ⇒ **เปลี่ยนภาษาแล้วลงทะเบียนใหม่โดยตั้งใจ** (ป้ายต้องตามภาษาผู้ใช้)
   */
  const provider = useMemo(() => createActiveProvider(), []);
  const tools = useMemo(() => buildCoreTools({ provider, titleFor }), [provider, titleFor]);

  const registration = useWebMCPTools(tools, true);

  /**
   * 🔔 **เครื่องประเมินกฎเฝ้าเดินคู่ไปกับการลงทะเบียน tool**
   *
   * 🔑 เดินตลอดแม้ผู้ใช้ไม่ได้เปิดหน้ากฎเฝ้า — เพราะกฎที่ตั้งไว้ต้องถูกตรวจ ไม่ใช่ตรวจเฉพาะ
   *    ตอนที่ผู้ใช้บังเอิญมองมัน · ⛔ แต่ **หยุดสนิทเมื่อ unmount** (ปิดแท็บ/ปิดสวิตช์)
   *    เพราะเราไม่ได้สัญญาว่าจะเตือนตอนปิดเบราว์เซอร์ (ถ้อยคำที่ `watchStore` บังคับไว้)
   */
  useEffect(() => startWatchEngine({ provider }), [provider]);

  return (
    <>
      {children}
      <AgentBar hostKind={registration.hostKind} registered={registration.registered} />
    </>
  );
}
