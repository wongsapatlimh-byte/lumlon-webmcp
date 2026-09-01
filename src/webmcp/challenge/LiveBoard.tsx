// src/webmcp/challenge/LiveBoard.tsx
// ────────────────────────────────────────────────────────────────────────────
// 📊 **กระดานของจริงที่ขึ้นตั้งแต่เปิดหน้า + ช่องค้นหาที่คนกดเองได้ — ⛔ ไม่ต้องรอ agent**
//
// 🔴 **ทำไมต้องมี (เจ้าของทัก 31 ส.ค. 2026 ว่า «มันดูไม่มีอะไรเลย»)**
//    หน้านี้เดิมออกแบบให้ *เวทีว่างไว้รอ agent* ⇒ คนที่เปิดมาโดยไม่มี agent **เห็นศูนย์**
//    และกติกา `R11` เขียนไว้ตรง ๆ ว่า **กรรมการตัดสินจากข้อความ/ภาพ/วิดีโอโดยไม่กดลองก็ได้**
//    ⇒ ภาพนิ่งของหน้าแรกที่ว่างเปล่า อาจเป็น *ทั้งหมด* ที่กรรมการเห็น
//    ⇒ เกณฑ์ `Execution` ใช้ถ้อยคำว่า «not just a technical proof of concept» ซึ่งเป็นสิ่งที่
//      หน้าที่มีแต่คู่มือกับกล่องว่าง **อ่านออกมาเป็นเป๊ะ ๆ**
//
// 🔑 **และมีเหตุผลข้อที่ 2 ที่หนักกว่า — เกณฑ์ `WebMCP Leverage`:**
//    เวทีที่ว่างเปล่า **พิสูจน์ไม่ได้ว่า WebMCP เพิ่มอะไรเข้ามา** เพราะไม่มีสภาพ *"ก่อน"* ให้เทียบ
//    ⇒ ต้องมีแอปที่ทำงานอยู่ก่อน แล้ว agent เข้ามาขับมันได้ ⇒ ถึงจะเห็นว่าได้อะไรเพิ่ม
//
// 🔴 **เส้นแบ่งที่ห้ามเบลอ — ของที่เพิ่มมาต้องไม่ทำลายคำมั่นของหน้านี้:**
//    ① ค่าที่กระดานนี้อ่าน **หน้าเว็บ/ผู้ใช้เป็นคนอ่าน** ⛔ **ห้ามนับเป็นผลงานของ agent**
//       ⇒ กระดานนี้ **ไม่ยิง `emitUi`** แม้แต่ครั้งเดียว · เวที «สิ่งที่ agent เพิ่งทำ» ต้องว่าง
//         อยู่จนกว่า agent จะลงมือจริง ไม่งั้นเราโกหกเรื่องเดียวที่หน้านี้ขายอยู่
//       ⛔ **และห้ามให้หน้าเว็บเรียก `execute` ของ tool เด็ดขาด** — วินาทีที่ทำ ป้ายบอกที่มา
//         จะแยกไม่ออก และเราจะไม่มีทางรู้ว่าเริ่มโกหกตั้งแต่เมื่อไร ⇒ เรียก `provider` ตรง ๆ เท่านั้น
//    ② กล่องลอยบนแผนที่บอกทุกครั้งว่าใบนี้ **หน้าเว็บอ่าน** หรือ **agent อ่าน**
//    ③ ใช้ `summarizeSnapshot` + `SnapshotCard` **ตัวเดียวกับที่ tool ใช้**
//       ⇒ ตัวเลขบนกระดานกับตัวเลขที่ agent อ่าน **มาจากทางเดียวกันทั้งเส้น**
//
// 🪤 **ยิงกี่คำขอ:** เปิดหน้า = 3 คำขอ · กดอ่านเองอีก 1 คำขอต่อครั้ง
//    เพดานของเส้นในตัวคือ 30 คำขอ/นาที/ผู้ใช้ (`challenge/api/environment/route.ts`)
//    ⛔ **ห้ามเพิ่มเป็น 77 จังหวัดเพื่อระบายสีทั้งแผนที่** — ทั้งชนเพดานและเป็นการโกหก
//    ⛔ **ห้ามใส่ auto-refresh** — ตัวส่งแข่งต้องอยู่ได้ 3 สัปดาห์บนโควตาฟรีของ Open-Meteo
//       ⇒ ยิงต่อ *การกระทำ* เท่านั้น (เปิดหน้า / กดปุ่ม / agent เรียก)
//
// 🔴 **ทุก import ต้องเป็น `@/...` ⛔ ห้าม relative** (ด่าน `RELATIVE_IN_SUBSTITUTED`)

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { CHALLENGE_COPY, challengeLangOf } from '@/webmcp/challenge/copy';
/**
 * 🔀 **ต้องเป็น `providers/active` ⛔ ห้ามเป็น `challenge/activeProvider`** (เจอจริง 31 ส.ค. 2026)
 *    `challenge/activeProvider.ts` คือไฟล์ที่ตัวถ่ายสำเนา **ย้ายไปทับ** `providers/active.ts`
 *    ⇒ ใน repo สาธารณะ path เดิม **ไม่มีอยู่** ⇒ `npm run build` ของ clone ล้มด้วย module-not-found
 *    🔬 `tsc` + `jest` + `next build` ในเครื่อง **เขียวหมดทั้ง 3 ตัว** เพราะในทรีเรา path นั้นมีจริง
 *       ⇒ มีแต่ด่าน clone เท่านั้นที่จับได้ · ตอนนี้มีด่าน `IMPORT_OF_SUBSTITUTION_SOURCE` แล้ว ([[L-481]])
 */
