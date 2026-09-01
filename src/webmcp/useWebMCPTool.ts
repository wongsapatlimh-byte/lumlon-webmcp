// src/webmcp/useWebMCPTool.ts
// ────────────────────────────────────────────────────────────────────────────
// 🪝 **ลงทะเบียน tool ตามหน้าที่เปิดอยู่ · ถอนเมื่อออกจากหน้า** (`B3` ของ scope)
//
// 🔴 **การลงทะเบียนแบบไดนามิกคือของที่ให้คะแนน "WebMCP Leverage" โดยตรง** — เอกสาร Chrome
//    ยกเป็น best practice เอง และเป็นสิ่งที่แยกเว็บที่ *ออกแบบมาเพื่อ agent* ออกจากเว็บที่
//    *แปะ API ไว้เฉย ๆ*: agent ที่อยู่หน้าแผนที่ควรเห็น `set_map_view` ส่วนคนที่อยู่หน้าแรกไม่ควรเห็น
//    (เมนูสั้นลง = เลือกถูกขึ้น — เหตุผลเดียวกับที่ทะเบียนบอกว่าจำนวน tool คือต้นทุน)
//
// 🪤 **ท่าถอนที่สเปกกำหนดคือ `AbortSignal` ⛔ ไม่ใช่ `unregisterTool`** ⇒ 1 `AbortController`
//    ต่อการ mount 1 ครั้ง แล้ว `abort()` ตอน cleanup · **ห้ามใช้ controller เดียวข้าม effect**
//    เพราะ React 18+ ใน dev รัน effect 2 รอบ (mount → unmount → mount) ⇒ controller ที่ถูกใช้ซ้ำ
//    จะอยู่ในสถานะ aborted ตั้งแต่รอบสอง แล้ว tool จะ **ไม่โผล่เลย** โดยไม่มี error ให้เห็น

'use client';

import { useEffect, useState } from 'react';
import { findModelContextHost, type HostKind } from './host';
import type { WebMCPTool } from './types';

export interface RegistrationState {
  /** เจอ API ที่ไหน — `none` = เบราว์เซอร์นี้ยังไม่รองรับ (จอต้องแสดงแบนเนอร์วิธีเปิด) */
  hostKind: HostKind;
  /** จำนวน tool ที่ลงทะเบียนสำเร็จจริง ⛔ ไม่ใช่จำนวนที่ส่งเข้าไป */
  registered: number;
  /** ชื่อ tool ที่ลงทะเบียนไม่สำเร็จ พร้อมเหตุผล — โผล่ใน console เพื่อไล่ปัญหาตอนทดสอบกับ agent จริง */
  failures: Array<{ tool: string; message: string }>;
}

const IDLE: RegistrationState = { hostKind: 'none', registered: 0, failures: [] };

/**
 * ลงทะเบียนชุด tool ที่ส่งเข้ามา
 *
 * ⚠️ **`tools` ต้องมีตัวตนคงที่ระหว่างการ render** (สร้างด้วย `useMemo` ที่ฝั่งผู้เรียก)
 *    ไม่งั้น effect จะถอน-ลงทะเบียนใหม่ทุกครั้งที่ re-render ⇒ แผง Site tools กะพริบ
 *    และ `toolchange` ยิงรัวจนฝั่ง agent เห็นเมนูไม่นิ่ง
 */
export function useWebMCPTools(tools: WebMCPTool[], enabled: boolean): RegistrationState {
  const [state, setState] = useState<RegistrationState>(IDLE);

  useEffect(() => {
    if (!enabled) {
      setState(IDLE);
      return;
    }

    const { host, kind } = findModelContextHost();
    if (!host) {
      setState({ hostKind: 'none', registered: 0, failures: [] });
      return;
    }

    const controller = new AbortController();
    const failures: Array<{ tool: string; message: string }> = [];
    let registered = 0;

    for (const tool of tools) {
      try {
        host.registerTool(
          {
            name: tool.name,
            title: tool.title,
            description: tool.description,
            inputSchema: tool.inputSchema,
            annotations: tool.annotations,
            execute: tool.execute,
          },
          { signal: controller.signal },
        );
        registered += 1;
      } catch (error) {
        /**
         * 🔑 **ตัวหนึ่งพังต้องไม่ล้มทั้งชุด** — สเปกยังเป็น Draft และเบราว์เซอร์แต่ละตัวเข้มไม่เท่ากัน
         *    ⇒ ถ้า `create_watch` ถูกปฏิเสธเพราะ annotation ที่เบราว์เซอร์นี้ยังไม่รู้จัก
         *    tool อ่านอย่างเดียวอีก 5 ตัวต้องยังใช้งานได้ (กรรมการจะได้เห็นของที่เหลือ)
         */
        failures.push({ tool: tool.name, message: error instanceof Error ? error.message : String(error) });
      }
    }

    if (failures.length > 0) console.warn('[webmcp] ลงทะเบียน tool ไม่สำเร็จบางตัว', failures);
    else console.info(`[webmcp] ลงทะเบียน ${registered} tool ผ่าน ${kind}.modelContext`);

    setState({ hostKind: kind, registered, failures });

    return () => {
      controller.abort();
    };
  }, [tools, enabled]);

  return state;
}
