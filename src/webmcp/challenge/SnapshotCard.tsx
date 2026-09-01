// src/webmcp/challenge/SnapshotCard.tsx
// ────────────────────────────────────────────────────────────────────────────
// 🃏 **การ์ดสภาพแวดล้อม 1 ใบ + แสตมป์เวลา/แหล่ง** — ใช้ร่วมกัน **2 ที่**
//
// 🔴 **ทำไมถึงถูกแยกออกมาจาก `AgentStage.tsx`** (31 ส.ค. 2026):
//    ตั้งแต่หน้าแรกมีกระดาน `LiveBoard` ที่อ่านข้อมูลเองตอนเปิดหน้า จอนี้มีการ์ดสภาพแวดล้อม
//    **2 ที่** — ที่กระดาน และที่เวที agent · ถ้าปล่อยให้ต่างคนต่างวาด วันไหนกติกาการแสดงผล
//    เปลี่ยน (เช่น *อ่านไม่ได้ ≠ 0*) จะแก้ที่เดียวแล้วอีกที่ยังโกหกต่อไปเงียบ ๆ
//    ⇒ **การ์ดใบเดียวกันเป๊ะทั้ง 2 ที่** คือสิ่งที่ทำให้คำมั่นของหน้านี้ยังเป็นจริง
//
// 🔑 **หลักที่ยกมาจากไฟล์เดิมทั้งดุ้น — จอต้องไม่ดูสมบูรณ์กว่าความจริง**
//    · อ่านชั้นประกาศไม่ได้ ⇒ เขียนว่า *อ่านไม่ได้* ⛔ ไม่ใช่แสดงเลข 0
//    · ส่วนที่ขาด (`gaps`) ต้องขึ้นจอ ⛔ ไม่ใช่ซ่อนแล้วโชว์เฉพาะตัวเลขที่มี
//    · ทุกก้อนมีเวลา + แหล่ง ⇒ กรรมการตรวจคำตอบของ agent จากหน้าจอได้เอง
//
// 🔴 **ทุก import ในไฟล์นี้ต้องเป็น `@/...` ⛔ ห้าม relative** — ไฟล์ในโซนนี้ถูกตัวถ่ายสำเนา
//    ย้ายตำแหน่งได้ (ด่าน `RELATIVE_IN_SUBSTITUTED`) · `@/` ผูกกับราก `src/` ⇒ ถูกทั้ง 2 ที่

'use client';

import { getAqiStatus } from '@/lib/aqi';
import type { ChallengeLang, ChallengeStageCopy } from '@/webmcp/challenge/copy';
import type { StampedLayer, UiPlaceRef, UiSnapshotSummary } from '@/webmcp/uiBridge';

/** ⛔ ชื่อ `SnapshotEntry` ⛔ ไม่ใช่ `SnapshotCard` — ตัวหลังเป็นชื่อคอมโพเนนต์ที่วาดการ์ดใบนี้ */
export interface SnapshotEntry {
  place: UiPlaceRef;
  summary: UiSnapshotSummary;
}

/**
 * 🏷️ **ที่มาของค่าบนการ์ด — ใครเป็นคนสั่งให้อ่าน**
 *
 * 🔴 **ประกาศไว้ที่ไฟล์นี้ ⛔ ไม่ใช่ที่ `ThailandMap.tsx`** — เพราะแผนที่ `import` การ์ดใบนี้
 *    ถ้าเอาชนิดไปไว้ฝั่งโน้นแล้วการ์ด `import` กลับ จะกลายเป็นวงกลมของการพึ่งพา
 * 🔑 **`'page'` แปลว่า *หน้าเว็บหรือคนกดเอง* · `'agent'` แปลว่า *มาจากเหตุการณ์ของ tool*
 *    ⇒ แยกได้เพราะ **เส้นทางโค้ดคนละเส้น** (หน้าเว็บเรียก provider ตรง ๆ · tool ยิงผ่าน `uiBridge`)
 *    ⛔ ไม่ใช่เพราะเราตั้งใจติดป้ายให้ถูก — ป้ายที่พึ่งความตั้งใจจะผิดในวันที่คนแก้ไม่รู้กติกา
 */
export type ReadingOrigin = 'page' | 'agent';

