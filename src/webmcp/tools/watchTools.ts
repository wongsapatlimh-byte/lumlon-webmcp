// src/webmcp/tools/watchTools.ts
// ────────────────────────────────────────────────────────────────────────────
// 🔔 **tools #4-#6 — `create_watch` · `list_watches` · `delete_watch`** (scope §5)
//
// 🔴 **นี่คือ tool ชุดเดียวที่ "ทำ" ไม่ใช่ "อ่าน"** ⇒ เป็นจุดที่โจทย์การแข่งขันวัดจริง:
//    ChatGPT มี **ด่านยืนยันผู้ใช้** ของตัวเองสำหรับการกระทำที่มีผล ⇒ เราต้องติดป้ายให้ถูก
//    (`readOnlyHint: false` · ลบติด `destructiveHint`) แล้วด่านนั้นจะเด้งเอง
//    ⛔ ติดป้ายผิด = agent ลบกฎเฝ้าของผู้ใช้โดยไม่ถาม ซึ่งเป็นบั๊กชนิดที่แก้ทีหลังไม่ได้
//
// ── 🧭 ที่เก็บกฎอยู่ไหน และทำไมไม่ผ่านชั้น provider ──
//   ชั้น provider ตอบว่า *"ข้อมูลสภาพแวดล้อมมาจากไหน"* · ส่วนกฎเฝ้าคือ **ของที่ผู้ใช้สร้างเอง**
//   ⇒ อยู่ที่ `watchStore` (เบราว์เซอร์) · วันที่ระบบส่งเตือนจริงของเลน B (`C-14`) พร้อม
//   **จุดสลับคือ `watchStore` ไฟล์เดียว** ⛔ ไม่ต้องแตะ tool ทั้ง 3 ตัวนี้เลย

import { defineTool, ToolError } from '../defineTool';
import { ProviderUnavailableError } from '../providers/errors';
import type { WebMCPDataProvider } from '../providers/types';
import { emitUi } from '../uiBridge';
import type { WebMCPTool } from '../types';
import {
  MAX_WATCHES,
  THRESHOLD_MAX,
  THRESHOLD_MIN,
  WATCH_METRICS,
  WatchRejected,
  createWatch,
  deleteWatch,
  listWatches,
  type WatchMetric,
} from '../watchStore';
import { EXAMPLE_PLACES, optionalEnum, requiredText, toPlaceRef } from './shared';

/**
 * 🗣️ **ประโยคที่ต้องติดไปกับทุกคำตอบของ tool ชุดนี้**
 *
 * ⛔ ห้ามตัดออกเพื่อประหยัดงบตัวอักษร — คำสัญญาเรื่องการเตือนภัยที่ผู้ใช้เข้าใจผิด
 *    คือความเสียหายที่ใหญ่กว่าผลลัพธ์ยาวเกินไป 20 ตัวอักษร
 *
 * ── 🔴 แก้ 1 ก.ย. 2026 — ประโยคเดิมเป็นคำเคลมที่ยังไม่จริง ──
 * ของเดิม: *"...; the production app delivers alerts over LINE."*
 * 🪤 **กับดักที่ต้องจำ:** คอมเมนต์ 4 บรรทัดข้างบน (ที่เขียนเพื่อ *กัน* คำสัญญาที่ทำให้เข้าใจผิด)
 *    **กลับกลายเป็นตัวค้ำประโยคที่ทำให้เข้าใจผิดเอาไว้เอง** — ใครมาอ่านจะเชื่อว่าเรื่องนี้คิดมาแล้ว
 *    ⇒ ลายเซ็นเดียวกับบทเรียน `alertsSnapshot.ts` / `watchStore.ts` (กติกาภายในค้ำคำเคลมเท็จ)
 *
 * 🔬 **วัดของจริงก่อนแก้ (⛔ ไม่ได้เชื่อความจำ — ความจำบอกว่า "ไม่มีทั้งเส้น" ซึ่งผิด):**
 *   ✅ `services/alerts/alertsWorker.js` **มีจริง** · ต่อกับ cron จริง (`cron.controller.js:729`)
 *      · route `/api/internal/cron/alerts-sweep` มีจริง · ช่องทางส่ง = `channel: 'line'` (`alertDelivery.js:147`)
 *   🔴 **แต่** `moduleRegistry.js:55` → `alerts: { default: 'off', failSafe: 'off' }`
 *      และหัว `alertsWorker.js` เขียนเองว่า *"วันที่ Cloud Scheduler ยิงเส้นนี้สำเร็จ **ขณะสวิตช์เปิด**
 *      = วันที่ข้อความออกไปหาผู้ใช้จริง"* ⇒ **ยังไม่เคยส่งจริงสักครั้ง**
 *   ⇒ *"delivers"* (ปัจจุบันกาล) จึงเป็นคำเคลมที่ **ยังไม่จริง** ⛔ ไม่ใช่แค่ "เกินไปนิดหน่อย"
 *   📌 คนละเรื่องกับตอนที่ถอดคำเคลมนี้ออกจากหน้าเว็บ+README ใน `558d5fc` — **ตรงนี้หลุดรอดมา**
 *      และร้ายกว่า เพราะมันอยู่ใน **คำตอบของ tool** ⇒ **agent หยิบไปพูดกับกรรมการได้เอง**
 * 🔴 กติกาที่บังคับข้อนี้อยู่แล้ว: storyboard §3 ตารางประโยคต้องห้าม —
 *    *«the app sends these alerts over LINE / over a messaging channel»* = ห้ามพูด
 */
