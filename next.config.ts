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