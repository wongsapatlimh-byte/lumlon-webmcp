// src/webmcp/challenge/ThailandMap.tsx
// ────────────────────────────────────────────────────────────────────────────
// 🗺️ **แผนที่ประเทศไทยที่วาดจากทะเบียนของเราเอง — 77 หมุด ⛔ ไม่มีแผนที่ฐาน**
//
// 🔴 **ทำไมไม่ใช้ MapLibre + แผนที่ฐานของผลิตภัณฑ์จริง** (ตัดสิน 31 ส.ค. 2026):
//    แผนที่ของแอปจริงกินไฟล์ `pmtiles` ~112 MB จาก bucket ของเราเอง
//    ⇒ ตัวส่งแข่งจะกลับไป **พึ่งโครงสร้างพื้นฐานของเรา** ตลอดช่วงแช่แข็ง 3–23 ก.ย.
//      ซึ่งเป็นความเสี่ยงที่แผน §3.2 ตั้งใจตัดทิ้งไปแล้ว (จุดที่มีชีวิตต้องเหลือจุดเดียว = ชั้นอากาศ)
//    ⇒ และ URL ของ bucket เป็นของที่ตัวสแกนความลับกันไม่ให้หลุดออกไปอยู่แล้ว
//    ✅ **ทางที่เลือก: วาดเอง** — ไม่โหลด tile · ไม่มีลิขสิทธิ์ของใคร · ไม่พึ่งใครเลยแม้แต่รายเดียว
//
// 🔬 **เงาแผ่นดินมาจากไหน — เรื่องนี้ต้องอ่านก่อนแก้ (วัดด้วยตาจริง 31 ส.ค. 2026):**
//    รอบแรกวาดแค่หมุด 77 จุด **แล้วอ่านไม่ออกว่าเป็นประเทศไทย** (เป็นแค่จุดกระจาย ๆ)
//    ⇒ ทางแก้ที่ **ผิด** คือไปหาเส้นขอบประเทศของคนอื่นมาวาด — ทั้งเสี่ยงลิขสิทธิ์ (`K4`)
//      และเป็นการอ้างความแม่นยำที่เราตรวจสอบเองไม่ได้
//    ✅ ทางแก้ที่ใช้: **เอาหมุดของเราเองมาเบลอ** (`feGaussianBlur` + เร่งคอนทราสต์ของ alpha)
//      ⇒ ได้ *สนามความหนาแน่นของ 77 จังหวัด* ซึ่งบังเอิญอ่านออกเป็นรูปประเทศไทย
//      🔑 **ทุกพิกเซลของเงานี้คำนวณจากทะเบียนของเราล้วน ๆ** ⛔ ไม่ใช่ชายฝั่งจริง
//         ⇒ มันคือ *แผนภาพ* ไม่ใช่ *แผนที่ภูมิศาสตร์* — และหน้าเว็บต้องไม่อ้างว่าเป็นอย่างหลัง
//    🔬 ค่าที่เลือก (blur 6 · r 7.5 · slope 2) มาจากการเรนเดอร์เทียบ 6 ชุดแล้วดูด้วยตา
//       ⛔ ไม่ใช่ค่าที่เดา — ต่ำกว่านี้ภาคใต้ขาดจากแผ่นดินใหญ่ · สูงกว่านี้กลายเป็นก้อนไร้รูป
//
// 🔑 **เรื่องพิกัดกับกติกา `GEO-0` (มติ D-26) — อ่านก่อนคิดจะรื้อ:**
//    `GEO-0` ห้าม **พิกัดอยู่ใน query string / path / เนื้อคำขอที่ผู้ใช้กำหนด** ⇒ เส้นข้อมูล
//    เป็น POST ที่รับแค่ `provinceCode` · ⛔ **ไม่ได้ห้ามทะเบียนนิ่งอยู่ในบันเดิลเบราว์เซอร์**
//    🔬 ตรวจแล้ว 31 ส.ค. 2026: `providers/demoProvider.ts` (โค้ดฝั่งเบราว์เซอร์) `import`
//       ทะเบียนนี้ตรง ๆ อยู่แล้ววันนี้ ⇒ ไฟล์นี้ **ไม่ได้เปิดเผยอะไรใหม่** (แก้คอมเมนต์ที่เคย
//       เขียนขัดความจริงไว้ใน `provinces.ts` แล้วในคอมมิตเดียวกัน)
//
// 🔴 **กติกาความซื่อสัตย์ของแผนที่ใบนี้ — ข้อเดียวที่ห้ามละเมิด:**
//    **หมุดสีเทา = ยังไม่ได้อ่าน** ⛔ ไม่ใช่ "อากาศดี" · จังหวัดจะได้สีก็ต่อเมื่อ
//    **มีคนอ่านค่าของมันจริง** (หน้าเว็บอ่านตอนเปิด หรือ agent เรียก tool)
//    ⇒ แผนที่ที่ระบายสีทั้งประเทศทั้งที่อ่านมา 3 จังหวัด คือการโกหกที่ดูดีที่สุดบนหน้านี้
//
// 🔴 **ทุก import ต้องเป็น `@/...` ⛔ ห้าม relative** (ด่าน `RELATIVE_IN_SUBSTITUTED`)