const SCOPE_NOTE = 'Runs in this browser while the page is open. Close the page and it stops — nothing is stored on a server and no alert is sent anywhere else.';

function asNumber(input: unknown, field: string): number {
  const raw = input && typeof input === 'object' ? (input as Record<string, unknown>)[field] : undefined;
  const value = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw.trim()) : Number.NaN;
  if (!Number.isFinite(value)) {
    throw new ToolError(
      'invalid_threshold',
      `"${field}" must be a number between ${THRESHOLD_MIN} and ${THRESHOLD_MAX}, for example 75.`,
    );
  }
  return value;
}

export function createCreateWatchTool(provider: WebMCPDataProvider): WebMCPTool {
  return defineTool({
    name: 'create_watch',
    description:
      'Save a rule that watches one place and warns the person when a reading crosses their threshold, for example PM2.5 above 75. The rule shows up on screen straight away and is checked against live data while the page is open. Works for locations in Thailand (77 provinces).',
    inputSchema: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'Province name, or the 2-digit code from search_locations, e.g. "Chiang Mai" or "50".',
        },
        metric: { type: 'string', description: 'What to watch. Defaults to pm25.', enum: WATCH_METRICS },
        threshold: {
          type: 'number',
          description: 'Warn when the reading goes above this value.',
          minimum: THRESHOLD_MIN,
          maximum: THRESHOLD_MAX,
        },
      },
      required: ['location', 'threshold'],
      additionalProperties: false,
    },
    /**
     * 🔴 `readOnlyHint: false` **ต้องเขียนไว้ชัด ๆ** — นี่คือสิ่งที่บอก ChatGPT ให้เด้งด่านยืนยัน
     *    ผู้ใช้ก่อนบันทึก · ⛔ ไม่ติด `destructiveHint` เพราะการสร้างไม่ได้ทำลายอะไร
     *    (ติดมั่วจะทำให้ด่านยืนยันใช้ถ้อยคำน่ากลัวเกินจริง แล้วคนกดยกเลิกทั้งที่ตั้งใจจะสร้าง)
     */
    annotations: { readOnlyHint: false, untrustedContentHint: true },
    async execute(input, ctx) {
      const location = requiredText(input, 'location');
      const metric: WatchMetric = optionalEnum(input, 'metric', WATCH_METRICS, 'pm25');
      const threshold = asNumber(input, 'threshold');

      let hits;
      try {
        hits = await provider.searchLocations({ query: location, limit: 1, signal: ctx.signal });
      } catch (error) {
        if (error instanceof ProviderUnavailableError) {
          throw new ToolError('data_unavailable', `${error.message} Please try again in a moment.`);
        }
        throw error;
      }

      /**
       * 🔑 **fail-closed เต็มรูป** — หาสถานที่ไม่เจอ = ปฏิเสธทั้งคำสั่ง
       *    ⛔ ห้ามบันทึกกฎที่ผูกกับชื่อที่ระบบไม่รู้จัก เพราะมันจะไม่มีวันถูกประเมิน
       *    ⇒ ผู้ใช้จะคิดว่าตัวเองมีระบบเฝ้าอยู่ ทั้งที่ไม่มี (ความล้มเหลวแบบเงียบที่แย่ที่สุด)
       */
      if (!hits.length) {
        throw new ToolError(
          'unknown_location',
          `Unknown location "${location}" — this app covers Thailand (77 provinces). Try ${EXAMPLE_PLACES}.`,
        );
      }

      const place = toPlaceRef(hits[0]);
      let watch;
      try {
        watch = createWatch({ place, metric, threshold });
      } catch (error) {
        if (error instanceof WatchRejected) throw new ToolError(error.code, error.message);
        throw error;
      }

      emitUi({ type: 'watch.created', watchId: watch.id, place, metric, threshold: watch.threshold });

      return {
        watch_id: watch.id,
        place: { code: place.code, name_th: place.labelTh, name_en: place.labelEn },
        metric: watch.metric,
        threshold: watch.threshold,
        note: SCOPE_NOTE,
      };
    },
  });
}

