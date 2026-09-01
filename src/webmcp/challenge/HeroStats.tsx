// src/webmcp/challenge/HeroStats.tsx
// ────────────────────────────────────────────────────────────────────────────
// 🔢 **4 ตัวเลขที่กรรมการอ่านได้ใน 2 วินาที — และทุกตัวโกหกไม่ได้**
//
// 🔴 **ทำไมถึงมี:** กติกา `R11` เขียนว่ากรรมการ *"ไม่จำเป็นต้องทดสอบผลงาน และอาจตัดสิน
//    จากข้อความ ภาพ และวิดีโอเท่านั้น"* ⇒ ต้องมีที่ที่ตอบ 4 คำถามแรกของคนอ่านได้ทันที:
//    ครอบคลุมแค่ไหน · มีเครื่องมือกี่ตัว · ข้อมูลสดจริงไหม · อะไรที่ไม่สด
//
// 🔴 **กติกาเหล็กของไฟล์นี้: ทุกตัวเลข *อ่านจากของจริง* ⛔ ห้ามพิมพ์เลขลงไปเอง**
//    · จำนวนจังหวัด ← `CHALLENGE_PROVINCES.length`
//    · จำนวนเครื่องมือ ← `buildCoreTools(...).length` (ทะเบียนตัวเดียวกับที่ลงทะเบียนกับเบราว์เซอร์)
//    · วันที่ถ่ายสแนปช็อตประกาศ ← `ALERTS_CAPTURED_AT`
//    🔑 **เหตุผลที่ไม่ยอมให้ hardcode แม้แต่ตัวเดียว:** วันไหนมี tool หายไป 1 ตัว บรรทัดนี้
//       ต้องลดลงเอง ⇒ ตัวเลขบนหน้าแรกเป็น *ผลของโค้ด* ไม่ใช่ *คำโฆษณาที่ต้องมาไล่แก้*
//       ⛔ ตัวเลขที่พิมพ์เองคือคำโกหกที่รอวันเกิด และกรรมการกดนับได้จากแผง Site tools
//
// 🔑 **ช่องที่ 4 คือช่องที่ทำให้ 3 ช่องแรกน่าเชื่อ** — มันประกาศ *ความไม่สด* ของชั้นประกาศ
//    เตือนภัยไว้บนหน้าแรกเลย ⇒ เปลี่ยนข้อจำกัดให้เป็นหลักฐานว่าเราพูดตรง (มติ D-16)
//
// 🔴 **ทุก import ต้องเป็น `@/...` ⛔ ห้าม relative** (ด่าน `RELATIVE_IN_SUBSTITUTED`)

'use client';

import { useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { CHALLENGE_COPY, challengeLangOf } from '@/webmcp/challenge/copy';
import { ALERTS_CAPTURED_AT } from '@/webmcp/challenge/alertsSnapshot';
/** 🔀 ต้องเป็น `providers/active` ⛔ ห้ามเป็น `challenge/activeProvider` — เหตุผลเต็มอยู่หัว `LiveBoard.tsx` */
import { createActiveProvider } from '@/webmcp/providers/active';
import { CHALLENGE_PROVINCES } from '@/webmcp/challenge/provinces';
import { DATE_LOCALE } from '@/webmcp/challenge/SnapshotCard';
import { buildCoreTools } from '@/webmcp/registry';

export default function HeroStats() {
  const { lang } = useLanguage();
  const clang = challengeLangOf(lang);
  const copy = CHALLENGE_COPY[clang];

  /**
   * 🧮 นับจากทะเบียนจริง — ตัวเดียวกับที่ `runtime.tsx` ส่งให้เบราว์เซอร์ลงทะเบียน
   *    ⛔ ห้ามเปลี่ยนเป็นเลขคงที่เพื่อประหยัดการสร้างอ็อบเจกต์ — ราคาที่จ่ายคือความจริง
   */
  const toolCount = useMemo(() => buildCoreTools({ provider: createActiveProvider() }).length, []);

  const capturedOn = useMemo(
    () =>
      new Date(ALERTS_CAPTURED_AT).toLocaleDateString(DATE_LOCALE[clang], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    [clang],
  );

  const stats: Array<{ value: string; label: string; muted?: boolean }> = [
    { value: String(CHALLENGE_PROVINCES.length), label: copy.stats.provinces },
    { value: String(toolCount), label: copy.stats.tools },
    { value: copy.stats.liveValue, label: copy.stats.liveLabel },
    /** ⛔ ช่องนี้ต้องดูต่างจาก 3 ช่องแรก — มันคือช่องที่บอกว่า *อะไรไม่สด* */
    { value: capturedOn, label: copy.stats.snapshotLabel, muted: true },
  ];

  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="lml-card p-3">
          <dd className={`text-xl font-bold leading-tight ${stat.muted ? 'text-muted' : 'text-ink'}`}>
            {stat.value}
          </dd>
          <dt className="mt-1 text-[11px] uppercase tracking-wider text-muted">{stat.label}</dt>
        </div>
      ))}
    </dl>
  );
}