'use client';

import { useEffect, useRef, useState } from 'react';
import { getAqiStatus } from '@/lib/aqi';
import { CHALLENGE_PROVINCES } from '@/webmcp/challenge/provinces';
import { placeLabel, type ReadingOrigin, type SnapshotEntry } from '@/webmcp/challenge/SnapshotCard';
import type { ChallengeLang, ChallengeMapCopy, ChallengeStageCopy } from '@/webmcp/challenge/copy';

/** ที่มาของค่าที่อยู่บนหมุด — จอต้องบอกได้เสมอว่า *ใคร* เป็นคนอ่านมา */
export interface MapReading extends SnapshotEntry {
  origin: ReadingOrigin;
}

/**
 * 🧭 **การฉายพิกัด — equirectangular ที่แก้ความกว้างด้วย `cos(lat)`**
 *
 * ⚠️ **ทำไมต้องแก้ด้วย `cos(lat)` ⛔ ไม่ใช่เอา `lon` ไปวางตรง ๆ:** 1 องศาลองจิจูดที่ละติจูด 14°
 *    สั้นกว่า 1 องศาละติจูดราว 3% ⇒ ถ้าไม่แก้ ประเทศจะ **อ้วนขึ้น** อย่างเห็นได้ชัด
 *    และคนไทยที่ดูจะรู้ทันทีว่ารูปผิด (ซึ่งแย่กว่าการไม่มีแผนที่)
 * 🔑 คำนวณจากทะเบียนจริงตอนโหลดโมดูล ⛔ ไม่ฝังตัวเลขขอบเขตไว้ — เพิ่ม/แก้จังหวัดแล้วยังถูกเอง
 */
const LAT_MID =
  CHALLENGE_PROVINCES.reduce((sum, province) => sum + province.lat, 0) / CHALLENGE_PROVINCES.length;
const LON_SCALE = Math.cos((LAT_MID * Math.PI) / 180);

const RAW = CHALLENGE_PROVINCES.map((province) => ({
  code: province.code,
  x: province.lon * LON_SCALE,
  /** y ของ SVG ชี้ลง ⇒ ละติจูดมากต้องอยู่บน ⇒ ติดลบ */
  y: -province.lat,
}));

const MIN_X = Math.min(...RAW.map((point) => point.x));
const MAX_X = Math.max(...RAW.map((point) => point.x));
const MIN_Y = Math.min(...RAW.map((point) => point.y));
const MAX_Y = Math.max(...RAW.map((point) => point.y));

/** ขอบกันหมุดริมสุดโดนตัด — หน่วยเดียวกับ `viewBox` */
const PAD = 6;
const SPAN_X = MAX_X - MIN_X;
const SPAN_Y = MAX_Y - MIN_Y;