export function createListWatchesTool(): WebMCPTool {
  return defineTool({
    name: 'list_watches',
    description:
      'List the watch rules saved in this browser, with the place, the metric, the threshold and when each rule last warned. Use it before delete_watch so the right rule gets removed. Covers rules created for locations in Thailand (77 provinces).',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, idempotentHint: true, untrustedContentHint: true },
    async execute() {
      const watches = listWatches();
      emitUi({ type: 'watch.listed', count: watches.length });

      return {
        count: watches.length,
        limit: MAX_WATCHES,
        watches: watches.map((watch) => ({
          watch_id: watch.id,
          place: { code: watch.place.code, name_en: watch.place.labelEn },
          metric: watch.metric,
          threshold: watch.threshold,
          last_triggered_at: watch.lastTriggeredAt,
        })),
        note: SCOPE_NOTE,
      };
    },
  });
}

export function createDeleteWatchTool(): WebMCPTool {
  return defineTool({
    name: 'delete_watch',
    description:
      'Delete one saved watch rule by its id. Call list_watches first to get the id. Removing a rule stops its warnings immediately. Works on rules created for locations in Thailand (77 provinces).',
    inputSchema: {
      type: 'object',
      properties: {
        watch_id: { type: 'string', description: 'The id returned by list_watches or create_watch.' },
      },
      required: ['watch_id'],
      additionalProperties: false,
    },
    /** 🔴 `destructiveHint` = ChatGPT เด้งด่านยืนยันแบบ "จะลบจริงไหม" ก่อนเสมอ */
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
    async execute(input) {
      const id = requiredText(input, 'watch_id');
      const removed = deleteWatch(id);

      /**
       * 🔑 **"ลบแล้ว" กับ "ไม่มีอยู่แต่แรก" ต้องแยกออกจากกัน** — agent ที่ได้ `deleted: true`
       *    ทั้งสองกรณีจะรายงานผู้ใช้ว่าลบสำเร็จ ทั้งที่กฎที่ผู้ใช้ตั้งใจลบอาจยังอยู่ (พิมพ์ id ผิด)
       */
      if (!removed) {
        throw new ToolError(
          'watch_not_found',
          `No watch with id "${id}". Call list_watches to see the ids that exist.`,
        );
      }

      emitUi({ type: 'watch.deleted', watchId: id });
      return { watch_id: id, deleted: true, remaining: listWatches().length };
    },
  });
}