/**
 * 🔤 **ทางออกสำหรับคีย์ที่คลังถ้อยคำไม่รู้จัก** — `outdoor_exercise` → `outdoor exercise`
 *
 * 🔴 **ทำไมต้องมี ⛔ ไม่ใช่ปล่อยว่าง:** คีย์พวกนี้ (`gap.part` · `activity`) มาจากหลังบ้าน
 *    ซึ่งเพิ่มค่าใหม่ได้ตลอดโดยไม่มาบอกหน้าเว็บ ⇒ ถ้าไม่มีทางตก **ส่วนที่ขาดจะหายไปจากจอ**
 *    ซึ่งขัดกับหลักของทั้งไฟล์ (*จอต้องไม่ดูสมบูรณ์กว่าความจริง*) — คำอ่านหยาบ ๆ ยังดีกว่าไม่บอก
 */
export function humanize(key: string): string {
  return key.replace(/_/g, ' ');
}

/**
 * หยิบป้ายจากคลังถ้อยคำ · ไม่มีในคลัง = ตกกลับไปคำอ่านหยาบ ⛔ ไม่ใช่ค่าว่าง
 *
 * 🔴 **ต้องใช้ `Object.hasOwn` ⛔ ห้ามใช้ `table[key] ?? ...`** (รอบผู้ตรวจ 30 ส.ค. 2026 จับได้)
 *    คีย์พวกนี้มาจากคำตอบของหลังบ้าน/agent ⇒ **เป็นสตริงอะไรก็ได้** · ถ้าเผลอเป็นชื่อ
 *    พรอพเพอร์ตี้ของ `Object.prototype` (`toString` · `constructor` · `valueOf` …)
 *    `table[key]` จะได้ **ฟังก์ชัน** ซึ่งไม่ใช่ nullish ⇒ `??` ไม่ทำงาน ⇒ ฟังก์ชันถูกส่งไปให้ React
 *    ⇒ **จอขาวทั้งหน้า** ด้วย *Functions are not valid as a React child*
 */
export function labelOf(table: Readonly<Record<string, string>>, key: string): string {
  return Object.hasOwn(table, key) ? table[key] : humanize(key);
}

/**
 * 🗓️ **รูปแบบวันเวลาต้องเดินตามภาษาของหน้า ⛔ ไม่ใช่ตามเครื่องผู้ใช้** (รอบผู้ตรวจ 30 ส.ค. 2026)
 *    `toLocaleString()` เปล่า ๆ อ่านค่าจาก OS ⇒ คนตั้งเครื่องเป็นอังกฤษแต่กดอ่านหน้าไทย
 *    จะได้ `8/30/2026, 11:00:00 AM` กลางหน้าไทย
 *
 * 🔴 **ต้องเป็น `th-TH-u-ca-gregory` ⛔ ห้ามใช้ `th-TH` เฉย ๆ**
 *    🔬 วัดแล้ว: `th-TH` ให้ **พ.ศ. 2569** (ปฏิทินพุทธเป็นค่าปริยายของ locale ไทย)
 *    ⇒ กรรมการที่เอาเวลานี้ไปเทียบกับ `observedAt` ใน JSON จะเห็นปีต่างกัน 543 ปี (มติ D-16)
 */
export const DATE_LOCALE: Readonly<Record<ChallengeLang, string>> = {
  EN: 'en-US',
  TH: 'th-TH-u-ca-gregory',
};

/**
 * 🏷️ **ชื่อสถานที่เดินตามภาษาที่ผู้ใช้เลือก**
 *    ⚠️ `labelTh` ว่างได้ (สถานที่ย่อยบางแห่งไม่มีชื่อไทยในทะเบียน) ⇒ ตกกลับ `labelEn` เสมอ
 *    ⛔ ห้ามโชว์ค่าว่างแทนชื่อ — ผู้ใช้จะไม่รู้ว่า agent พูดถึงที่ไหน
 */
export function placeLabel(place: UiPlaceRef, lang: ChallengeLang): string {
  return lang === 'TH' ? place.labelTh || place.labelEn : place.labelEn;
}

/**
 * 🔑 **กุญแจประจำสถานที่** — ใช้รหัสจังหวัดก่อน · สถานที่ย่อยที่ไม่มีรหัสตกกลับไปใช้ชื่ออังกฤษ
 *    ⛔ ห้ามใช้ index ของอาเรย์เป็น key — การ์ดจะสลับที่กันเวลามีของใหม่แทรกเข้ามาข้างหน้า
 */
export function placeKey(place: UiPlaceRef): string {
  return place.code ?? place.labelEn;
}

