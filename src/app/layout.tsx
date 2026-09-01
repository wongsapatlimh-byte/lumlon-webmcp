// src/webmcp/challenge/layout.tsx
// ────────────────────────────────────────────────────────────────────────────
// 🧱 **layout ของตัวส่งแข่ง** — เหมือนของจริงทุกอย่าง **ยกเว้นสิ่งที่ตัวแข่งไม่ควรมี**
//
// 🔴 **สิ่งที่หายไปจาก layout จริง และเหตุผลรายข้อ:**
//   · `AuthProvider` — ตัวแข่งเป็น **guest ล้วน** (R6: กรรมการต่างชาติต้องเข้าได้ทันที)
//     🔑 และมันคือ**ต้นตอทางเทคนิค**ที่ทำให้ตัวถ่ายสำเนาแดง: `AuthContext` ลาก
//        `socialOauth` + `tierDisplay` เข้ามา ซึ่งเป็นของที่ห้ามออกจากเครื่อง
//   · `ConsentReconsentGuard` — ผูกกับบัญชีผู้ใช้ที่ตัวแข่งไม่มี
//   · `CookieNoticeBar` — ตัวแข่งไม่เก็บคุกกี้ใด ๆ ⇒ แถบที่ประกาศสิ่งที่ไม่ได้ทำ = ข้อความที่ผิด
//
// ✅ **สิ่งที่ต้องเหลือไว้:** `LanguageProvider` (โมดูล webmcp ใช้ดึงป้ายภาษาผู้ใช้ — มติ D-10)
//    และ `WebMCPProvider` ซึ่งเป็นเหตุผลทั้งหมดที่เว็บนี้มีอยู่
//
// ⛔ ไฟล์นี้ไม่มี route ในแอปจริง — ตัวถ่ายสำเนาเป็นคนสลับมันเข้าไปแทน `src/app/layout.tsx`
//
// 🔴 **ทุก import ในไฟล์นี้ต้องเป็น `@/...` ⛔ ห้าม relative** (`./` หรือ `../`)
//    เพราะตัวถ่ายสำเนา **ย้ายไฟล์นี้ไปอยู่คนละที่** ใน repo สาธารณะ ⇒ path แบบ relative
//    จะชี้ไปที่ที่ไม่มีอะไรอยู่ · `@/` ผูกกับรากของ `src/` ⇒ **ถูกต้องทั้ง 2 ตำแหน่ง**
//    🔬 เจอจริง 29 ส.ค. 2026: ก่อนแก้ repo ที่ push ไปแล้ว `npm run build` **ไม่ผ่าน**
//       (6 specifier หาไม่เจอ) และไม่มีด่านไหนจับได้ เพราะทุกด่านตรวจ *รายชื่อไฟล์* ไม่ใช่ *ของที่รันได้*
//    ⇒ มีด่านกันแล้วที่ `scripts/webmcp-export.mjs` (ค้นคำว่า RELATIVE_IN_SUBSTITUTED)

import type { Metadata, Viewport } from 'next';
import { Inter, IBM_Plex_Sans_Thai, Fraunces } from 'next/font/google';
import '@/app/globals.css';
import { LanguageProvider } from '@/context/LanguageContext';
import { WebMCPProvider } from '@/webmcp/provider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-thai',
  display: 'swap',
});
const fraunces = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'LUMLON — agent-ready air & hazard companion for Thailand',
  description:
    'A WebMCP demo: agents read live air quality and official hazard alerts for all 77 Thai provinces, and can set watches that warn when a reading crosses a threshold.',
  /**
   * 🔴 ตัวแข่ง **ให้เครื่องค้นหาเก็บได้** ต่างจากเว็บ dev ของทีม
   *    (ผลงานที่ส่งประกวดควรถูกค้นเจอ — และมันไม่มีข้อมูลผู้ใช้ให้รั่วอยู่แล้ว)
   */
  icons: {
    icon: [
      { url: '/icons/favicon.svg', type: 'image/svg+xml' },
      { url: '/icons/favicon.ico', sizes: '16x16 32x32 48x48' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F6FAF9' },
    { media: '(prefers-color-scheme: dark)', color: '#0F2740' },
  ],
};

export default function ChallengeRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${ibmPlexSansThai.variable} ${fraunces.variable} font-sans antialiased`}>
        {/*
          🌐 **EN คือค่าตั้งต้น โดยตั้งใจ** — ผู้อ่านคนแรกของหน้านี้คือกรรมการต่างชาติ (R6)
             · แอปจริงยังเริ่มที่ TH เหมือนเดิม (พรอพนี้มีผลเฉพาะตัวส่งแข่ง)
          ⛔ ห้ามถอดพรอพนี้ออก: ถอดเมื่อไร แถบที่บอกวิธีเปิด WebMCP กลับไปเป็นภาษาไทย
             ⇒ ด่าน `D2` (graceful degradation) มีแบนเนอร์อยู่จริง แต่คนที่ต้องอ่านอ่านไม่ออก = ไม่ได้ทำงาน
          🆕 **29 ส.ค. 2026 (เจ้าของสั่งสด): ผู้ใช้สลับเป็นไทยเองได้แล้ว** ผ่านปุ่มบนหน้า
             (`@/webmcp/challenge/LanguageToggle`) และ `LanguageProvider` จำค่าที่เลือกใส่ `localStorage`
             🔑 **นี่คือ "ค่าตั้งต้น" ⛔ ไม่ใช่ "ภาษาเดียวที่มี"** — สิ่งที่ต้องคงไว้คือ *คนที่เปิดครั้งแรก
                ต้องได้ EN* ⛔ ไม่ใช่ *ห้ามมีไทย*
             ⚠️ เครื่องที่เคยกดไทยไว้จะเปิดมาเป็นไทย ⇒ ก่อนถ่ายวิดีโอ/ส่งให้กรรมการ **ล้าง `localStorage` ก่อน**
        */}
        <LanguageProvider initialLang="EN">
          <WebMCPProvider>{children}</WebMCPProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
