// src/webmcp/challenge/AgentStage.tsx
// ────────────────────────────────────────────────────────────────────────────
// 🎭 **เวทีที่คนนั่งดู agent ทำงาน** — หัวใจของธีมการแข่งขัน
//
// 🔴 **โจทย์ของ WebMCP Challenge ไม่ใช่ "เว็บที่ agent เรียกได้" แต่คือ "คนกับ agent
//    ทำงานร่วมกันบนจอเดียว"** ⇒ ถ้า agent เรียก tool แล้วจอไม่ขยับ เราส่งแค่ API ที่บังเอิญ
//    มีหน้าตา · หน้านี้คือคำตอบว่า **คนเห็นอะไรในวินาทีที่ agent ลงมือ**
//
// 🔑 **หลักที่ยึดทั้งไฟล์: จอต้องไม่ดูสมบูรณ์กว่าความจริง**
//    · อ่านชั้นประกาศไม่ได้ ⇒ เขียนว่า *อ่านไม่ได้* ⛔ ไม่ใช่แสดงเลข 0
//    · ส่วนที่ขาด (`gaps`) ต้องขึ้นจอ ⛔ ไม่ใช่ซ่อนแล้วโชว์เฉพาะตัวเลขที่มี
//    · ทุกก้อนมีเวลา + แหล่ง ⇒ กรรมการตรวจคำตอบของ agent จากหน้าจอได้เอง
//
// ⛔ ไฟล์นี้อยู่ใต้ `src/webmcp/challenge/` = **ของตัวส่งแข่งเท่านั้น** ไม่มี route ในแอปจริง

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { CHALLENGE_COPY, challengeLangOf, type ChallengeStageCopy } from '@/webmcp/challenge/copy';
/**
 * 🃏 **การ์ดกับตัวช่วยถ้อยคำย้ายไปอยู่ที่ `SnapshotCard.tsx` แล้ว** (31 ส.ค. 2026)
 *    เหตุผลเต็มอยู่หัวไฟล์นั้น — สรุป: กระดาน `LiveBoard` ต้องวาดการ์ด **ใบเดียวกันเป๊ะ**
 *    ⛔ ห้ามก๊อปการ์ดกลับมาไว้ที่นี่ จะได้จอ 2 ที่ที่พูดคนละอย่างเมื่อกติกาแสดงผลเปลี่ยน
 */
import {
  SnapshotCard,
  labelOf,
  placeKey,
  placeLabel,
  type SnapshotEntry,
} from '@/webmcp/challenge/SnapshotCard';
import {
  subscribeUi,
  uiHistory,
  type UiEvent,
  type UiPlaceRef,
  type UiBriefingReason,
  type UiBriefingAdvice,
} from '../uiBridge';
import { listWatches, type Watch } from '../watchStore';

interface BriefingCard {
  place: UiPlaceRef;
  activity: string;
  level: string;
  /** เก็บทั้งก้อน (`code` + `values`) ⛔ ไม่ใช่เฉพาะประโยค — จอเป็นคนประกอบภาษาเอง */
  reasons: UiBriefingReason[];
  advice: UiBriefingAdvice[];
}

/** สีของระดับคำแนะนำ — ใช้โทเคนของแอป ⛔ ห้าม hardcode ค่าสี ([[L-398]]) */
const LEVEL_TOKEN: Record<string, string> = {
  good: 'var(--color-brand-strong)',
  caution: 'var(--color-warning)',
  avoid: 'var(--color-danger)',
  unknown: 'var(--color-muted)',
};

/**
 * 🗣️ **ประกอบประโยคเหตุผล/คำแนะนำในภาษาของผู้ใช้**
 *    ⛔ **ไม่มีแม่แบบ = คืนประโยค EN เดิม ⛔ ไม่ใช่คืนค่าว่าง** — เหตุผลที่หายไปจากจอ
 *       ทำให้จอดูสมบูรณ์กว่าความจริง ซึ่งเป็นสิ่งเดียวที่ทั้งไฟล์นี้พยายามป้องกัน
 *    🔑 ค่าที่มาจากกรมอุตุฯ (`event`) ถูกวางลงในแม่แบบตามรูปเดิม ⛔ ไม่แปล (`R14`)
 *    🪤 ตัวแทนค่าที่ไม่มีค่าส่งมา **คงรูป `{ชื่อ}` ไว้** ⛔ ไม่ลบทิ้งเงียบ ๆ — จะได้เห็นว่าลืมส่งอะไร
 */
function sentenceOf(
  templates: Readonly<Record<string, string>>,
  item: { code: string; detail: string; values?: Readonly<Record<string, string | number>> },
): string {
  const template = templates[item.code];
  if (!template) return item.detail;
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => {
    const value = item.values?.[key];
    return value === undefined || value === '' ? whole : String(value);
  });
}