/**
 * 🕒 **แสตมป์ราย "ชั้นข้อมูล" — ⛔ ไม่ใช่แสตมป์รวมของทั้งการ์ด** (เพิ่ม 31 ส.ค. 2026)
 *
 * 🔴 **ทำไมต้องแยก:** การ์ด 1 ใบถือของ 2 ชั้นที่ **สดไม่เท่ากัน** — อากาศสดทุกคำขอ ·
 *    ประกาศเตือนภัยเป็นสแนปช็อตติดวันที่ · แสตมป์ชุดเดียวเลยพูดแทนทั้งใบไม่ได้
 *    🔬 เห็นกับตาบนหน้าจริง 31 ส.ค.: การ์ดโชว์ PM2.5 สด ๆ แต่ติดป้าย `29 ส.ค. · cached copy`
 *       ⇒ ของสดดูเป็นของเก่า **และ** เครดิตค่าอากาศถูกยกไปให้กรมอุตุฯ ⇒ ผิดทั้ง 2 ทิศ
 * ⛔ **ชื่อแหล่งไม่แปล** — เป็นถ้อยคำที่ต้นทางกำหนด (`R14`)
 */
function LayerStamp({
  label,
  layer,
  stage,
  lang,
}: {
  label: string;
  layer: StampedLayer;
  stage: ChallengeStageCopy;
  lang: ChallengeLang;
}) {
  return (
    <p className="break-words text-xs text-muted">
      <span className="font-bold">{label}</span>{' '}
      {layer.observedAt ? new Date(layer.observedAt).toLocaleString(DATE_LOCALE[lang]) : stage.noTimestamp}
      {layer.source ? ` · ${layer.source}` : ''}
      {' · '}
      {/* 🔴 บอกตรง ๆ ว่าชั้นนี้สดหรือเป็นสำเนา ⛔ ไม่ใช่เงียบเมื่อมันสด */}
      <span className={layer.cached ? '' : 'font-bold'}>{layer.cached ? stage.cachedCopy : stage.liveCopy}</span>
    </p>
  );
}

export function Stamp({
  observedAt,
  source,
  cached,
  stage,
  lang,
}: {
  observedAt: string | null;
  source: string | null;
  cached: boolean;
  stage: ChallengeStageCopy;
  lang: ChallengeLang;
}) {
  /**
   * 🕒 **แสตมป์เวลา+แหล่ง ต้องอยู่ติดกับตัวเลขเสมอ** (มติ D-16)
   *    ตัวเลขคุณภาพอากาศที่ไม่มีเวลากำกับ คือตัวเลขที่ตรวจสอบไม่ได้ และอาจเก่าเป็นวัน
   * ⛔ **ชื่อแหล่ง (`source`) ไม่แปล** — เป็นถ้อยคำที่ต้นทางกำหนด (`R14`)
   */
  return (
    <p className="mt-2 text-xs text-muted">
      {observedAt ? new Date(observedAt).toLocaleString(DATE_LOCALE[lang]) : stage.noTimestamp}
      {source ? ` · ${source}` : ''}
      {cached ? ` · ${stage.cachedCopy}` : ''}
    </p>
  );
}

