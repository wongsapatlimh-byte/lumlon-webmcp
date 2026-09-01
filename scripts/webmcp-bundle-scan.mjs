#!/usr/bin/env node
// scripts/webmcp-bundle-scan.mjs
// ────────────────────────────────────────────────────────────────────────────
// 🔬 **ด่านพิสูจน์ว่า "ปิดสวิตช์ = ไม่มีโค้ด WebMCP ในผลลัพธ์ build"** (มติ D-8 · DoD ของ `B3`)
//
// 🔴 **ทำไมต้องเป็นสคริปต์ ไม่ใช่การมองด้วยตาครั้งเดียว:** ตอนแรกทีมเขียนเงื่อนไขสวิตช์เป็น
//    `const ENABLED = ...` แล้วใช้ `ENABLED ? dynamic(...) : null` ซึ่ง *ดูเหมือนถูก* —
//    แต่ตัวรวมโค้ดพับนิพจน์ข้ามการประกาศตัวแปรไม่ได้ ⇒ **chunk ยังถูกสร้างทั้งที่สวิตช์ปิด**
//    (วัดจริง 29 ส.ค. 2026 เจอ 1 chunk) ⇒ ความถูกต้องข้อนี้ **มองด้วยตาไม่เห็น ต้องวัด**
//    และมันพังกลับได้เงียบ ๆ ทุกครั้งที่มีคนไป "จัดระเบียบ" โค้ดตรงนั้น
//
// วิธีใช้:
//   1) build โดยไม่ตั้ง `NEXT_PUBLIC_WEBMCP_ENABLED` (หรือตั้งเป็น `0`)
//   2) `node scripts/webmcp-bundle-scan.mjs`
//   ⇒ ออก exit code 1 พร้อมรายชื่อไฟล์ ถ้าเจอร่องรอยของโมดูล

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * 🔑 คำที่ใช้เป็น "ลายนิ้วมือ" ต้องเป็นของที่ **มีอยู่เฉพาะในโมดูลนี้**
 *    ⛔ ห้ามใช้คำกว้างอย่าง `webmcp` เฉย ๆ เพราะคอมเมนต์ในไฟล์อื่นก็มีคำนี้ได้ ⇒ แดงหลอก
 */
const FINGERPRINTS = [
  'get_safety_briefing',
  'get_environment_snapshot',
  'lumlon.webmcp.watches',
];

/** ⛔ `.next/dev` คือของเหลือจาก dev server ไม่ใช่ผลลัพธ์ที่ deploy — ข้ามโดยตั้งใจ */
const ROOTS = ['.next/static', '.next/server'];

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

/**
 * 🚦 **ด่านชั้นแรก: พิสูจน์ว่าตัวกวาด "กวาดเจอของจริง" ก่อนจะเชื่อคำว่า "ไม่พบ"**
 *
 * 🔬 **รูที่เลน A ชี้ให้เห็น (29 ส.ค. 2026) และมันมีอยู่จริงในไฟล์นี้:**
 *    `walk()` คืนรายการว่างเมื่ออ่านโฟลเดอร์ไม่ได้ ⇒ **ยังไม่ได้ build เลยก็ขึ้น ✅**
 *    ⇒ ด่านออกใบรับรองให้ของที่ไม่เคยตรวจ · และมันจะเขียว **ถาวร** วันที่โครงสร้าง `.next` เปลี่ยนชื่อ
 * 🔑 กฎที่ได้: **ตัวกวาดต้องยืนยันจำนวนที่กวาดเจอ** ⛔ "ไม่พบ" ที่ไม่รู้ว่ากวาดกี่ไฟล์ ไม่ใช่หลักฐาน
 *    (ตระกูลเดียวกับ [[L-122]] — ตัวตรวจที่ไม่เจอของก็ขึ้น PASS เหมือนกัน)
 */
const MIN_FILES_EXPECTED = 200;

const missingRoots = ROOTS.filter((root) => !existsSync(root));
if (missingRoots.length) {
  console.error(`❌ ยังไม่ได้ build — ไม่มี ${missingRoots.join(' และ ')}`);
  console.error('   รัน `npm run build` ก่อน แล้วค่อยสแกน ⛔ ด่านนี้จะไม่ขึ้นเขียวให้กับของที่ยังไม่มีตัวตน');
  process.exit(1);
}

const hits = [];
let scanned = 0;
let readable = 0;

for (const root of ROOTS) {
  for (const file of walk(root)) {
    scanned += 1;
    let text;
    try {
      text = readFileSync(file, 'utf8');
    } catch {
      continue; // ไฟล์ไบนารี (ฟอนต์/รูป) — ไม่ใช่ที่ที่โค้ดจะไปซ่อน
    }
    readable += 1;
    const found = FINGERPRINTS.filter((needle) => text.includes(needle));
    if (found.length) hits.push({ file, found });
  }
}

if (scanned < MIN_FILES_EXPECTED) {
  console.error(`❌ กวาดได้แค่ ${scanned} ไฟล์ (คาดอย่างน้อย ${MIN_FILES_EXPECTED}) — ผลลัพธ์ build ไม่สมบูรณ์`);
  console.error('   ⛔ ไม่ขึ้นเขียวให้ เพราะ "ไม่พบ" จากการกวาดที่ไม่ทั่ว ไม่ใช่หลักฐานว่าไม่มี');
  process.exit(1);
}

if (hits.length === 0) {
  console.log(
    `✅ webmcp bundle scan — กวาด ${scanned} ไฟล์ (อ่านเป็นข้อความได้ ${readable}) ` +
      'ใน .next/static และ .next/server แล้วไม่พบร่องรอยโมดูล WebMCP (สวิตช์ปิด)',
  );
  process.exit(0);
}

console.error('❌ webmcp bundle scan — เจอโค้ดโมดูลทั้งที่สวิตช์ปิด (มติ D-8 พัง):');
for (const hit of hits) console.error(`   · ${hit.file} → ${hit.found.join(', ')}`);
console.error('   แก้: เงื่อนไขสวิตช์ใน src/webmcp/provider.tsx ต้องเขียนคาไว้ในเงื่อนไขตรง ๆ');
console.error('        และ next.config.ts ต้องมีค่าตั้งต้น NEXT_PUBLIC_WEBMCP_ENABLED = "0"');
process.exit(1);