import { createActiveProvider } from '@/webmcp/providers/active';
import { provinceByCode } from '@/webmcp/challenge/provinces';
import { SnapshotCard, placeKey } from '@/webmcp/challenge/SnapshotCard';
import ThailandMap, { type MapReading } from '@/webmcp/challenge/ThailandMap';
import type { LocationHit } from '@/webmcp/providers/types';
import { summarizeSnapshot } from '@/webmcp/tools/shared';
import { subscribeUi, uiHistory, type UiEvent } from '@/webmcp/uiBridge';

/**
 * 🇹🇭 **3 จังหวัดที่หน้าเว็บอ่านเองตอนเปิด**
 *
 * 🔑 เลือกจาก **การกระจายตัวบนแผนที่ ⛔ ไม่ใช่ความสำคัญของเมือง** — เหนือ/กลาง/ใต้
 *    ⇒ หมุดที่ติดสีตั้งแต่วินาทีแรกจะกระจายทั่วประเทศ ทำให้รูปร่างแผนที่อ่านออกทันที
 *    (เชียงใหม่ยังเป็นจังหวัดที่เรื่องฝุ่นเป็นข่าวจริงทุกปี ⇒ ตรงกับปัญหาที่ผลงานนี้พูดถึง)
 */
const SEED_CODES = ['50', '10', '83'] as const;

/** จำนวนประกาศที่ *agent* ได้เห็น — ต้องเป็นเลขเดียวกับที่ `get_environment_snapshot` ใช้ */
const MAX_ALERTS = 2;

/**
 * 🃏 การ์ดสูงสุดบนกระดาน — เกินกว่านี้ต้องเลื่อนจอนานจนแผนที่หลุดสายตา
 *    ⇒ ของใหม่เข้า ของเก่าสุดออก (แบบเดียวกับ `MAX_SNAPSHOTS` ของเวที agent)
 */
const MAX_CARDS = 4;

interface BoardCard {
  code: string;
  reading: MapReading | null;
  /** อ่านไม่สำเร็จ = ต้องเขียนบนจอ ⛔ ไม่ใช่ซ่อนการ์ดทิ้งแล้วทำเหมือนไม่เคยตั้งใจอ่าน */
  failed: boolean;
}