/** กว้าง 100 หน่วยเสมอ ⇒ สูงเท่าไรให้สัดส่วนภูมิศาสตร์เป็นคนบอก ⛔ ไม่ใช่เราตั้งเอง */
const VIEW_W = 100;
const SCALE = (VIEW_W - PAD * 2) / SPAN_X;
const VIEW_H = SPAN_Y * SCALE + PAD * 2;

const POINTS = RAW.map((point) => ({
  code: point.code,
  x: PAD + (point.x - MIN_X) * SCALE,
  y: PAD + (point.y - MIN_Y) * SCALE,
}));
const POINT_BY_CODE = new Map(POINTS.map((point) => [point.code, point]));

/** รัศมีหมุดที่ **ความกว้างเต็มประเทศ** — ตอนกล้องซูมจะถูกหารด้วยอัตราซูมให้ขนาดบนจอคงที่ */
const DOT_UNREAD = 1.25;
const DOT_READ = 2.4;

/** ค่าที่วัดด้วยตาแล้วว่าให้รูปประเทศไทยที่อ่านออก (ดูหัวไฟล์) */
const SHADOW_BLUR = 6;
const SHADOW_R = 7.5;
const SHADOW_SLOPE = 2;

/**
 * 🌊 **เกณฑ์ alpha 2 ชั้น = แผ่นดิน + ชายฝั่ง**
 *    (แก้ 31 ส.ค. 2026 หลังเจ้าของทักว่า *"แผนที่ดำ เทา ดูไม่รู้เรื่องเลยว่าแผนที่อะไร"*)
 *
 * 🔬 **ของเดิมผิดตรงไหน:** แผ่นดินเป็น `ink` จาง ๆ (18%) วางบนพื้นหน้าเว็บสีเดียวกับรอบ ๆ
 *    ⇒ ได้ *ก้อนเทาบนพื้นเทา* ไม่มีเส้นแบ่งว่าตรงไหนคือแผ่นดิน · และหมุดเทาก็จมหายไปในก้อนนั้น
 * ✅ **ที่แก้:** ผืนน้ำเป็นพื้นฟ้าอ่อนของกล่อง · แผ่นดินเป็นสีพื้นการ์ด (ขาว) · คั่นด้วยชายฝั่งสีเขียวแบรนด์
 *    ⇒ คนอ่านออกทันทีว่าอันไหนน้ำอันไหนดิน **และหมุดสีทุกสีเด้งขึ้นเพราะไปวางบนพื้นขาว**
 *
 * 🧮 **คณิตของ 2 ค่านี้ — อ่านก่อนขยับ:** `feFuncA` คิด `A' = slope×A + intercept`
 *    ⇒ ขอบของรูปอยู่ตรงที่ `A = -intercept / slope` · **ยิ่ง intercept ติดลบมาก รูปยิ่งเล็กลง**
 *    ⇒ `RIM` (-0.22 ⇒ ขอบที่ A=0.11) จึงกว้างกว่า `LAND` (-0.35 ⇒ A=0.175) อยู่นิดเดียว
 *      **ส่วนที่โผล่พ้นออกมาคือชายฝั่ง** ⛔ ไม่ได้วาดเส้นขอบเพิ่ม — ยังเป็นหมุด 77 จุดชุดเดิมล้วน ๆ
 * 🔴 **`LAND_INTERCEPT` ต้องคงเป็น -0.35** เพราะเป็นค่าที่เรนเดอร์เทียบ 6 ชุดแล้วเลือกด้วยตา
 *    (ต่ำกว่านี้ภาคใต้ขาดจากแผ่นดินใหญ่) ⇒ **รูปประเทศไม่เปลี่ยนจากเดิมเลย เปลี่ยนแค่สี**
 */
const LAND_INTERCEPT = -0.35;
const RIM_INTERCEPT = -0.22;

interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

const FULL_VIEW: ViewBox = { x: 0, y: 0, w: VIEW_W, h: VIEW_H };

