// src/webmcp/challenge/GuideBeacon.tsx
// ────────────────────────────────────────────────────────────────────────────
// 🧭 **ปุ่มที่พาไปถึงคู่มือจริง ๆ + คัดลอกที่อยู่สวิตช์ให้** (เจ้าของสั่ง 31 ส.ค. 2026 ข้อ 2)
//
// 🔴 **สิ่งที่เจ้าของขอคือ «กดแล้วเปิดหน้า หาปุ่มให้» — และนี่คือเส้นที่ทำได้จริงแค่ไหน:**
//    ⛔ **หน้าเว็บเปิด `chrome://flags` ให้ไม่ได้** — Chrome บล็อกการนำทางจากเนื้อหาเว็บ
//      ไปยัง `chrome://` ทุกกรณี (เป็นด่านความปลอดภัยของเบราว์เซอร์ ⛔ ไม่ใช่ข้อจำกัดของเรา)
//      ⇒ ทำปุ่มที่กดแล้วไม่เกิดอะไร = **เสียคะแนน `Execution` มากกว่าไม่มีปุ่ม**
//    ✅ **สิ่งที่ทำได้จริงและช่วยได้จริง 2 อย่าง:**
//       ① พาสายตาไปถึงคู่มือ + ย้าย **โฟกัสของแป้นพิมพ์** ไปด้วย (คนใช้คีย์บอร์ด/ตัวอ่านหน้าจอ
//          ต้องไปถึงเหมือนกัน ⛔ ไม่ใช่แค่เลื่อนภาพให้คนใช้เมาส์)
//       ② **คัดลอกที่อยู่สวิตช์ให้** ⇒ เหลือแค่วางในแถบที่อยู่ ซึ่งเป็นขั้นที่เบราว์เซอร์ยอม
//
// 🪤 **`navigator.clipboard` ใช้ไม่ได้เสมอไป** — ต้องเป็น secure context และผู้ใช้อาจปฏิเสธสิทธิ์
//    ⇒ ล้มเหลวต้อง **บอกให้คัดลอกเอง พร้อมโชว์ข้อความเต็ม** ⛔ ไม่ใช่เงียบแล้วปล่อยให้เดา
//
// 🔴 **ทุก import ต้องเป็น `@/...` ⛔ ห้าม relative** (ด่าน `RELATIVE_IN_SUBSTITUTED`)

'use client';

import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { CHALLENGE_COPY, challengeLangOf } from '@/webmcp/challenge/copy';

/** ⛔ ต้องตรงกับที่เขียนในคู่มือเป๊ะ — 2 ที่ที่ไม่ตรงกันคือคำแนะนำที่พาไปผิดที่ */
export const WEBMCP_FLAG_URL = 'chrome://flags/#enable-webmcp-testing';

/** id ของกล่องคู่มือบนหน้า — ปุ่มนี้เป็นคนพาไป */
export const GUIDE_ANCHOR_ID = 'how-to-try-it';

export default function GuideBeacon() {
  const { lang } = useLanguage();
  const clang = challengeLangOf(lang);
  const copy = CHALLENGE_COPY[clang];

  const [copied, setCopied] = useState<'ok' | 'failed' | null>(null);

  function goToGuide() {
    const target = document.getElementById(GUIDE_ANCHOR_ID);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    /**
     * ♿ **ย้ายโฟกัสด้วย ⛔ ไม่ใช่เลื่อนจออย่างเดียว** — คนที่ใช้แป้นพิมพ์จะกด Tab ต่อจาก
     *    ตำแหน่งเดิม (บนสุดของหน้า) ถ้าไม่ย้ายให้ ⇒ ปุ่มนี้ก็ไม่ได้พาเขาไปถึงไหนเลย
     * 🔑 `preventScroll` เพราะเราจัดการการเลื่อนเองแล้วด้วยแบบนุ่มนวล
     */
    target.focus({ preventScroll: true });
  }

  async function copyFlag() {
    try {
      await navigator.clipboard.writeText(WEBMCP_FLAG_URL);
      setCopied('ok');
    } catch {
      setCopied('failed');
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={goToGuide}
        className="rounded-lg px-4 py-2 text-sm font-bold"
        style={{ backgroundColor: 'var(--color-brand-strong)', color: 'var(--color-surface, #fff)' }}
      >
        {copy.live.guideCta}
      </button>

      <button
        type="button"
        onClick={() => void copyFlag()}
        className="rounded-lg border border-line px-4 py-2 text-sm font-bold text-ink"
      >
        {copied === 'ok' ? copy.live.flagCopied : copy.live.copyFlag}
      </button>

      {/*
        🪤 คัดลอกไม่สำเร็จ ⇒ โชว์ข้อความเต็มให้ลากคัดลอกเอง
           ⛔ ห้ามเงียบ — ผู้ใช้จะนึกว่ากดแล้วได้ แล้วไปวางของว่างในแถบที่อยู่
      */}
      {copied === 'failed' && (
        <p className="text-xs text-muted">
          {copy.live.flagCopyFailed} <code>{WEBMCP_FLAG_URL}</code>
        </p>
      )}
    </div>
  );
}
