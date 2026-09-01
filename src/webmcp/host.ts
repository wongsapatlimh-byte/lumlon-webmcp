// src/webmcp/host.ts
// ────────────────────────────────────────────────────────────────────────────
// 🔍 **หาที่อยู่ของ WebMCP ในเบราว์เซอร์** (`B3` ส่วน feature-detect)
//
// 🪤 **กับดักอันดับ 1 ของงานนี้:** สเปกยังเป็น **Draft (แก้ล่าสุด 26 ส.ค. 2026)** และเอกสาร
//    2 เจ้าวางของไว้คนละที่จริง ๆ:
//      · คู่มือ ChatGPT → `document.modelContext`   ← **สนามที่กรรมการใช้ตัดสิน**
//      · บทความ Netlify → `navigator.modelContext`
//    ⇒ ตรวจที่เดียวแล้วไม่เจอ เราจะสรุปผิดว่า *"เบราว์เซอร์ไม่รองรับ"* ทั้งที่รองรับอยู่
//    ⇒ ⛔ ห้ามลบขาใดขาหนึ่งออกจนกว่าสเปกจะ Candidate Recommendation
//
// 🔑 **ลำดับความสำคัญ: `document` มาก่อน** — เมื่อเจอทั้งคู่ให้ยึดของ ChatGPT
//    เพราะนั่นคือสนามที่ผลงานถูกตัดสินจริง (แผน §8 ความเสี่ยงข้อ 1)

import type { ModelContextHost } from './types';

export type HostKind = 'document' | 'navigator' | 'none';

export interface HostLookup {
  host: ModelContextHost | null;
  kind: HostKind;
}

function usable(candidate: unknown): candidate is ModelContextHost {
  if (!candidate || typeof candidate !== 'object') return false;
  return typeof (candidate as { registerTool?: unknown }).registerTool === 'function';
}

/**
 * หา host ที่ใช้ได้จริง
 *
 * ⚠️ เรียกได้ทั้งฝั่ง server (SSR) — คืน `none` โดยไม่ระเบิด เพราะ `document`/`navigator`
 *    ไม่มีอยู่จริงตอน render บนเซิร์ฟเวอร์ ⇒ อย่าใช้ `typeof window === 'undefined'` เป็นด่านเดียว
 *    (มีสภาพแวดล้อมที่มี `window` แต่ไม่มี `document` เช่น worker บางแบบ)
 */
export function findModelContextHost(): HostLookup {
  if (typeof document !== 'undefined') {
    const fromDocument = (document as unknown as { modelContext?: unknown }).modelContext;
    if (usable(fromDocument)) return { host: fromDocument, kind: 'document' };
  }
  if (typeof navigator !== 'undefined') {
    const fromNavigator = (navigator as unknown as { modelContext?: unknown }).modelContext;
    if (usable(fromNavigator)) return { host: fromNavigator, kind: 'navigator' };
  }
  return { host: null, kind: 'none' };
}

/** เบราว์เซอร์นี้พร้อมรับ tool ไหม — ใช้ตัดสินว่าจะโชว์แบนเนอร์ "วิธีเปิด" หรือไม่ (`D2` ของ scope) */
export function isWebMCPSupported(): boolean {
  return findModelContextHost().kind !== 'none';
}

/**
 * 🔒 **WebMCP ทำงานเฉพาะบริบทที่ปลอดภัย (HTTPS/localhost)**
 *
 * แยกจาก `isWebMCPSupported` โดยตั้งใจ: 2 กรณีนี้ต้องบอกผู้ใช้คนละประโยค —
 * *"เบราว์เซอร์ยังไม่รองรับ"* กับ *"หน้านี้ไม่ได้เปิดผ่าน HTTPS"* แก้คนละวิธีกันคนละโลก
 */
export function isSecureEnough(): boolean {
  if (typeof window === 'undefined') return false;
  return window.isSecureContext === true;
}