export function SnapshotCard({
  snap,
  stage,
  lang,
  highlighted,
  origin,
}: {
  snap: SnapshotEntry;
  stage: ChallengeStageCopy;
  lang: ChallengeLang;
  highlighted: boolean;
  /** ไม่ส่งมา = ไม่ติดป้ายที่มา (เหตุการณ์รุ่นเก่า/เทสเดิม) ⛔ ไม่ใช่เดาว่าเป็นของใคร */
  origin?: ReadingOrigin;
}) {
  /**
   * 🎨 **ป้ายระดับคุณภาพอากาศใช้ตัวช่วยของแอปจริง ⛔ ไม่สร้างเกณฑ์ชุดที่สอง**
   *    `getAqiStatus` มีทั้งเกณฑ์ 6 ระดับและป้ายครบ 5 ภาษาอยู่แล้ว และเป็น *ของเดิมก่อนงานแข่ง*
   *    ⇒ ตัวเลขบนหน้านี้กับตัวเลขในผลิตภัณฑ์จริง **แปลความเหมือนกันเป๊ะ**
   * ⚠️ อ่านไม่ได้ (`null`) ⇒ **ไม่มีป้าย** ⛔ ไม่ใช่ป้าย "ดีเยี่ยม" — ไม่รู้ ≠ อากาศดี
   */
  const aqi = snap.summary.aqi;
  const status = typeof aqi === 'number' ? getAqiStatus(aqi, lang) : null;

  /** ⛔ ชั้นที่ไม่มีข้อมูลจะไม่มีแสตมป์ — การ์ดต้องไม่ประกาศเวลาให้ของที่อ่านไม่ได้ */
  const layers: Array<{ key: string; label: string; layer: StampedLayer }> = [];
  if (snap.summary.layers?.air) {
    layers.push({ key: 'air', label: stage.layerAir, layer: snap.summary.layers.air });
  }
  if (snap.summary.layers?.alerts) {
    layers.push({ key: 'alerts', label: stage.layerAlerts, layer: snap.summary.layers.alerts });
  }

  return (
    <div
      className="lml-card p-6"
      /**
       * ✨ **ใบที่ agent เพิ่งแตะ ได้ขอบเน้น** — ใช้โทเคนสีของแอป ⛔ ห้าม hardcode ค่าสี ([[L-398]])
       *    ไม่ใส่ transition ที่จางหาย — ป้ายกับขอบต้องอยู่ให้ภาพนิ่ง/วิดีโอจับได้
       */
      style={highlighted ? { boxShadow: '0 0 0 2px var(--color-brand-strong)' } : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-widest text-muted">
          {stage.snapshotHeading}
          {/*
            🔴 **ป้ายที่มาอยู่ติดหัวการ์ด ⛔ ไม่ใช่ท้ายการ์ด** — ในภาพนิ่งที่มีการ์ดผสมกันหลายใบ
               คนอ่านต้องแยกออกทีละใบว่าใบไหนใครอ่าน โดยไม่ต้องไล่อ่านจนจบใบ
          */}
          {origin && (
            <span className="ml-2 normal-case tracking-normal opacity-80">
              · {origin === 'agent' ? stage.readByAgent : stage.readByPage}
            </span>
          )}
        </p>
        {highlighted && (
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            style={{ backgroundColor: 'var(--color-brand-strong)', color: 'var(--color-surface, #fff)' }}
          >
            {stage.justUpdated}
          </span>
        )}
      </div>
      <p className="mt-1 text-2xl font-bold text-ink">{placeLabel(snap.place, lang)}</p>

      <div className="mt-3 flex flex-wrap items-end gap-6">
        <div>
          <p className="text-xs text-muted">PM2.5</p>
          <p className="text-xl font-bold text-ink">{snap.summary.pm25 ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-muted">AQI</p>
          <div className="flex items-center gap-2">
            <p className="text-xl font-bold text-ink">{aqi ?? '—'}</p>
            {status && (
              <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${status.bg} ${status.text} ${status.border}`}>
                {status.label}
              </span>
            )}
          </div>
        </div>
        <div>
          <p className="text-xs text-muted">{stage.alertsLabel}</p>
          {/* 🔴 อ่านไม่ได้ ≠ ไม่มี — เขียนคนละอย่างเสมอ */}
          <p className="text-xl font-bold text-ink">
            {snap.summary.alertCount === null ? stage.couldNotRead : snap.summary.alertCount}
          </p>
        </div>
      </div>

      {snap.summary.topAlert && (
        <p className="mt-2 text-sm font-bold" style={{ color: 'var(--color-danger)' }}>
          {snap.summary.topAlert}
        </p>
      )}

      {snap.summary.gaps.length > 0 && (
        <p className="mt-3 text-sm text-muted">
          {stage.notAvailable}: {snap.summary.gaps.map((gap) => labelOf(stage.gaps, gap)).join(', ')}
        </p>
      )}

      {/*
        🕒 **มีแสตมป์รายชั้นเมื่อไร ใช้ตัวนั้น ⛔ ไม่ใช่แสตมป์รวม** — เหตุผลเต็มที่หัว `LayerStamp`
           ⚠️ ยังต้องมีทางตกกลับไปแสตมป์เดี่ยว เพราะเหตุการณ์รุ่นเก่า/เทสเดิมไม่ได้ส่งช่องนี้มา
              (ปล่อยว่างไปเลย = การ์ดไม่มีเวลากำกับ ซึ่งขัดมติ D-16 ที่บังคับว่าต้องมีทุกก้อน)
      */}
      {layers.length > 0 ? (
        <div className="mt-3 flex flex-col gap-0.5">
          {layers.map(({ key, label, layer }) => (
            <LayerStamp key={key} label={label} layer={layer} stage={stage} lang={lang} />
          ))}
        </div>
      ) : (
        <Stamp
          observedAt={snap.summary.observedAt}
          source={snap.summary.source}
          cached={snap.summary.cached}
          stage={stage}
          lang={lang}
        />
      )}
    </div>
  );
}
