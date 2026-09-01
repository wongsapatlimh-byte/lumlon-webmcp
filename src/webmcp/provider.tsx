// src/webmcp/provider.tsx
// ────────────────────────────────────────────────────────────────────────────
// 🔌 **ทางเข้าเดียวของโมดูล WebMCP** — วางไว้ใน layout แล้วจบ
//
// 🔴 **สวิตช์ปิด = ไม่มีโค้ดของโมดูลนี้ถูกดาวน์โหลดเลย** (มติ D-8)
//    กลไก: `WEBMCP_ENABLED` ถูกแทนค่าตอน build (Next แทน `process.env.NEXT_PUBLIC_*` เป็นค่าคงที่)
//    ⇒ เมื่อปิด นิพจน์กลายเป็น `false ? dynamic(() => import('./runtime')) : null`
//    ⇒ ตัวย่อโค้ดตัดกิ่งที่ตายทิ้ง ⇒ **`import()` หายไป ⇒ ไม่มี chunk ของ runtime ในผลลัพธ์ build**
//    ⛔ ห้ามย้าย `dynamic(...)` ไปไว้นอกเงื่อนไข หรือเปลี่ยนเป็นเช็คตอน render — จะได้ chunk กลับมาทันที
//
// 🪤 **`ssr: false` จำเป็น** — `registerTool` อยู่บน `document`/`navigator` ซึ่งไม่มีบนเซิร์ฟเวอร์
//    และการ render ฝั่งเซิร์ฟเวอร์ของโมดูลนี้ไม่ได้ให้ประโยชน์อะไรเลย (ไม่มีอะไรให้ผู้ใช้เห็น)

'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

/**
 * 🔴 **นิพจน์นี้ต้องอยู่ "ตรง ๆ" ในเงื่อนไข ⛔ ห้ามแยกไปเก็บในตัวแปรก่อน**
 *
 * 🔬 **วัดของจริง 29 ส.ค. 2026:** เขียนเป็น `const ENABLED = ...` แล้วใช้ `ENABLED ? ... : null`
 *    ⇒ ตัวรวมโค้ด **ยังสร้าง chunk ของ `runtime` อยู่ดี** แม้สวิตช์ปิด (เจอตอนสแกน `.next/static`)
 *    เพราะมันพับนิพจน์ข้ามการประกาศตัวแปรให้ไม่ได้ ⇒ พิสูจน์ไม่ได้ว่ากิ่งตาย ⇒ เก็บ `import()` ไว้
 * ⇒ เขียนคาไว้ในเงื่อนไขแบบนี้ + ค่าตั้งต้น `'0'` ใน `next.config.ts` ⇒ **พับได้จริง ตรวจแล้ว**
 *
 * 🔑 ค่าตั้งต้นของพฤติกรรม: **เปิดตอน dev · ปิดตอน build จริงเว้นแต่สั่งเปิด**
 *    ① ทีม/เจ้าของเห็นของทำงานทันทีที่ `npm run dev` โดยไม่ต้องแตะ `.env.local`
 *       (ไฟล์ความลับที่กติกาทีมห้าม AI อ่าน/แก้ — `FILE_SAFETY` ข้อ 3)
 *    ② build จริง **opt-in เสมอ** ⇒ โมดูลไม่มีทางหลุดขึ้นเว็บผลิตภัณฑ์โดยไม่มีใครสั่ง
 */
const WebMCPRuntime =
  process.env.NEXT_PUBLIC_WEBMCP_ENABLED === '1' ||
  process.env.NEXT_PUBLIC_WEBMCP_ENABLED === 'true' ||
  (process.env.NODE_ENV !== 'production' &&
    process.env.NEXT_PUBLIC_WEBMCP_ENABLED !== '0' &&
    process.env.NEXT_PUBLIC_WEBMCP_ENABLED !== 'false')
    ? dynamic(() => import('./runtime'), { ssr: false })
    : null;

export interface WebMCPProviderProps {
  children?: ReactNode;
}

/**
 * ห่อ subtree ที่ต้องการให้ agent เห็นเครื่องมือ
 *
 * ⚠️ **ปิดสวิตช์แล้วต้องคืน `children` ตรง ๆ** ⛔ ห้ามห่อ `<div>`/fragment เพิ่มชั้น —
 *    layout ของแอปจริงมีกฎเรื่องความสูง/ลำดับชั้นอยู่ ⇒ ชั้นที่โผล่มาเฉพาะตอนสวิตช์ปิด
 *    คือความต่างที่จะไปโผล่เป็นบั๊ก CSS ที่ไล่ไม่เจอ
 */
export function WebMCPProvider({ children }: WebMCPProviderProps) {
  if (!WebMCPRuntime) return <>{children}</>;
  return <WebMCPRuntime>{children}</WebMCPRuntime>;
}

/** สวิตช์ ณ เวลา build — ให้จอถามได้ว่าควรแสดงแบนเนอร์ "วิธีเปิด WebMCP" ไหม */
export function isWebMCPEnabled(): boolean {
  /** อ่านจากผลลัพธ์เดียวกับที่ layout ใช้จริง ⛔ ไม่คำนวณเงื่อนไขซ้ำ (ก๊อปที่ 2 จะเพี้ยนวันที่กติกาเปลี่ยน) */
  return WebMCPRuntime !== null;
}