/**
 * 🎥 **กล้องต้องไม่ซูมจนมองไม่เห็นว่านี่คือประเทศไทย**
 *    ⇒ กรอบที่แคบกว่านี้จะถูกขยายออกให้ถึงเพดาน — คนดูต้องรู้ตลอดว่ากำลังดูที่ไหนของประเทศ
 */
const MIN_VIEW_RATIO = 0.55;

function frameOf(codes: readonly string[]): ViewBox {
  const points = codes.map((code) => POINT_BY_CODE.get(code)).filter((point) => point !== undefined);
  if (points.length === 0) return FULL_VIEW;

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;

  /** กรอบต้องคงอัตราส่วนเดิมเสมอ ⛔ ไม่งั้นแผนที่จะยืด/บี้ตอนกล้องขยับ */
  const needW = Math.max(...xs) - Math.min(...xs) + 26;
  const needH = Math.max(...ys) - Math.min(...ys) + 26;
  const ratio = Math.max(needW / VIEW_W, needH / VIEW_H, MIN_VIEW_RATIO);
  const w = Math.min(VIEW_W, VIEW_W * ratio);
  const h = Math.min(VIEW_H, VIEW_H * ratio);

  /** ⛔ ห้ามให้กล้องเลื่อนออกนอกแผนที่ — ขอบต้องชนแล้วหยุด */
  const x = Math.min(Math.max(cx - w / 2, 0), VIEW_W - w);
  const y = Math.min(Math.max(cy - h / 2, 0), VIEW_H - h);
  return { x, y, w, h };
}

/** สมการผ่อนแรงแบบ ease-out — เข้าเป้าแล้วนิ่ง ⛔ ไม่เด้ง (ภาพนิ่ง/วิดีโอต้องจับได้) */
function easeOut(t: number): number {
  return 1 - (1 - t) ** 3;
}

const CAMERA_MS = 650;

/**
 * 💬 **กล่องข้อมูลลอยเหนือหมุด — ทีละใบเท่านั้น** (เจ้าของสั่ง 31 ส.ค. 2026)
 *
 * 🔴 **ทำไมใบเดียว ⛔ ไม่ใช่ทุกจังหวัดที่อ่านแล้ว:** กล่อง 3 ใบบนแผนที่แคบ ๆ จะทับกันเอง
 *    จนอ่านไม่ออก และเวลาถ่ายวิดีโอจะไม่มีจุดที่สายตาควรไป
 *    ⇒ ใบเดียวที่ **ตามหมุดที่เพิ่งถูกแตะ** ทำให้ทั้งคนดูสดและกล้องรู้ว่าต้องมองตรงไหน
 */