/**
 * 🆚 **เวทีเก็บได้หลายแห่ง ⛔ ไม่ใช่ทับของเดิม** — จำนวนสูงสุดที่วางเทียบกันแล้วยังอ่านรู้เรื่อง
 *    เกินกว่านี้การ์ดจะเล็กจนตัวเลขอ่านไม่ออกบนมือถือ ⇒ ตัดของเก่าสุดทิ้ง ⛔ ไม่ใช่ย่อการ์ด
 */
const MAX_SNAPSHOTS = 3;

/**
 * 👁️ แปลงชื่อเหตุการณ์กฎเฝ้าระวัง → ถ้อยคำที่คนอ่านรู้เรื่อง
 * ⛔ คีย์ต้องตรงกับ `UiEvent.type` เป๊ะ — เพิ่มเหตุการณ์ใหม่แล้วลืมมาเติมที่นี่
 *    จะได้คำอ่านหยาบ ๆ จาก `labelOf` แทนที่จะหายไป (ตั้งใจให้เห็นว่ามีของใหม่)
 */
const WATCH_ACTION_KEYS = (stage: ChallengeStageCopy): Readonly<Record<string, string>> => ({
  'watch.created': stage.watchCreated,
  'watch.deleted': stage.watchRemoved,
  'watch.listed': stage.watchListed,
  'watch.triggered': stage.watchTriggered,
});

