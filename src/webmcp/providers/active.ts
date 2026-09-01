// src/webmcp/challenge/activeProvider.ts
// ────────────────────────────────────────────────────────────────────────────
// 🔀 **จุดสลับ provider ฉบับตัวส่งแข่ง** — ตัวถ่ายสำเนาเอาไฟล์นี้ไปทับ `providers/active.ts`
//
// ⛔ ไฟล์นี้ **ไม่ถูกใช้ในแอปจริง** — มันมีอยู่เพื่อให้ repo สาธารณะได้ `demoProvider`
//    โดยที่โค้ด tool และ runtime ไม่ต้องเปลี่ยนแม้แต่บรรทัดเดียว (มติ D-6)
//
// 🔑 ผลข้างเคียงที่ตั้งใจ: **ตัวส่งแข่งจะไม่มีโค้ดที่ชี้ไปยัง backend ของเราติดไปเลย**
//    เพราะ `realProvider` ไม่เคยถูก import ในราง 2
//
// 🔴 **ทุก import ในไฟล์นี้ต้องเป็น `@/...` ⛔ ห้าม relative** (`./` หรือ `../`)
//    เพราะตัวถ่ายสำเนา **ย้ายไฟล์นี้ไปอยู่คนละที่** ใน repo สาธารณะ ⇒ path แบบ relative
//    จะชี้ไปที่ที่ไม่มีอะไรอยู่ · `@/` ผูกกับรากของ `src/` ⇒ **ถูกต้องทั้ง 2 ตำแหน่ง**
//    🔬 เจอจริง 29 ส.ค. 2026: ก่อนแก้ repo ที่ push ไปแล้ว `npm run build` **ไม่ผ่าน**
//       (6 specifier หาไม่เจอ) และไม่มีด่านไหนจับได้ เพราะทุกด่านตรวจ *รายชื่อไฟล์* ไม่ใช่ *ของที่รันได้*
//    ⇒ มีด่านกันแล้วที่ `scripts/webmcp-export.mjs` (ค้นคำว่า RELATIVE_IN_SUBSTITUTED)

import { createDemoProvider } from '@/webmcp/providers/demoProvider';
import type { WebMCPDataProvider } from '@/webmcp/providers/types';

export function createActiveProvider(): WebMCPDataProvider {
  return createDemoProvider();
}
