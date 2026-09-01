import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  /**
   * 🔴 บังคับ workspace root ให้เป็นโฟลเดอร์แอปนี้ (19 ส.ค. 2026)
   * ────────────────────────────────────────────────────────────────────────
   * โฟลเดอร์แม่ `D:\AirZpot APP Code\` มี `package.json` + `package-lock.json` ของตัวเอง
   * (มีไว้ลง `@openai/codex-sdk` ของทีมเท่านั้น ไม่ใช่ workspace) ⇒ Next เห็น lockfile 2 ตัว
   * แล้ว **เดา root เป็นโฟลเดอร์แม่** และเตือนไว้ทุกครั้งที่ build
   *
   * ผลที่ตามมาไม่ใช่แค่คำเตือน: ตอน `next dev` ตัว client ไปขอ `/_next/webpack-hmr`
   * (เส้นของ webpack) ทั้งที่เซิร์ฟเวอร์เป็น Turbopack ⇒ handshake ล้มซ้ำ ๆ และ
   * **หน้าเว็บไม่ hydrate เลยสักหน้า** (เจอ 19 ส.ค. 2026 ตอนทำเฟส P0.5 เลนมาสคอต:
   * หน้า `/mascot` ค้างที่ 'กำลังตรวจสอบสิทธิ์…' เพราะ effect ฝั่ง client ไม่เคยทำงาน
   * ขณะที่ production build ทำงานปกติทุกอย่าง ⇒ อาการอยู่ที่ dev server ไม่ใช่ที่โค้ดหน้า)
   */
  turbopack: {
    root: path.resolve(__dirname),
  },
  /**
   * 🤖 29 ส.ค. 2026 (เลน W) — **ค่าตั้งต้นของสวิตช์ WebMCP ต้องมีตัวตนตอน build เสมอ**
   * ────────────────────────────────────────────────────────────────────────
   * 🔬 **วัดของจริงแล้ว ไม่ใช่ทฤษฎี:** มติ D-8 บอกว่า "ปิดสวิตช์ = 0 ไบต์ใน bundle"
   *    แต่ตัวรวมโค้ดจะตัด `import()` ทิ้งได้ **ก็ต่อเมื่อพิสูจน์ได้ตอนอ่านโค้ดว่ากิ่งนั้นตาย**
   *    ⇒ ตัวแปร `NEXT_PUBLIC_*` ที่ **ไม่ได้ตั้งค่าไว้เลย** จะไม่ถูกแทนที่ด้วยค่าคงที่
   *      ⇒ พิสูจน์ไม่ได้ ⇒ **chunk ของโมดูลยังถูกสร้าง** (build 29 ส.ค.: เจอ 1 chunk ทั้งที่สวิตช์ปิด)
   * ⇒ ประกาศค่าตั้งต้น `'0'` ที่นี่ ทำให้ทุก build มีค่าคงที่ให้ตัวรวมโค้ดพับนิพจน์ได้เสมอ
   * ⛔ ห้ามลบบรรทัดนี้เพราะ "ดูไม่จำเป็น" — ลบเมื่อไร โค้ดโมดูลกลับเข้า bundle ของทุกหน้าเงียบ ๆ
   * 📌 ตั้งค่าจริงที่ Vercel/`.env.local` ยังชนะค่าตั้งต้นนี้เสมอ (อ่านจาก `process.env` ก่อน)
   */
  env: {
    NEXT_PUBLIC_WEBMCP_ENABLED: process.env.NEXT_PUBLIC_WEBMCP_ENABLED ?? "0",
  },
  /* config options here */
  images: {
    // S2 (sprint PDPA foundation): ถอน `ui-avatars.com` แล้ว — โค้ดเลิกยิงชื่อผู้ใช้ออกไปตั้งแต่ VS-01
    // (ดู src/lib/avatar.ts + docs/pdpa/12 §4) · โดเมนใหม่ใด ๆ ที่เพิ่มที่นี่ต้องผ่านด่าน
    // src/__tests__/trackingSweep.test.ts (P-11) — แก้ allowlist ในเทสพร้อมขึ้นทะเบียน docs/pdpa/12 ก่อน
    remotePatterns: [
      // T-10 (7 ส.ค. 2026): รูปโปรไฟล์ที่ผู้ใช้อัปโหลดเองถูกเก็บบน Google Cloud Storage
      // แล้วเสิร์ฟเป็น URL สาธารณะรูป `https://storage.googleapis.com/<bucket>/<object>?v=...`
      // (ดู `storefrontUser.controller.js:206` ฝั่ง backend)
      // ไม่ประกาศไว้ที่นี่ = next/image **บล็อกทิ้งทั้งหมด** ⇒ ผู้ใช้ที่อัปรูปเองจะไม่มีรูปโปรไฟล์
      // ครอบทั้ง dev (`airzpot-assets`) และ prod (`lumlon-assets`) เพราะ hostname เดียวกัน
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
    ],
  },
};

export default nextConfig;