export default function AgentStage() {
  /**
   * 🌐 **เวทีต้องเดินตามปุ่มสลับภาษาเหมือนส่วนอื่นของหน้า** (แก้ 30 ส.ค. 2026)
   *    เดิมไฟล์นี้ฝังอังกฤษไว้ทั้งไฟล์ ⇒ กดไทยแล้วได้หน้าครึ่งไทยครึ่งอังกฤษ
   */
  const { lang } = useLanguage();
  const clang = challengeLangOf(lang);
  const stage = useMemo(() => CHALLENGE_COPY[clang].stage, [clang]);

  const [search, setSearch] = useState<{ query: string; places: UiPlaceRef[] } | null>(null);
  const [snapshots, setSnapshots] = useState<SnapshotEntry[]>([]);
  /** กุญแจของสถานที่ที่ agent แตะล่าสุด — ใช้ชี้ว่า "ใบไหนเพิ่งเปลี่ยน" ⛔ ไม่ใช่เวลาหมดอายุ */
  const [lastTouched, setLastTouched] = useState<string | null>(null);
  /**
   * 👁️ **กฎเฝ้าระวังต้องขึ้นเวทีด้วย** (แก้ 30 ส.ค. 2026)
   *    `watchAction` = สิ่งที่ agent เพิ่งทำกับกฎเฝ้า · `watches` = สภาพปัจจุบันที่อ่านจากที่เก็บจริง
   *    🔑 อ่านจาก `listWatches()` ⛔ ไม่ใช่สะสมจากเหตุการณ์เอง — ที่เก็บคือความจริง
   *       ถ้าสะสมเองแล้วพลาดไป 1 เหตุการณ์ จอจะโกหกไปตลอดโดยไม่มีใครรู้
   */
  const [watchAction, setWatchAction] = useState<string | null>(null);
  const [watches, setWatches] = useState<Watch[]>([]);
  const [briefing, setBriefing] = useState<BriefingCard | null>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    /**
     * 🪤 อ่านประวัติที่เกิดไปแล้วด้วย — component นี้ mount หลังจาก tool ทำงานได้
     *    (agent เรียก tool ตั้งแต่ก่อนคนเลื่อนมาถึงส่วนนี้ของหน้า) ⇒ ไม่อ่านย้อนหลัง = จอว่างทั้งที่มีของ
     */
    const replay = (event: UiEvent) => {
      if (event.type === 'search.results') setSearch({ query: event.query, places: event.places });
      if (event.type === 'snapshot.shown') {
        setLastTouched(placeKey(event.place));
        /**
         * 🆚 **เก็บหลายแห่งเพื่อให้เทียบกันได้บนจอ ⛔ ไม่ใช่ทับของเดิม**
         *    🔑 **ที่เดิมของแต่ละจังหวัดต้องไม่ขยับ** — ถ้า agent อ่านซ้ำที่เดิม (เช่นรีเฟรชค่า)
         *       แล้วการ์ดกระโดดมาข้างหน้า คนดูจะนึกว่าเป็นจังหวัดใหม่ ⇒ **อัปเดตในที่ ⛔ ไม่ย้าย**
         *    ⇒ ของใหม่จริง ๆ ต่อท้าย · เกิน `MAX_SNAPSHOTS` ตัดตัวเก่าสุด (ตัวหน้าสุด) ทิ้ง
         */
        setSnapshots((current) => {
          const entry: SnapshotEntry = { place: event.place, summary: event.summary };
          const key = placeKey(event.place);
          const at = current.findIndex((item) => placeKey(item.place) === key);
          if (at >= 0) {
            const next = [...current];
            next[at] = entry;
            return next;
          }
          return [...current, entry].slice(-MAX_SNAPSHOTS);
        });
      }
      /**
       * 🔴 **เหตุการณ์ตระกูลกฎเฝ้าระวัง — เดิมเวทีไม่เคยรับเลยสักตัว**
       *    ⇒ เครื่องมือฝั่งเขียนทั้ง 3 ตัวทำงานถูกต้องแต่ **มองไม่เห็นบนจอ**
       *    ⛔ อย่าเพิ่ม `event.type` ใหม่ในตระกูลนี้โดยไม่มาต่อที่นี่ — จะกลายเป็นบั๊กเงียบแบบเดิม
       */
      if (
        event.type === 'watch.created' ||
        event.type === 'watch.deleted' ||
        event.type === 'watch.listed' ||
        event.type === 'watch.triggered'
      ) {
        setWatchAction(event.type);
        setWatches(listWatches());
      }
      if (event.type === 'briefing.shown') {
        setBriefing({
          place: event.place,
          activity: event.activity,
          level: event.level,
          reasons: event.reasons,
          advice: event.advice,
        });
      }
    };

    const past = uiHistory();
    past.forEach(replay);
    setCount(past.length);

    return subscribeUi((event) => {
      replay(event);
      setCount((value) => value + 1);
    });
  }, []);

  if (count === 0) {
    return (
      <div className="lml-card p-6 text-center">
        <p className="font-bold text-ink">{stage.emptyTitle}</p>
        <p className="mt-2 text-sm text-muted">{stage.emptyBody}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {briefing && (
        <div className="lml-card p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-muted">
            {stage.briefingHeading} · {labelOf(stage.activities, briefing.activity)}
          </p>
          <p className="mt-1 text-2xl font-bold text-ink">{placeLabel(briefing.place, clang)}</p>
          <p className="mt-2 text-lg font-bold" style={{ color: LEVEL_TOKEN[briefing.level] ?? LEVEL_TOKEN.unknown }}>
            {labelOf(stage.levels, briefing.level)}
          </p>
          <ul className="mt-3 flex flex-col gap-1 text-sm text-muted">
            {briefing.reasons.map((reason) => sentenceOf(stage.reasons, reason)).map((reason) => (
              <li key={reason}>· {reason}</li>
            ))}
          </ul>
          {briefing.advice.length > 0 && (
            <p className="mt-3 text-sm font-bold text-ink">
              {briefing.advice.map((item) => sentenceOf(stage.reasons, item)).join(' ')}
            </p>
          )}
        </div>
      )}

      {snapshots.length > 0 && (
        <div className="flex flex-col gap-3">
          {snapshots.length > 1 && (
            <p className="text-xs font-bold uppercase tracking-widest text-muted">
              {stage.compareHeading.replace('{count}', String(snapshots.length))}
            </p>
          )}
          <div className={snapshots.length > 1 ? 'grid gap-4 sm:grid-cols-2' : 'flex flex-col'}>
            {snapshots.map((snap) => (
              <SnapshotCard
                key={placeKey(snap.place)}
                snap={snap}
                stage={stage}
                lang={clang}
                /** ใบเดียวไม่ต้องเน้น — ไม่มีอะไรให้เทียบว่า "ใบไหนเปลี่ยน" */
                highlighted={snapshots.length > 1 && placeKey(snap.place) === lastTouched}
                /**
                 * 🏷️ **ทุกใบบนเวทีนี้มาจาก `uiBridge` ⇒ เป็นของ agent เสมอ**
                 *    ⛔ ห้ามส่งค่าอื่นแม้จะดูสมเหตุสมผล — เวทีนี้รับเฉพาะเหตุการณ์ของ tool
                 *    และ tool ถูกเรียกได้จาก agent เท่านั้น (หน้าเว็บเรียก provider ตรง ๆ)
                 */
                origin="agent"
              />
            ))}
          </div>
        </div>
      )}

      {watchAction && (
        <div className="lml-card p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-muted">
            {stage.watchHeading} · {labelOf(WATCH_ACTION_KEYS(stage), watchAction)}
          </p>
          {watches.length === 0 ? (
            <p className="mt-2 text-sm text-muted">{stage.watchNone}</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {watches.map((watch) => (
                <li key={watch.id} className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-ink">{placeLabel(watch.place, clang)}</span>
                  <span className="text-muted">
                    {watch.metric.toUpperCase()} {stage.watchAbove} {watch.threshold}
                  </span>
                  <span className="text-xs text-muted opacity-70">{watch.id}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {search && (
        <div className="lml-card p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-muted">
            {stage.searchHeading} · “{search.query}”
          </p>
          {search.places.length === 0 ? (
            <p className="mt-2 text-sm text-muted">{stage.noMatch}</p>
          ) : (
            <ul className="mt-2 flex flex-wrap gap-2 text-sm">
              {search.places.map((place) => (
                <li key={`${place.code}-${place.labelEn}`} className="lml-note lml-note-info px-3 py-1">
                  {place.labelEn} · {place.labelTh}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
