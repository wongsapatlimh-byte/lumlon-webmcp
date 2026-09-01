// src/webmcp/challenge/LanguageToggle.tsx
// ────────────────────────────────────────────────────────────────────────────
// 🌐 **ปุ่มสลับภาษาของหน้าตัวส่งแข่ง** (เจ้าของสั่งสด 29 ส.ค. 2026 ค่ำ)
//
// 🔴 **ทำไมปุ่มนี้ต้องเขียนป้ายด้วยภาษาของตัวเอง** (`English` / `ไทย` ⛔ ไม่ใช่ `EN` / `TH`)
//    คนที่ต้องหาปุ่มนี้เจอ คือคนที่ **อ่านภาษาที่หน้ากำลังแสดงอยู่ไม่ออก**
//    ⇒ ป้ายที่เขียนด้วยภาษาที่เขาอ่านไม่ออก = ปุ่มที่มีอยู่แต่หาไม่เจอ
//
// 🔴 **ปุ่มนี้ ⛔ ไม่ได้ตั้งค่าตั้งต้น** — ค่าตั้งต้นเป็น `EN` และถูกกำหนดที่ `layout.tsx`
//    (`initialLang="EN"`) · ปุ่มนี้ทำแค่ *เปลี่ยนตามที่ผู้ใช้กด* ซึ่ง `LanguageProvider`
//    จะจำใส่ `localStorage` ให้เอง ⇒ ผู้ใช้ที่เคยเลือกไทย กลับมาก็ยังได้ไทย
//    ⚠️ นั่นแปลว่า **เครื่องที่เคยกดไทยไว้จะเปิดมาเป็นไทย** — ตอนถ่ายวิดีโอ/ให้กรรมการดู
//       ต้องล้าง `localStorage` ก่อน (มีเขียนไว้แล้วใน storyboard §1)
//
// 🔴 **ทุก import ต้องเป็น `@/...` ⛔ ห้าม relative** — ไฟล์ที่ import ตัวนี้ (`page.tsx`)
//    ถูกตัวถ่ายสำเนาย้ายไปอยู่คนละที่ใน repo สาธารณะ (ด่าน `RELATIVE_IN_SUBSTITUTED`)

'use client';

import { useLanguage } from '@/context/LanguageContext';
import { CHALLENGE_COPY, challengeLangOf, type ChallengeLang } from '@/webmcp/challenge/copy';

const OPTIONS: readonly ChallengeLang[] = ['EN', 'TH'];

export default function LanguageToggle() {
  const { lang, setLang } = useLanguage();
  const active = challengeLangOf(lang);

  return (
    <div
      className="flex shrink-0 items-center gap-1 rounded-full border border-line p-1"
      role="group"
      /**
       * 🔤 ป้ายกำกับกลุ่มเขียน 2 ภาษาคู่กัน — ตัวอ่านหน้าจอของผู้ใช้ภาษาไหนก็เจอคำที่ตัวเองรู้จัก
       *    ⛔ ไม่ผูกกับภาษาที่กำลังแสดง เพราะปุ่มนี้มีไว้สำหรับคนที่อยาก *ออก* จากภาษานั้น
       */
      aria-label="Language / ภาษา"
    >
      {OPTIONS.map((option) => {
        const isActive = option === active;
        return (
          <button
            key={option}
            type="button"
            onClick={() => setLang(option)}
            aria-pressed={isActive}
            className={
              'rounded-full px-3 py-1 text-xs font-bold transition ' +
              (isActive ? 'bg-ink text-paper' : 'text-muted hover:text-ink')
            }
          >
            {CHALLENGE_COPY[option].switchLabel}
          </button>
        );
      })}
    </div>
  );
}
