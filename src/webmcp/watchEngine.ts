// src/webmcp/watchEngine.ts
// ────────────────────────────────────────────────────────────────────────────
// ⏱️ **ตัวประเมินกฎเฝ้ากับข้อมูลสด** (`C4` ของ scope — ครึ่งหลังของ "watch engine จริง")
//
// 🔴 **ชิ้นนี้คือสิ่งที่ทำให้ `create_watch` ไม่ใช่ปุ่มหลอก:** ถ้ามีแค่ที่เก็บกฎ (`watchStore`)
//    เรามีแค่ "รายการที่สวยงาม" · ไฟล์นี้คือส่วนที่ทำให้วงจร **สร้าง → ประเมิน → เตือน** ปิดครบ
//    ⇒ ในวิดีโอ ช็อตแบนเนอร์เตือนเด้งเป็นของจริงที่เกิดเอง ⛔ ไม่ใช่ฉากจัด (มติ D-22)
//
// 🔑 **ประเมินทันทีที่มีกฎใหม่** — ไม่ใช่รอรอบถัดไป: คนที่เพิ่งสั่ง *"เตือนฉันถ้าฝุ่นเกิน 75"*
//    ในนาทีที่ค่าปัจจุบันคือ 88 ต้องได้คำเตือน **เดี๋ยวนั้น** ไม่ใช่อีก 1 นาที
//    (และนั่นคือสิ่งที่ทำให้เดโมน่าเชื่อโดยไม่ต้องตัดต่อ)

import type { WebMCPDataProvider } from './providers/types';
import { emitUi, subscribeUi } from './uiBridge';
import { listWatches, markTriggered, mayTrigger, type Watch } from './watchStore';

/**
 * ⏱️ **รอบประเมิน**
 * 🔑 ข้อมูลต้นทางเปลี่ยนเป็นรายชั่วโมง ⇒ ถี่กว่านี้ไม่ได้ข้อมูลใหม่ แต่กินโควตาต้นทาง
 *    ส่วนช้ากว่านี้ทำให้เดโม/ผู้ใช้จริงรู้ตัวช้าเกินไป · ชั้น provider มีแคชกันคำขอซ้ำอยู่แล้ว
 */
export const EVALUATE_INTERVAL_MS = 60_000;

export interface TriggerRecord {
  watch: Watch;
  observed: number;
}

