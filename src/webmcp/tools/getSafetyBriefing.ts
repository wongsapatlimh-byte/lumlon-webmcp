// src/webmcp/tools/getSafetyBriefing.ts
// ────────────────────────────────────────────────────────────────────────────
// 🧭 **tool #3 — `get_safety_briefing`** (scope §5)
//
// 🔑 **นี่คือ tool ที่โชว์ว่าเว็บเรา "คิดแทน" ไม่ใช่ "คายตัวเลข"** — และเป็นจุดที่ต่างจากคู่แข่ง
//    ที่เปิด API เฉย ๆ: agent เรียกครั้งเดียวได้ทั้ง **คำตัดสิน + เหตุผลที่อ้างข้อมูลจริง**
//    ⇒ เอาไปตอบผู้ใช้จบในเทิร์นเดียวโดย LLM ไม่ต้องเดาเกณฑ์ฝุ่นเอง (จุดที่โมเดลมั่วบ่อยที่สุด
//    เวลาพูดเรื่องสุขภาพ — และเป็นเหตุผลที่ tool นี้มีค่ากว่าการให้ตัวเลขดิบไปอย่างเดียว)
//
// ⚠️ **ไม่มีข้อมูล ≠ ปลอดภัย** — ระดับ `unknown` ต้องออกมาเป็น `unknown` เสมอ
//    ⛔ ห้ามแปลงเป็น `good` เพื่อให้คำตอบดูสมบูรณ์ (นั่นคือการบอกคนว่าออกไปได้ทั้งที่เราไม่รู้)

import { defineTool, ToolError } from '../defineTool';
import { ProviderUnavailableError } from '../providers/errors';
import type { WebMCPDataProvider } from '../providers/types';
import { SAFETY_ACTIVITIES, assessSafety, type SafetyActivity } from '../safety';
import { emitUi } from '../uiBridge';
import type { WebMCPTool } from '../types';
import { EXAMPLE_PLACES, capList, clip, optionalEnum, requiredText, toPlaceRef } from './shared';

/** เหตุผลสูงสุดที่ส่งกลับ — คำแนะนำที่มี 9 เหตุผลไม่ได้น่าเชื่อกว่าที่มี 4 */
const MAX_REASONS = 4;

/**
 * ความยาวต่อ 1 เหตุผล
 * 🔬 วัดแล้ว (29 ส.ค. 2026): กรณีแย่ที่สุดเดิม **1,654 ตัวอักษร** เกินงบ 1.5K —
 *    ตัวหนักคือหัวข้อประกาศ CAP ที่ยาวเป็นย่อหน้าไหลเข้ามาในเหตุผล
 */
const REASON_CHARS = 150;

/** คำแนะนำสูงสุด — เกิน 2 ข้อคนไม่ทำตามอยู่ดี และ agent จะอ่านออกมายาวเกินไป */
const MAX_ADVICE = 2;

export function createGetSafetyBriefingTool(provider: WebMCPDataProvider): WebMCPTool {
  return defineTool({
    name: 'get_safety_briefing',
    description:
      'Decide whether an activity is advisable right now at one place, and explain why. Returns a level (good, caution, avoid, unknown) with reasons that quote the real readings and any official alert in effect. Prefer this over get_environment_snapshot when the user asks whether they should go out. Answers are for locations in Thailand (77 provinces).',
    inputSchema: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'Province name, or the 2-digit code from search_locations, e.g. "Chiang Mai" or "50".',
        },
        activity: {
          type: 'string',
          description: 'What the person wants to do. Defaults to general if not given.',
          enum: SAFETY_ACTIVITIES,
        },
      },
      required: ['location'],
      additionalProperties: false,
    },
    /**
     * 🪤 **อ่านอย่างเดียวจริง ๆ แม้ชื่อจะฟังดูเหมือนให้คำแนะนำ** — ไม่มีอะไรถูกบันทึก
     *    ⇒ ติด `readOnlyHint` ให้ agent ไม่ต้องขอยืนยันผู้ใช้ทุกครั้ง (ซึ่งจะทำให้ใช้ไม่ลื่น)
     * 🔑 แต่ยัง `untrustedContentHint` เพราะเหตุผลที่คืนไปมี **หัวข้อประกาศจากต้นทาง** ปนอยู่
     */
    annotations: { readOnlyHint: true, idempotentHint: true, untrustedContentHint: true },
    async execute(input, ctx) {
      const location = requiredText(input, 'location');
      const activity: SafetyActivity = optionalEnum(input, 'activity', SAFETY_ACTIVITIES, 'general');

      let snapshot;
      try {
        snapshot = await provider.getEnvironmentSnapshot({ location, signal: ctx.signal });
      } catch (error) {
        if (error instanceof ProviderUnavailableError && error.part === 'location') {
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

      const assessment = assessSafety(snapshot, activity);
      const reasons = capList(assessment.reasons, MAX_REASONS);

      emitUi({
        type: 'briefing.shown',
        place: toPlaceRef(snapshot.place),
        activity,
        level: assessment.level,
        /**
         * จอได้เหตุผลชุดเดียวกับที่ agent ได้ ⇒ คนตรวจคำตอบของ agent ได้จากหน้าจอเอง
         * 🔤 ส่ง `code`+`values` ไปด้วยเพื่อให้จอแปลเป็นภาษาผู้ใช้ได้ ⛔ ตัว tool ยังส่ง EN ให้ agent เหมือนเดิม
         */
        reasons: reasons.shown.map((reason) => ({
          code: reason.code,
          detail: reason.detail,
          values: reason.values,
        })),
        advice: assessment.advice.slice(0, MAX_ADVICE),
      });

      return {
        place: {
          code: snapshot.place.code,
          name_th: snapshot.place.nameTh,
          name_en: snapshot.place.nameEn,
        },
        activity,
        level: assessment.level,
        reasons: reasons.shown.map((reason) => ({ code: reason.code, detail: clip(reason.detail, REASON_CHARS) })),
        reasons_omitted: reasons.omitted,
        /** ⛔ agent ได้ประโยค EN เหมือนเดิมเป๊ะ — การเพิ่ม `code` เป็นเรื่องของจอเท่านั้น */
        advice: assessment.advice.slice(0, MAX_ADVICE).map((item) => item.detail),
        /**
         * 🔑 คืนแหล่ง+เวลาไปด้วยเสมอ ถึงแม้คำตัดสินจะเป็นข้อความ — คนที่อ่านคำตอบของ agent
         *    ไม่เห็นหน้าจอ ⇒ "ควรงดออกกำลังกาย" ที่ไม่มีเวลากำกับ คือคำแนะนำที่ตรวจสอบไม่ได้
         */
        observed_at: snapshot.alerts?.observedAt ?? snapshot.air?.observedAt ?? null,
        sources: [snapshot.alerts?.source, snapshot.air?.source].filter(Boolean),
      };
    },
  });
}