function Callout({
  reading,
  left,
  top,
  lang,
  stage,
}: {
  reading: MapReading;
  /** ตำแหน่งเป็น % ของกรอบที่ *กล้องกำลังมองอยู่* ⛔ ไม่ใช่ของแผนที่ทั้งใบ */
  left: number;
  top: number;
  lang: ChallengeLang;
  /** ⛔ ป้าย «ใครอ่าน» มาจากถ้อยคำของ *เวที* — ที่เดียวกับที่การ์ดใช้ (ห้ามมี 2 ชุดที่เพี้ยนกันได้) */
  stage: ChallengeStageCopy;
}) {
  const aqi = reading.summary.aqi;
  const status = typeof aqi === 'number' ? getAqiStatus(aqi, lang) : null;

  /**
   * 📐 **กล่องต้องเล็กและอยู่เหนือหมุดพอดี** (แก้หลังดูภาพจริง 31 ส.ค. 2026)
   *    🔬 รอบแรกกล่องกว้าง 144px และวางชิดซ้ายของหมุด ⇒ **บังกลางประเทศจนแผนที่อ่านไม่ออก**
   *    ⇒ ย่อเหลือ 3 บรรทัด (ชื่อ · AQI+ระดับ · ใครอ่าน) แล้ววางกึ่งกลางเหนือหมุด
   *      รายละเอียดเต็มอยู่บนการ์ดข้าง ๆ อยู่แล้ว ⇒ กล่องนี้มีหน้าที่ **ชี้ว่า "ตรงนี้"** เท่านั้น
   * 🔑 ริมซ้าย/ขวาสุดค่อยเลิกจัดกึ่งกลาง เพื่อไม่ให้ล้นออกนอกกรอบ
   */
  const anchor = left < 22 ? '0' : left > 78 ? '-100%' : '-50%';

  return (
    <div
      className="pointer-events-none absolute z-10 w-28"
      style={{
        left: `${left}%`,
        top: `${top}%`,
        transform: `translate(${anchor}, calc(-100% - 12px))`,
      }}
    >
      <div className="lml-card px-2 py-1.5 text-center shadow-lg">
        <p className="text-[11px] font-bold leading-tight text-ink">{placeLabel(reading.place, lang)}</p>
        <p className="mt-0.5 leading-none">
          <span className="text-base font-bold text-ink">{aqi ?? '—'}</span>
          <span className="ml-1 text-[9px] text-muted">AQI</span>
        </p>
        {status && <p className={`mt-0.5 text-[10px] font-bold leading-tight ${status.text}`}>{status.label}</p>}
        {/* 🔴 เส้นแบ่ง "ใครเป็นคนอ่าน" ห้ามหาย — หน้านี้ทั้งหน้าขายเรื่องนี้ */}
        <p className="mt-1 text-[9px] uppercase leading-tight tracking-wider text-muted">
          {reading.origin === 'agent' ? stage.readByAgent : stage.readByPage}
        </p>
      </div>
    </div>
  );
}