export default function LiveBoard() {
  const { lang } = useLanguage();
  const clang = challengeLangOf(lang);
  const copy = useMemo(() => CHALLENGE_COPY[clang], [clang]);

  const [cards, setCards] = useState<BoardCard[]>(() =>
    SEED_CODES.map((code) => ({ code, reading: null, failed: false })),
  );
  const [agentReadings, setAgentReadings] = useState<MapReading[]>([]);
  const [focusedCode, setFocusedCode] = useState<string | null>(null);
  const [searchCodes, setSearchCodes] = useState<string[]>([]);

  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<LocationHit[] | null>(null);
  const [busyCode, setBusyCode] = useState<string | null>(null);

  /** ⛔ provider ตัวเดียวตลอดอายุคอมโพเนนต์ — สร้างใหม่ทุกเรนเดอร์คือการทิ้งของฟรี ๆ */
  const providerRef = useRef(createActiveProvider());
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  /**
   * 📡 **อ่านค่า 1 จังหวัด — ทางเดียวกับที่ tool ใช้ทุกประการ**
   *
   * 🪤 **ต้องมี `aliveRef` ⛔ ไม่ใช่ `setState` ดิบ ๆ ตอน promise กลับมา** — หน้านี้ถูกเรนเดอร์
   *    ในเทสด้วย และผู้ใช้ปิดแท็บกลางคันได้เสมอ ⇒ เขียน state หลัง unmount = คำเตือนที่กลบของจริง
   */
  const readProvince = useCallback(async (code: string) => {
    setBusyCode(code);
    setCards((current) => {
      if (current.some((card) => card.code === code)) return current;
      return [...current, { code, reading: null, failed: false }].slice(-MAX_CARDS);
    });

    try {
      const snapshot = await providerRef.current.getEnvironmentSnapshot({ location: code });
      if (!aliveRef.current) return;
      const reading: MapReading = {
        place: { code: snapshot.place.code, labelTh: snapshot.place.nameTh, labelEn: snapshot.place.nameEn },
        summary: summarizeSnapshot(snapshot, MAX_ALERTS),
        /**
         * 🏷️ **ฟังก์ชันนี้ติดป้าย `'page'` เสมอ ⛔ ไม่รับเป็นพารามิเตอร์**
         *    เพราะมันคือเส้นทางที่ **หน้าเว็บ/ผู้ใช้** เป็นคนเรียกเท่านั้น (เปิดหน้า หรือกดปุ่ม)
         *    ค่าของ agent เข้ามาทาง `uiBridge` คนละเส้นทางโดยสิ้นเชิง
         *    ⛔ **ห้ามเปิดให้ส่ง `'agent'` เข้ามาที่นี่** — วันที่ทำ ป้ายจะเชื่อถือไม่ได้ทันที
         *       เพราะมันจะกลายเป็น *สิ่งที่ผู้เรียกอ้าง* แทนที่จะเป็น *ผลของเส้นทางโค้ด*
         */
        origin: 'page',
      };
      setCards((current) =>
        current.map((card) => (card.code === code ? { ...card, reading, failed: false } : card)),
      );
      setFocusedCode(snapshot.place.code ?? code);
    } catch {
      if (!aliveRef.current) return;
      setCards((current) => current.map((card) => (card.code === code ? { ...card, failed: true } : card)));
    } finally {
      if (aliveRef.current) setBusyCode(null);
    }
  }, []);

  /** 📡 หน้าเว็บอ่าน 3 จังหวัดเองตอน mount — ⛔ ไม่ยิงซ้ำหลังจากนั้น (ดูข้อห้าม auto-refresh ที่หัวไฟล์) */
  useEffect(() => {
    for (const code of SEED_CODES) void readProvince(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * 🎭 **เกาะเหตุการณ์เดียวกับเวที agent — แต่เอาไปใช้คนละอย่าง**
   *    เวทีตอบว่า *"agent ทำอะไร"* · แผนที่ตอบว่า *"เรื่องนั้นเกิดที่ไหนบนประเทศไทย"*
   *    ⛔ ห้ามยิง `emitUi` กลับจากที่นี่ — จะกลายเป็นเสียงสะท้อนที่เวทีนับเป็นผลงาน agent
   */
  useEffect(() => {
    const replay = (event: UiEvent) => {
      if (event.type === 'search.results') {
        setSearchCodes(event.places.map((place) => place.code).filter((code): code is string => Boolean(code)));
      }
      if (event.type === 'snapshot.shown') {
        const reading: MapReading = { place: event.place, summary: event.summary, origin: 'agent' };
        setAgentReadings((current) => {
          const key = placeKey(event.place);
          const at = current.findIndex((item) => placeKey(item.place) === key);
          if (at >= 0) {
            const next = [...current];
            next[at] = reading;
            return next;
          }
          return [...current, reading];
        });
        /** agent แตะที่ไหน กล้องไปที่นั่น — นี่คือ "จอขยับตามการใช้งาน" ที่เจ้าของสั่ง */
        if (event.place.code) setFocusedCode(event.place.code);
      }
      if (event.type === 'watch.triggered' && event.place.code) setFocusedCode(event.place.code);
    };

    uiHistory().forEach(replay);
    return subscribeUi(replay);
  }, []);

  /**
   * 🔍 **ค้นหาสำหรับ *คน* — ฟังก์ชันบริสุทธิ์ ไม่ยิงเน็ตเลยสักคำขอ**
   *    ทะเบียน 77 จังหวัดเดินทางไปกับ repo ⇒ ค้นได้แม้ต้นทางทั้งโลกล่ม
   *    ⛔ และคำค้นไม่เคยออกจากเบราว์เซอร์ ⇒ ไม่มีเรื่องความเป็นส่วนตัวให้ต้องอธิบาย
   */
  const onSearch = useCallback(
    async (raw: string) => {
      setQuery(raw);
      const text = raw.trim();
      if (!text) {
        setHits(null);
        return;
      }
      const found = await providerRef.current.searchLocations({ query: text, limit: 6 });
      if (aliveRef.current) setHits(found);
    },
    [],
  );

  /**
   * 🗺️ ค่าที่แผนที่ใช้ — **ของ agent ทับของหน้าเว็บ** เมื่อเป็นจังหวัดเดียวกัน
   *    เพราะของ agent ใหม่กว่าเสมอ (มันเพิ่งยิงเมื่อกี้) และป้ายบนกล่องต้องบอกว่าใครอ่าน
   */
  const mapReadings = useMemo(() => {
    const merged = new Map<string, MapReading>();
    for (const card of cards) {
      if (card.reading?.place.code) merged.set(card.reading.place.code, card.reading);
    }
    for (const reading of agentReadings) {
      if (reading.place.code) merged.set(reading.place.code, reading);
    }
    return [...merged.values()];
  }, [cards, agentReadings]);

  return (
    <section aria-label={copy.live.heading} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted">{copy.live.heading}</h2>
        <p className="text-xs text-muted">{copy.live.sub}</p>
      </div>

      {/*
        🛡️ **`min-w-0` ที่ลูกของ grid ทุกตัว — ของกันไว้ ⛔ ไม่ใช่การแก้บั๊กที่เคยเกิด**
           ลูกของ grid มีค่าตั้งต้น `min-width: auto` ⇒ กว้างตามเนื้อหาที่หดไม่ได้
           (ช่องค้นหามีความกว้างขั้นต่ำในตัว · ชื่อแหล่งยาว ๆ ที่ไม่มีที่ให้ตัดคำ)
           ⇒ ถ้าวันหนึ่งมีของแบบนั้นโผล่มา มันจะดัน `main` ทั้งก้อนจนหน้าถูกตัดขอบขวา **ทั้งหน้า**

        🔬 **บันทึกความผิดพลาดของผมเอง (31 ส.ค. 2026) — เขียนไว้กันคนหลังหลงทางซ้ำ:**
           รอบแรกผมสรุปว่า *"เจอบั๊กล้นขอบจริงที่ 390px"* จากภาพจับหน้าจอ **ซึ่งผิด**
           `msedge --headless` (ทั้งโหมดใหม่และเก่า) **บังคับความกว้างหน้าต่างขั้นต่ำราว 500px**
           ⇒ สั่ง `--window-size=390` ได้ภาพกว้าง 390 แต่ **หน้าถูกจัดผังที่ ~500** ⇒ ภาพคือการ *ครอบตัด*
             ⛔ ไม่ใช่เนื้อหาล้น · ทุกบล็อกดูโดนตัดขอบขวาเท่ากันหมด ซึ่งเป็นลายเซ็นของการครอบตัด
           ✅ **วิธีวัดที่เชื่อได้:** ฝังหน้าไว้ใน `<iframe width="390">` แล้วถ่ายจากหน้าต่างที่ใหญ่กว่า
             — iframe ให้ viewport กว้าง 390 จริง ⇒ วัดแล้วหน้านี้ **ลงตัวพอดี ไม่มีอะไรล้น**
      */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-3">
          <ThailandMap
            readings={mapReadings}
            focusedCode={focusedCode}
            searchCodes={searchCodes}
            lang={clang}
            copy={copy.live.map}
            stage={copy.stage}
          />

          {/*
            🔍 **ช่องค้นหาสำหรับคน — อยู่ใต้แผนที่โดยตั้งใจ**
               🔴 เหตุผลที่ต้องมี: กรรมการที่เปิดด้วยเบราว์เซอร์ธรรมดา (ไม่มี agent) ต้อง
                  **ใช้ผลิตภัณฑ์นี้ได้จริง** ⛔ ไม่ใช่ได้แค่อ่านคู่มือว่าถ้ามี agent จะทำอะไรได้
                  ⇒ ปุ่มเดียวกันนี้ทำให้เห็นว่า *เครื่องมือชุดเดียวกัน มีคนขับได้ 2 คน*
          */}
          <div className="lml-card p-4">
            <label className="text-xs font-bold uppercase tracking-widest text-muted" htmlFor="lml-province-search">
              {copy.live.searchHeading}
            </label>
            <input
              id="lml-province-search"
              type="search"
              value={query}
              onChange={(event) => void onSearch(event.target.value)}
              placeholder={copy.live.searchPlaceholder}
              /** `min-w-0` + `w-full`: ช่อง input มีความกว้างขั้นต่ำในตัวเอง ⇒ ต้องกดให้หดได้ ไม่งั้นมันดันทั้งหน้า */
              className="mt-2 w-full min-w-0 rounded-lg border border-line bg-transparent px-3 py-2 text-sm text-ink outline-none focus:border-ink"
            />

            {hits !== null && (
              <div className="mt-3">
                {hits.length === 0 ? (
                  /** ⛔ ไม่เจอ = บอกว่าไม่เจอ ⛔ ไม่ใช่เงียบแล้วปล่อยให้เดาว่าช่องค้นหาพัง */
                  <p className="text-sm text-muted">{copy.live.searchNone}</p>
                ) : (
                  <ul className="flex flex-wrap gap-2">
                    {hits.map((hit) => (
                      <li key={`${hit.code}-${hit.nameEn}`}>
                        <button
                          type="button"
                          /** ⛔ ไม่มีรหัสจังหวัด = อ่านค่าไม่ได้ ⇒ ปิดปุ่มไปเลย ดีกว่ากดแล้วเงียบ */
                          disabled={!hit.code || busyCode === hit.code}
                          onClick={() => hit.code && void readProvince(hit.code)}
                          className="lml-note lml-note-info px-3 py-1 text-sm text-ink disabled:opacity-50"
                        >
                          {clang === 'TH' ? hit.nameTh || hit.nameEn : hit.nameEn}
                          <span className="ml-2 text-xs text-muted">
                            {busyCode === hit.code ? copy.live.loading : copy.live.readNow}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <p className="mt-3 text-xs text-muted">{copy.live.searchNote}</p>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          {cards.map((card) => {
            if (card.reading) {
              return (
                <SnapshotCard
                  key={card.code}
                  snap={card.reading}
                  stage={copy.stage}
                  lang={clang}
                  highlighted={card.reading.place.code === focusedCode}
                  origin={card.reading.origin}
                />
              );
            }

            /**
             * 🔴 **ยังไม่มีค่า ⇒ บอกว่ากำลังอ่าน หรือ อ่านไม่สำเร็จ**
             *    ⛔ ห้ามซ่อนการ์ดเงียบ ๆ — คนดูจะไม่มีทางรู้ว่าหน้าเว็บ *ตั้งใจ* จะโชว์อะไรตรงนี้
             *    และนี่คือหลักเดียวกับที่ทั้งหน้านี้ยึด: ขาดอะไรต้องเขียนว่าขาด
             */
            const province = provinceByCode(card.code);
            const name = province ? (clang === 'TH' ? province.th : province.en) : card.code;
            return (
              <div key={card.code} className="lml-card p-6">
                <p className="text-xs font-bold uppercase tracking-widest text-muted">{copy.stage.snapshotHeading}</p>
                <p className="mt-1 text-2xl font-bold text-ink">{name}</p>
                <p className="mt-2 text-sm text-muted">{card.failed ? copy.live.failed : copy.live.loading}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
