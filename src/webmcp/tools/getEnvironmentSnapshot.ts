// src/webmcp/tools/getEnvironmentSnapshot.ts
// ────────────────────────────────────────────────────────────────────────────
// 🛰️ **tool #2 — `get_environment_snapshot`** (scope §5 · ตัวหลักของชุด)
//
// 🔑 **ทำไมยุบ 3 tool อ่านเดิมเป็นตัวเดียว (มติ D-12 ตาม Codex):** agent ที่มีเมนู 3 อย่าง
//    (`get_air_quality` / `get_weather_forecast` / `get_active_hazards`) ต้องเดาว่าคำถามนี้
//    ใช้ตัวไหน แล้วมักเรียกครบทั้ง 3 ⇒ ช้ากว่า เปลือง context กว่า และเลือกผิดบ่อยกว่า
//    การให้ "ข้อเท็จจริงรวมของตำแหน่ง+เวลา" ในการเรียกครั้งเดียว
//
// 🔴 **fail-open ฝั่งอ่าน (หลัก §5 ของ scope):** ส่วนไหนขาดให้บอกใน `gaps` แล้วตอบส่วนที่มี
//    ⛔ ห้ามล้มทั้งคำตอบเพราะตัวเลขประกอบตัวเดียว — คนถามว่า "พรุ่งนี้พาลูกไปสวนได้ไหม"
//    ไม่ได้ถามค่า PM2.5 และการเงียบเพราะขาดตัวเลขหนึ่งตัวคือการไม่ตอบคำถามที่เขาถามจริง

import { defineTool, ToolError } from '../defineTool';
import { ProviderUnavailableError } from '../providers/errors';
import type { WebMCPDataProvider } from '../providers/types';
import { emitUi } from '../uiBridge';
import type { WebMCPTool } from '../types';
import { EXAMPLE_PLACES, capList, clip, requiredText, summarizeSnapshot, toPlaceRef } from './shared';

/**
 * ประกาศเตือนภัยที่ส่งให้ agent สูงสุด
 *
 * 🔬 **ตัวเลขนี้วัดมา ไม่ได้เดา** (29 ส.ค. 2026): เดิมตั้ง 3 แล้วเทสกรณีแย่ที่สุดออกมา
 *    **1,866 ตัวอักษร** เกินงบ 1.5K ⇒ ลดเหลือ 2 · **จำนวนที่ถูกตัดยังถูกรายงานใน `omitted`**
 *    ⇒ agent รู้ว่ายังมีอีก และเรียกดูจอต่อได้ ⛔ ไม่ใช่การซ่อน
 */
const MAX_ALERTS = 2;

/** ความยาวหัวข้อประกาศ — CAP บางฉบับยาวเป็นย่อหน้า */
const HEADLINE_CHARS = 100;

/** ชื่อเหตุการณ์ — ยาวกว่านี้คือคำอธิบาย ไม่ใช่ชื่อ */
const EVENT_CHARS = 60;

/** คำบรรยายสภาพอากาศต่อ 1 ช่วงเวลา */
const SUMMARY_CHARS = 60;

/**
 * จำนวนช่วงพยากรณ์
 * 🔬 วัดแล้ว: กรณีที่มีครบทั้งอากาศ+พยากรณ์+ประกาศ ยังเกินงบอยู่ 33 ตัวอักษรที่ 4 ช่วง
 *    ⇒ ตัดที่พยากรณ์ ⛔ ไม่ตัดที่ประกาศเตือนภัย — เมื่อต้องเลือก **ข้อความความปลอดภัยชนะเสมอ**
 */
const MAX_FORECAST_POINTS = 3;