export default function ThailandMap({
  readings,
  focusedCode,
  searchCodes,
  lang,
  copy,
  stage,
}: {
  readings: MapReading[];
  /** จังหวัดที่ถูกแตะล่าสุด — เจ้าของกล่องลอย และเป็นเป้าของกล้อง */
  focusedCode: string | null;
  /** รหัสจังหวัดจากผลค้นหาล่าสุดของ agent — ทำให้หมุด "ถูกชี้" โดยที่ยังไม่มีค่า */
  searchCodes: readonly string[];
  lang: ChallengeLang;
  copy: ChallengeMapCopy;
  stage: ChallengeStageCopy;
}) {
  const readingByCode = new Map(
    readings.filter((reading) => reading.place.code).map((reading) => [reading.place.code as string, reading]),
  );
  const searchSet = new Set(searchCodes);
  const focused = focusedCode ? readingByCode.get(focusedCode) : undefined;

  /**
   * 🎥 **กล้องที่วิ่งตามสิ่งที่ agent เพิ่งทำ** (เจ้าของสั่ง 31 ส.ค. 2026: *"search หาตรงไหน ก็วิ่งไปตรงนั้น"*)
   *
   * 🔴 **ทำไมต้องทวีนเอง ⛔ ไม่ใช่ CSS transition:** `viewBox` เป็น *แอตทริบิวต์ของ SVG*
   *    ⛔ ไม่ใช่พรอเพอร์ตี้ CSS ⇒ เบราว์เซอร์ไม่ทรานซิชันให้ · การไปขยับด้วย `transform`
   *    แทนจะทำให้ความหนาของเส้น/ขนาดหมุดเพี้ยนตามไปด้วย
   * ♿ **เคารพ `prefers-reduced-motion`** — คนที่ตั้งค่าไว้ต้องได้ภาพที่กระโดดถึงที่ทันที
   *    ⛔ ไม่ใช่ไม่ได้ผลลัพธ์เลย (ปลายทางต้องเหมือนกัน ต่างแค่ทางไป)
   */
  const [view, setView] = useState<ViewBox>(FULL_VIEW);
  const frameRef = useRef<number | null>(null);
  const viewRef = useRef<ViewBox>(FULL_VIEW);
  viewRef.current = view;

  const targetKey = focusedCode ?? searchCodes.join(',');

  useEffect(() => {
    const codes = focusedCode ? [focusedCode] : [...searchCodes];
    const target = frameOf(codes);
    const from = viewRef.current;

    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /**
     * 🛑 **ไม่ต้องขยับ = ไม่ต้องทวีน** (เพิ่ม 31 ส.ค. 2026 หลังเห็นคำเตือน worker ค้างในเทส)
     *
     * 🔬 **อาการที่พาไปเจอ:** ตอน mount ครั้งแรก ปลายทางคือ *มุมมองเต็มประเทศ* ซึ่ง **เท่ากับ
     *    ที่อยู่ปัจจุบันเป๊ะ** ⇒ เดิมยังเข้าลูป `requestAnimationFrame` ~40 รอบเพื่อวิ่งจาก A ไป A
     *    ⇒ เปลืองเฟรมฟรี ๆ ทุกครั้งที่เปิดหน้า **และทำให้ jest มี timer ค้างจนเตือน worker ไม่ปิด**
     * 🔑 บทเรียนย่อย: คำเตือนของ jest ชี้ไปที่ของที่เปลืองจริงบนหน้าเว็บด้วย ⛔ ไม่ใช่เรื่องของเทสอย่างเดียว
     */
    const SAME = 0.01;
    const settled =
      Math.abs(from.x - target.x) < SAME &&
      Math.abs(from.y - target.y) < SAME &&
      Math.abs(from.w - target.w) < SAME &&
      Math.abs(from.h - target.h) < SAME;

    if (reduced || settled) {
      setView(target);
      return;
    }

    const started = performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, (now - started) / CAMERA_MS);
      const k = easeOut(progress);
      setView({
        x: from.x + (target.x - from.x) * k,
        y: from.y + (target.y - from.y) * k,
        w: from.w + (target.w - from.w) * k,
        h: from.h + (target.h - from.h) * k,
      });
      if (progress < 1) frameRef.current = requestAnimationFrame(step);
    };
    frameRef.current = requestAnimationFrame(step);

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetKey]);

  /** อัตราซูมปัจจุบัน — ใช้หารรัศมีหมุดให้ **ขนาดบนจอคงที่** ตอนกล้องเข้าใกล้ */
  const zoom = view.w / VIEW_W;
  const focusedPoint = focusedCode ? POINT_BY_CODE.get(focusedCode) : undefined;

  return (
    <div className="flex flex-col gap-2">
      {/*
        🌊 **พื้นกล่อง = ผืนน้ำ** — ⛔ ไม่ได้วาดเป็น `<rect>` ในภาพ เพราะกล้องเลื่อน/ซูมได้
           ⇒ ถ้าวาดในภาพ ผืนน้ำจะเลื่อนตามกล้องไปด้วย ซึ่งผิดธรรมชาติของแผนที่
      */}
      <div
        className="relative mx-auto w-full max-w-[340px] overflow-hidden rounded-card border border-line bg-accent-200"
        style={{ aspectRatio: `${VIEW_W} / ${VIEW_H}` }}
      >
        <svg
          viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label={copy.mapAlt}
        >
          <defs>
            <filter id="lml-landmass" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation={SHADOW_BLUR} />
              {/* เร่งคอนทราสต์ของ alpha ⇒ ขอบของสนามความหนาแน่นคมพอจะอ่านเป็นแผ่นดิน */}
              <feComponentTransfer>
                <feFuncA type="linear" slope={SHADOW_SLOPE} intercept={LAND_INTERCEPT} />
              </feComponentTransfer>
            </filter>
            {/* ชายฝั่ง = รูปเดียวกันที่กว้างกว่านิดเดียว (ดูคณิตที่ `RIM_INTERCEPT`) */}
            <filter id="lml-landmass-rim" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation={SHADOW_BLUR} />
              <feComponentTransfer>
                <feFuncA type="linear" slope={SHADOW_SLOPE} intercept={RIM_INTERCEPT} />
              </feComponentTransfer>
            </filter>
          </defs>

          {/*
            🏝️ **เงาแผ่นดิน — สร้างจากหมุดของเราเองล้วน ๆ** (ดูหัวไฟล์)
               ⛔ ห้ามแทนด้วยเส้นขอบประเทศจากที่อื่น ไม่ว่าจะดูดีขึ้นแค่ไหน
          */}
          <g filter="url(#lml-landmass-rim)" className="text-accent-700" fill="currentColor" opacity={0.9}>
            {POINTS.map((point) => (
              <circle key={`rim-${point.code}`} cx={point.x} cy={point.y} r={SHADOW_R} />
            ))}
          </g>
          <g filter="url(#lml-landmass)" className="text-surface" fill="currentColor">
            {POINTS.map((point) => (
              <circle key={`land-${point.code}`} cx={point.x} cy={point.y} r={SHADOW_R} />
            ))}
          </g>

          {POINTS.map((point) => {
            const reading = readingByCode.get(point.code);
            const aqi = reading?.summary.aqi;
            /**
             * 🎨 สีมาจาก `getAqiStatus` ของแอปจริง ⛔ ไม่สร้างเกณฑ์ชุดที่สอง ([[L-398]])
             *    ใช้ `currentColor` + คลาสข้อความของโทเคน ⇒ **ไม่มีค่าสีดิบในไฟล์นี้เลย**
             */
            const status = typeof aqi === 'number' ? getAqiStatus(aqi, lang) : null;
            const pointed = searchSet.has(point.code);
            const isFocused = point.code === focusedCode;

            return (
              <g key={point.code}>
                {/* วงแหวนบอกว่า "ตัวนี้แหละ" — ค้างอยู่ ⛔ ไม่ใช่เอฟเฟกต์ที่วูบหาย (ภาพนิ่งต้องจับได้) */}
                {(isFocused || pointed) && (
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={(DOT_READ + 2.2) * zoom}
                    fill="none"
                    strokeWidth={0.7 * zoom}
                    className="text-ink opacity-45"
                    stroke="currentColor"
                  />
                )}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={(reading ? DOT_READ : DOT_UNREAD) * zoom}
                  fill="currentColor"
                  className={
                    status
                      ? status.icon
                      : reading
                        ? 'text-muted'
                        : /*
                           * 🔴 ยังไม่ได้อ่าน = เทา ⛔ ไม่ใช่สีที่แปลว่าอากาศดี
                           * 🔬 ทึบขึ้นจาก 55% เป็น 75% ตอนเปลี่ยนแผ่นดินเป็นพื้นขาว — บนก้อนเทาเดิม
                           *    หมุดเทาจาง ๆ แทบมองไม่เห็น ⇒ คนอ่านไม่ออกว่าหน้านี้ครอบคลุมทั้ง 77 จังหวัด
                           */
                          'text-muted opacity-75'
                  }
                />
              </g>
            );
          })}
        </svg>

        {focused && focusedPoint && (
          <Callout
            reading={focused}
            left={((focusedPoint.x - view.x) / view.w) * 100}
            top={((focusedPoint.y - view.y) / view.h) * 100}
            lang={lang}
            stage={stage}
          />
        )}
      </div>

      {/*
        🔴 **คำอธิบายหมุดเทาต้องอยู่บนหน้า ⛔ ไม่ใช่ในเอกสาร** — คนที่เห็นแผนที่ครั้งแรก
           จะเดาเองว่าเทา = ปลอดภัย · ประโยคเดียวนี้กันการเข้าใจผิดทั้งก้อน
      */}
      <p className="text-balance text-center text-xs text-muted">{copy.legend}</p>
      {/* 🔑 และต้องบอกด้วยว่ารูปนี้ *ไม่ใช่* เส้นขอบประเทศจริง — เราวาดจากหมุดของเราเอง */}
      <p className="text-center text-[11px] text-muted opacity-80">{copy.shapeNote}</p>
    </div>
  );
}
