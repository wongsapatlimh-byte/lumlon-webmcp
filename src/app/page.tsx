// src/webmcp/challenge/page.tsx
// ────────────────────────────────────────────────────────────────────────────
// 🏠 **หน้าแรกของตัวส่งแข่ง** (`C1` — โหมด guest ล้วน)
//
// 🔴 **ทำไมเป็นไฟล์ใหม่ ⛔ ไม่ใช่ไปตัดหน้าแรกของแอปจริง:**
//    หน้าแรกของจริงลาก `AuthContext` → `socialOauth` + `tierDisplay` เข้ามา ซึ่งเป็นของ
//    ที่ห้ามออกจากเครื่อง · การไปตัดของจริงคือการทำให้ผลิตภัณฑ์แย่ลงเพื่อการแข่งขัน
//    ⇒ **ตัวส่งแข่งใช้หน้าของตัวเอง** แล้วตัวถ่ายสำเนาสลับให้ตอน export
//    ⇒ แอปจริงไม่ถูกแตะแม้แต่บรรทัดเดียว และด่าน `webmcp:export` เขียวเอง
//
// 🗣️ **2 ภาษา: EN (ค่าตั้งต้น) + TH (ผู้ใช้กดเอง)** — เจ้าของสั่งสด 29 ส.ค. 2026 ค่ำ
//    🔴 **EN ต้องเป็นค่าตั้งต้นเสมอ** — ผู้อ่านคนแรกคือกรรมการต่างชาติ (`R6`)
//    ⛔ **แทนที่หมายเหตุเดิมของไฟล์นี้ที่เขียนว่า "อังกฤษล้วนโดยตั้งใจ"** — ข้อยกเว้นนั้น
//       ถูกยกเลิกโดยคำสั่งเจ้าของ · ถ้อยคำทั้งหมดอยู่ที่ `@/webmcp/challenge/copy`
//    🔴 **ถ้อยคำไทยต้องแบกคำมั่นครบเท่าอังกฤษทั้ง 7 ข้อ** (มีเทสบังคับทั้งสองภาษา)
//
// 🇹🇭 **ประกาศขอบเขตเป็น "โฟกัส" ไม่ใช่ "ข้อจำกัด"** (มติ D-27) — เกณฑ์ Impact มองหา
//    *ปัญหาจริงของผู้ใช้จริง* ⇒ เจาะประเทศเดียวลึก ๆ น่าเชื่อกว่าอ้างว่าครอบคลุมทั้งโลก
//
// 🔴 **ทุก import ในไฟล์นี้ต้องเป็น `@/...` ⛔ ห้าม relative** (`./` หรือ `../`)
//    เพราะตัวถ่ายสำเนา **ย้ายไฟล์นี้ไปอยู่คนละที่** ใน repo สาธารณะ ⇒ path แบบ relative
//    จะชี้ไปที่ที่ไม่มีอะไรอยู่ · `@/` ผูกกับรากของ `src/` ⇒ **ถูกต้องทั้ง 2 ตำแหน่ง**
//    🔬 เจอจริง 29 ส.ค. 2026: ก่อนแก้ repo ที่ push ไปแล้ว `npm run build` **ไม่ผ่าน**
//       (6 specifier หาไม่เจอ) และไม่มีด่านไหนจับได้ เพราะทุกด่านตรวจ *รายชื่อไฟล์* ไม่ใช่ *ของที่รันได้*
//    ⇒ มีด่านกันแล้วที่ `scripts/webmcp-export.mjs` (ค้นคำว่า RELATIVE_IN_SUBSTITUTED)

'use client';

import { useEffect } from 'react';
import AgentStage from '@/webmcp/challenge/AgentStage';
import GuideBeacon, { GUIDE_ANCHOR_ID } from '@/webmcp/challenge/GuideBeacon';
import HeroStats from '@/webmcp/challenge/HeroStats';
import LiveBoard from '@/webmcp/challenge/LiveBoard';
import LanguageToggle from '@/webmcp/challenge/LanguageToggle';
import { CHALLENGE_COPY, challengeLangOf } from '@/webmcp/challenge/copy';
import { useLanguage } from '@/context/LanguageContext';