function readingOf(
  snapshot: Awaited<ReturnType<WebMCPDataProvider['getEnvironmentSnapshot']>>,
  metric: Watch['metric'],
): number | null {
  const air = snapshot.air?.value;
  if (!air) return null;
  const value = metric === 'pm25' ? air.pm25 : air.aqi;
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * ประเมินทุกกฎ 1 รอบ
 *
 * ⚠️ **กฎใบหนึ่งพังต้องไม่หยุดใบที่เหลือ** — ถ้าจังหวัดหนึ่งอ่านข้อมูลไม่ได้ อีก 4 ใบยังต้องถูกตรวจ
 *    (ระบบเตือนภัยที่เงียบทั้งระบบเพราะจุดเดียวมีปัญหา = ระบบที่ไม่ควรมีอยู่)
 * ⚠️ **อ่านค่าไม่ได้ ⛔ ไม่ใช่ "ไม่เกินเกณฑ์"** — ไม่มีค่า = ไม่เตือน และ **ไม่ถือว่าปลอดภัย**
 *    (หน้าจอเป็นคนบอกสถานะ "อ่านข้อมูลไม่ได้" ผ่าน `gaps` ของ snapshot ตามปกติ)
 */
export async function evaluateWatchesOnce(
  provider: WebMCPDataProvider,
  now: Date = new Date(),
): Promise<TriggerRecord[]> {
  const fired: TriggerRecord[] = [];

  /**
   * 🔑 **จัดกลุ่มตามจังหวัดก่อน ⇒ ยิงต้นทาง 1 ครั้งต่อ 1 จังหวัด**
   *
   * 🔬 ผู้ตรวจชี้ (P2 · 29 ส.ค. 2026): ผู้ใช้ที่ตั้ง 3 กฎในจังหวัดเดียว (ฝุ่นเกิน 50 / 75 / 100)
   *    ทำให้รอบเดียวยิงข้อมูลจังหวัดนั้น 3 ครั้ง — เปล่าประโยชน์ล้วน ๆ เพราะเป็นข้อมูลชุดเดียวกัน
   *    ⚠️ และเป็นรูปแบบการใช้งานที่ **ปกติมาก** ไม่ใช่เคสมุม (คนตั้งหลายเกณฑ์ในที่เดียวกัน)
   */
  const byPlace = new Map<string, Watch[]>();
  for (const watch of listWatches()) {
    if (!watch.place.code) continue;
    const bucket = byPlace.get(watch.place.code);
    if (bucket) bucket.push(watch);
    else byPlace.set(watch.place.code, [watch]);
  }

  for (const [code, watches] of byPlace) {
    /**
     * ⚠️ **จังหวัดหนึ่งพังต้องไม่หยุดจังหวัดที่เหลือ** — ระบบเตือนภัยที่เงียบทั้งระบบ
     *    เพราะจุดเดียวมีปัญหา คือระบบที่ไม่ควรมีอยู่
     */
    let snapshot;
    try {
      snapshot = await provider.getEnvironmentSnapshot({ location: code });
    } catch (error) {
      console.warn(`[webmcp] อ่านข้อมูลของ ${code} ไม่สำเร็จ — ข้ามกฎของจังหวัดนี้รอบนี้`, error);
      continue;
    }

    for (const watch of watches) {
      try {
        const observed = readingOf(snapshot, watch.metric);
        if (observed === null) continue;
        if (observed <= watch.threshold) continue;
        if (!mayTrigger(watch, now)) continue;

        markTriggered(watch.id, now);
        emitUi({
          type: 'watch.triggered',
          watchId: watch.id,
          place: watch.place,
          metric: watch.metric,
          observed,
        });
        fired.push({ watch, observed });
      } catch (error) {
        console.warn(`[webmcp] ประเมินกฎ ${watch.id} ไม่สำเร็จ — ข้ามใบนี้ไปก่อน`, error);
      }
    }
  }

  return fired;
}

export interface WatchEngineOptions {
  provider: WebMCPDataProvider;
  intervalMs?: number;
}

/**
 * เริ่มเครื่องประเมิน — คืนฟังก์ชันหยุด (ใช้ตรง ๆ ใน `useEffect` cleanup ได้)
 *
 * 🪤 **กันรอบซ้อนกัน** — รอบก่อนยังไม่จบแล้วรอบใหม่เริ่ม จะยิงต้นทางซ้ำและอาจเตือนซ้ำ
 *    ⇒ มีธง `running` กันไว้ · ⛔ ห้ามใช้ `setInterval` เปล่า ๆ กับงานที่เป็น async
 */
export function startWatchEngine({ provider, intervalMs = EVALUATE_INTERVAL_MS }: WatchEngineOptions): () => void {
  let stopped = false;
  let running = false;
  let queued = false;

  /**
   * 🪤 **รอบซ้อนกันต้องถูก "เข้าคิว" ⛔ ไม่ใช่ "ทิ้ง"**
   *
   * 🔬 ผู้ตรวจชี้ (P1 · 29 ส.ค. 2026): เดิมเขียน `if (stopped || running) return;` เฉย ๆ
   *    ⇒ ถ้าผู้ใช้สร้างกฎใหม่**ตอนที่รอบก่อนยังรอ API อยู่** การประเมินทันทีจะถูกทิ้งเงียบ ๆ
   *    ⇒ ผิดคำสัญญาที่เขียนไว้บนหัวไฟล์เองว่า *"ต้องได้คำเตือนเดี๋ยวนั้น"* และเป็นจังหวะที่
   *      **เกิดง่ายที่สุดตอนสาธิต** (กด create แล้ว agent เรียก snapshot ต่อทันทีในวินาทีเดียวกัน)
   */
  const tick = async () => {
    if (stopped) return;
    if (running) {
      queued = true;
      return;
    }
    running = true;
    try {
      await evaluateWatchesOnce(provider);
    } finally {
      running = false;
    }
    if (queued && !stopped) {
      queued = false;
      await tick();
    }
  };

  void tick();
  const timer = setInterval(() => void tick(), intervalMs);

  /** ประเมินทันทีเมื่อมีกฎใหม่ — เหตุผลอยู่ที่หัวไฟล์ */
  const unsubscribe = subscribeUi((event) => {
    if (event.type === 'watch.created') void tick();
  });

  return () => {
    stopped = true;
    clearInterval(timer);
    unsubscribe();
  };
}