export function createGetEnvironmentSnapshotTool(provider: WebMCPDataProvider): WebMCPTool {
  return defineTool({
    name: 'get_environment_snapshot',
    description:
      'Read the current environment for one place: air quality, short forecast, and official hazard alerts. Every block carries the time it was observed and the source it came from, and anything missing is listed in "gaps" rather than hidden. Hazard alerts come from a dated snapshot: each one carries its own "expires" time, so check it before calling an alert current. Works for locations in Thailand (77 provinces).',
    inputSchema: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'Province name, or the 2-digit code from search_locations, e.g. "Chiang Mai" or "50".',
        },
      },
      required: ['location'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, idempotentHint: true, untrustedContentHint: true },
    async execute(input, ctx) {
      const location = requiredText(input, 'location');

      let snapshot;
      try {
        snapshot = await provider.getEnvironmentSnapshot({ location, signal: ctx.signal });
      } catch (error) {
        if (error instanceof ProviderUnavailableError && error.part === 'location') {
          /**
           * 🔑 **ข้อความ error ต้องมีทางไปต่อ** — agent อ่านแล้วเรียก `search_locations` เองได้ทันที
           *    โดยไม่ต้องกลับไปถามผู้ใช้ว่า "หมายถึงจังหวัดอะไร"
           */
          throw new ToolError(
            'unknown_location',
            `Unknown location "${location}" — this app covers Thailand (77 provinces). Call search_locations first, or try ${EXAMPLE_PLACES}.`,
          );
        }
        if (error instanceof ProviderUnavailableError) {
          throw new ToolError('data_unavailable', `${error.message} Please try again in a moment.`);
        }
        throw error;
      }

      const alerts = snapshot.alerts;
      const capped = alerts ? capList(alerts.value, MAX_ALERTS) : { shown: [], omitted: 0 };

      /**
       * 🖥️ **จอต้องเห็นสิ่งเดียวกับที่ agent เพิ่งอ่าน** (`B4`) — รวม *สิ่งที่ขาด* ด้วย
       *    ⛔ ส่งเฉพาะตัวเลขที่มีไปให้จอ = จอจะดูสมบูรณ์กว่าความจริง ซึ่งเป็นการโกหกคนที่นั่งดูอยู่
       */
      /**
       * 🔑 **ใช้ `summarizeSnapshot` ตัวเดียวกับที่กระดาน `LiveBoard` ใช้** (31 ส.ค. 2026)
       *    ⛔ ห้ามประกอบก้อนนี้เองที่นี่อีก — เหตุผลเต็มอยู่ที่หัวฟังก์ชันใน `tools/shared.ts`
       */
      emitUi({
        type: 'snapshot.shown',
        place: toPlaceRef(snapshot.place),
        summary: summarizeSnapshot(snapshot, MAX_ALERTS),
      });

      return {
        place: {
          code: snapshot.place.code,
          name_th: snapshot.place.nameTh,
          name_en: snapshot.place.nameEn,
        },
        air_quality: snapshot.air
          ? {
              aqi: snapshot.air.value.aqi,
              pm25: snapshot.air.value.pm25,
              category: snapshot.air.value.category,
              observed_at: snapshot.air.observedAt,
              source: snapshot.air.source,
              cached: snapshot.air.cached,
            }
          : null,
        forecast: snapshot.forecast
          ? {
              points: snapshot.forecast.value.slice(0, MAX_FORECAST_POINTS).map((point) => ({
                at: point.at,
                temp_c: point.tempC,
                summary: clip(point.summary, SUMMARY_CHARS),
                rain_chance: point.rainChance,
              })),
              observed_at: snapshot.forecast.observedAt,
              source: snapshot.forecast.source,
              cached: snapshot.forecast.cached,
            }
          : null,
        hazard_alerts: alerts
          ? {
              /**
               * 🔴 `count` = **จำนวนฉบับในสแนปช็อตใบนี้** ⛔ ไม่ใช่จำนวนฉบับในดัชนีทั้งหมด ([[C-17]])
               *    ก่อน 28 ส.ค. 2026 ชั้นนี้เคยนับแบบหลัง แล้วพบว่า 4 ใน 5 ฉบับหมดอายุไปแล้ว
               *    ⇒ agent ที่พูดตัวเลขนั้นคือการทำให้คนตกใจกับเรื่องที่จบไป 2 วันแล้ว
               *
               * 🔴 **แก้ถ้อยคำ 31 ส.ค. 2026 ค่ำ — บรรทัดนี้เคยเขียนว่า "จำนวนฉบับที่ยังมีผล"**
               *    ซึ่ง **จริงแค่ ณ วินาทีที่ถ่ายสแนปช็อต** ต้นทางคัดใบที่ยังมีผลมาให้ตอน
               *    `ALERTS_CAPTURED_AT` แล้ว **ไม่มีใครเช็กซ้ำอีกเลย** ⇒ พอเลย `expires`
               *    ตัวเลขนี้ก็ยังเท่าเดิม · ตัวส่งแข่งถูกแช่แข็ง 3 สัปดาห์ ⇒ ตอนกรรมการตัดสิน
               *    **ทุกใบหมดอายุแน่นอน** ⇒ ปล่อยคำว่า "ยังมีผล" ไว้ = บั๊กเดิมที่กลับมาทางประตูอื่น
               * ✅ **ผู้เรียกต้องดู `expires` ของแต่ละใบเอง** — ซึ่งส่งออกไปให้ครบทุกใบอยู่แล้ว
               *    และชั้นตัดสินใจ (`get_safety_briefing`) กรองให้แล้วที่ `safety.ts`
               */
              count: alerts.value.length,
              omitted: capped.omitted,
              items: capped.shown.map((alert) => ({
                event: clip(alert.event, EVENT_CHARS),
                severity: alert.severity,
                headline: clip(alert.headline, HEADLINE_CHARS),
                expires: alert.expires,
              })),
              observed_at: alerts.observedAt,
              source: alerts.source,
              cached: alerts.cached,
            }
          : null,
        gaps: snapshot.gaps.map((gap) => ({ part: gap.part, reason: gap.reason, detail: gap.detail })),
      };
    },
  });
}