export default function ChallengeHome() {
  const { lang } = useLanguage();
  const copy = CHALLENGE_COPY[challengeLangOf(lang)];

  /**
   * 🔤 **`<html lang>` ต้องเดินตามภาษาที่แสดงจริง**
   *    `layout.tsx` เขียน `lang="en"` ไว้ตอนเรนเดอร์ฝั่งเซิร์ฟเวอร์ (ถูกแล้ว — ค่าตั้งต้นคือ EN)
   *    แต่ถ้าผู้ใช้สลับเป็นไทยแล้วป้ายยังบอกว่า `en` ⇒ ตัวอ่านหน้าจอออกเสียงไทยด้วยเสียงอังกฤษ
   *    และเบราว์เซอร์เสนอแปลหน้าที่เป็นภาษาแม่ของผู้ใช้อยู่แล้ว
   * 🔑 แก้ที่ `documentElement` ตรงนี้ ⛔ ไม่ใช่ไปทำ `layout.tsx` ให้เป็น client component
   *    — `layout.tsx` ถือ `metadata`/`viewport` ซึ่งเป็นของฝั่งเซิร์ฟเวอร์ล้วน
   */
  useEffect(() => {
    document.documentElement.lang = copy.htmlLang;
  }, [copy.htmlLang]);

  return (
    <div className="min-h-screen bg-paper">
      {/*
        📐 **ความกว้างหน้า: `max-w-5xl` ⛔ ไม่ใช่ `3xl` เหมือนเดิม** (ขยาย 31 ส.ค. 2026)
           เดิมเป็นคอลัมน์เดียวแคบ ๆ เพราะหน้านี้เคยมีแต่ตัวหนังสือ · ตอนนี้มีแผนที่คู่กับการ์ด
           ⇒ ที่ 3xl แผนที่กับการ์ดจะเบียดกันจนอ่านไม่ออกบนจอโน้ตบุ๊ก
        🔑 **แต่ย่อหน้าที่เป็นข้อความล้วนยังถูกจำกัดความกว้างของตัวเอง** — บรรทัดยาวเกิน ~75
           ตัวอักษรอ่านยากขึ้นจริง ⇒ กว้างขึ้นเฉพาะส่วนที่ *ต้องการพื้นที่* ⛔ ไม่ใช่ทั้งหน้า
      */}
      <main
        className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-5 py-12"
        /**
         * 🪤 **ก้นหน้าต้องเว้นที่ให้แถบผู้ช่วย AI ⛔ ไม่งั้นมันลอยทับเครดิตแหล่งข้อมูล**
         *    (เจ้าของเห็นบนโดเมนแข่ง 31 ส.ค. 2026 — แถบบังบล็อก `R14` ที่ห้ามหายพอดี)
         *
         * 🔑 บวก 4 ตัว ⛔ ไม่ใช่ตัวเลขเดียว เพราะของที่ลอยอยู่ก้นจอมี 2 ชั้นซ้อนกัน:
         *    `--cookie-notice-h` (แถบคุกกี้ · `bottom-0`) + `--webmcp-bar-h` (แถบผู้ช่วยที่วางเหนือแถบคุกกี้)
         *    + `1.5rem` ที่แถบผู้ช่วยเว้นจากขอบ + `3rem` ระยะก้นหน้าเดิมของ `py-12`
         * 📌 ทั้งสองตัวแปรมีค่าสำรอง `0px` ⇒ หน้ายังถูกต้องเมื่อไม่มีแถบไหนอยู่เลย
         */
        style={{
          paddingBottom:
            'calc(3rem + 1.5rem + var(--cookie-notice-h, 0px) + var(--webmcp-bar-h, 0px))',
        }}
      >
        <header>
          <div className="flex items-start justify-between gap-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted">{copy.eyebrow}</p>
            <LanguageToggle />
          </div>
          <h1 className="mt-2 max-w-3xl text-4xl font-bold leading-tight text-ink sm:text-5xl">{copy.title}</h1>
          <p className="mt-4 max-w-3xl text-lg text-muted">{copy.lede}</p>
          <p className="mt-3 max-w-3xl text-sm text-muted">{copy.provenance}</p>
        </header>

        {/*
          🔢 **แถบตัวเลขอยู่ใต้หัวเรื่อง ⛔ ไม่ใช่ท้ายหน้า** — กรรมการที่อ่านแค่ภาพนิ่ง
             ต้องได้คำตอบเรื่อง *ขอบเขต · จำนวนเครื่องมือ · อะไรสด อะไรไม่สด* ก่อนเลื่อนจอ
        */}
        <HeroStats />

        {/*
          🏗️ **กล่อง «สร้างขึ้นข้าง ๆ ผลิตภัณฑ์จริง» อยู่สูงขนาดนี้โดยตั้งใจ**
             กติกา `R11` ให้กรรมการตัดสินจากข้อความ/ภาพได้โดยไม่ต้องกดลอง ⇒ คำถามที่เขาถามในใจ
             ตอนเห็นหน้าเดโมคือ *"นี่ทำขึ้นมาเพื่อแข่งอย่างเดียวหรือเปล่า"* ⇒ คำตอบต้องมาก่อนที่เขาจะเลื่อนผ่าน
          ⛔ **ห้ามเขียนว่าเป็น «ส่วนหนึ่งของผลิตภัณฑ์»** — โมดูล WebMCP ทั้งก้อนสร้างใหม่เพื่อการแข่งนี้
             (เหตุผลเต็มอยู่ที่หัว `ChallengeAlongsideCopy` ใน `copy.ts`)
        */}
        <section className="lml-card max-w-3xl p-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted">{copy.alongside.heading}</h2>
          {copy.alongside.body.map((paragraph) => (
            <p key={paragraph} className="mt-3 text-sm text-muted">
              {paragraph}
            </p>
          ))}
        </section>

        {/*
          🧭 **ปุ่มพาไปคู่มือ อยู่ใต้แถบตัวเลข** — คนที่เพิ่งอ่านว่ามี 6 เครื่องมือ
             คำถามถัดไปคือ *"แล้วลองยังไง"* ⇒ คำตอบต้องอยู่ตรงนั้นพอดี ⛔ ไม่ใช่ให้เลื่อนหาเอง
        */}
        <GuideBeacon />

        {/*
          📊 **กระดานของจริงต้องมาก่อนเวที agent** (เพิ่ม 31 ส.ค. 2026 — เจ้าของทักว่า «มันดูไม่มีอะไรเลย»)

          🔴 **ลำดับนี้จงใจ ⛔ ไม่ใช่เรื่องความสวยงาม:** กติกา `R11` เขียนว่ากรรมการตัดสินจาก
             ข้อความ/ภาพ/วิดีโอโดยไม่กดลองก็ได้ ⇒ ของแรกที่เห็นในภาพนิ่งต้องเป็น **ผลิตภัณฑ์ที่ทำงานอยู่**
             ⛔ ไม่ใช่กล่องที่เขียนว่า *"ยังไม่มีอะไร"* ซึ่งอ่านออกมาเป็น *proof of concept* พอดีกับ
             ถ้อยคำที่เกณฑ์ `Execution` ใช้บรรยายผลงานที่ตก
          🔑 **แต่เวที agent ยังต้องอยู่ต่อและยังต้องว่างจนกว่า agent จะลงมือจริง** — ความต่าง
             ระหว่าง 2 ก้อนนี้คือสิ่งที่ผลงานนี้ขาย ⇒ กระดานบนประกาศตัวเองว่า *หน้าเว็บอ่านเอง*
        */}
        <LiveBoard />

        <section aria-label={copy.stageHeading} className="flex flex-col gap-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted">{copy.stageHeading}</h2>
          <AgentStage />
        </section>

        {/*
          🧠 **«ทำไมต้องใช้ WebMCP» วางหลังเวที agent โดยตั้งใจ**
             ก่อนหน้านี้คนเพิ่งเห็นของจริงขยับ ⇒ ประโยคอธิบายจะถูกอ่านเป็น *คำยืนยันสิ่งที่เพิ่งเห็น*
             ⛔ ไม่ใช่คำโฆษณาลอย ๆ ที่ยังพิสูจน์ไม่ได้ · ถ้าเอาขึ้นไปไว้บนสุด มันจะกลายเป็นอย่างหลังทันที
        */}
        <section className="lml-card max-w-3xl p-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted">{copy.why.heading}</h2>
          <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-sm text-muted">
            {copy.why.items.map((item) => (
              <li key={item.bold}>
                <span className="font-bold text-ink">{item.bold}</span>
                {item.rest}
              </li>
            ))}
          </ul>
        </section>

        {/*
          🧭 `id` + `tabIndex` มีไว้ให้ `GuideBeacon` พาทั้ง *สายตา* และ *โฟกัสแป้นพิมพ์* มาถึงที่นี่
             ⛔ ห้ามถอด `tabIndex={-1}` — ถ้าถอด ปุ่มจะเลื่อนจอให้คนใช้เมาส์เท่านั้น
        */}
        <section id={GUIDE_ANCHOR_ID} tabIndex={-1} className="lml-card max-w-3xl p-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted">{copy.howHeading}</h2>

          {/*
            🔴 **เงื่อนไขต้องอยู่ *เหนือ* ขั้นตอน ⛔ ไม่ใช่เชิงอรรถท้ายกล่อง** (30 ส.ค. 2026)
               คนอ่านคู่มือจะเริ่มทำที่ข้อ 1 ทันที ⇒ อะไรที่ต้องรู้ *ก่อนลงมือ* ต้องมาก่อนข้อ 1
               🔬 พิสูจน์แล้วว่าจำเป็น: เจ้าของทำตามคู่มือเดิมครบทุกข้อ 3 รอบแล้วไม่เกิดอะไรเลย
                  เพราะขาดเงื่อนไขนี้ข้อเดียว ⇒ กรรมการจะเจอแบบเดียวกัน
          */}
          <p className="mt-3 lml-note lml-note-info p-3 text-sm font-bold text-ink">{copy.requirements}</p>

          <ol className="mt-3 flex flex-col gap-2 text-sm text-muted">
            <li>
              <span className="font-bold text-ink">1.</span> {copy.step1Before}
              <code className="break-all">chrome://flags/#enable-webmcp-testing</code>
              {copy.step1After}
            </li>
            <li>
              <span className="font-bold text-ink">2.</span> {copy.step2Before}
              <span className="font-bold">{copy.step2Panel}</span>
              {copy.step2After}
            </li>
            <li>
              <span className="font-bold text-ink">3.</span> {copy.step3}
            </li>
            <li>
              <span className="font-bold text-ink">4.</span> {copy.step4}
            </li>
          </ol>
          <p className="mt-3 text-sm text-muted">{copy.tip}</p>
          <p className="mt-4 text-sm text-muted">{copy.noAccount}</p>
        </section>

        {/*
          🗣️ **ส่วนนี้เจ้าของสั่งให้เขียนตรง ๆ (29 ส.ค. 2026)** — ต้องสื่อครบ 4 อย่าง:
             ① เรามีผลิตภัณฑ์จริง ② ทำไมตัวส่งแข่งถึงใช้สแนปช็อต ③ ส่วนนั้นกำลังพัฒนาอยู่
             และไม่ควรถูกผูกกับผลงานที่แช่แข็ง ④ เส้นทางของจริงใช้งานได้จริง
          🔴 ⛔ ห้ามเขียนว่า "ไปดูของจริงได้ที่ ..." — ผลิตภัณฑ์ยังไม่เปิดสาธารณะ
             การชวนไปดูสิ่งที่กรรมการเข้าไม่ได้ แย่กว่าการบอกตรง ๆ ว่ายังเข้าไม่ได้
          🔴 **ครบ 4 ข้อนี้ต้องครบทั้ง 2 ภาษา** — ดูคำเฉลยที่ `copy.ts` และเทสที่บังคับทั้งคู่
        */}
        <section className="lml-card max-w-3xl p-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted">{copy.snapshotHeading}</h2>
          <p className="mt-3 text-sm text-muted">{copy.snapshotIntro}</p>
          <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-sm text-muted">
            <li>
              <span className="font-bold text-ink">{copy.bullet1Bold}</span>
              {copy.bullet1Rest}
            </li>
            <li>
              <span className="font-bold text-ink">{copy.bullet2Bold}</span>
              {copy.bullet2Rest}
            </li>
          </ul>
          <p className="mt-3 text-sm text-muted">
            {copy.snapshotBodyBefore}
            <code>cached</code>
            {copy.snapshotBodyAfter}
          </p>
          <p className="mt-3 text-sm text-muted">{copy.notPublicYet}</p>
        </section>

        {/*
          📚 **เครดิตแหล่งข้อมูล — กติกา R14 บังคับ**
          ⛔ ห้ามลบออกเพื่อความสวยงามของหน้า · แหล่งไหนถูกต่อเพิ่ม ต้องมาเติมที่ `copy.ts`
             **ทั้งสองภาษา** ในคอมมิตเดียวกัน (ชื่อแหล่งคงรูปเดิม แปลเฉพาะคำอธิบาย)
        */}
        <footer className="border-t border-line pt-6 text-sm text-muted">
          <p className="font-bold text-ink">{copy.creditsHeading}</p>
          <ul className="mt-2 flex flex-col gap-1">
            {copy.credits.map((credit) => (
              <li key={credit.name}>
                {credit.name} — {credit.note}
              </li>
            ))}
          </ul>
          <p className="mt-4">{copy.coverage}</p>
        </footer>
      </main>
    </div>
  );
}
