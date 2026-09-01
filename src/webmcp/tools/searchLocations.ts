// src/webmcp/tools/searchLocations.ts
// ────────────────────────────────────────────────────────────────────────────
// 🔎 **tool #1 — `search_locations`** (scope §5)
//
// 🔑 **หน้าที่เดียว: แปลงสิ่งที่คนพูด → รหัสที่ระบบใช้ได้** ⇒ ขาถัดไปของ agent ส่งรหัสมา
//    แทนชื่อที่สะกดได้ 5 แบบ ⛔ tool นี้ไม่ตอบเรื่องอากาศ/ภัย แม้จะ "ทำได้" (single responsibility)
//
// 🪤 **ป้าย `untrustedContentHint` จำเป็นจริง ๆ ที่นี่:** ผลลัพธ์คือ **ชื่อสถานที่จากทะเบียน**
//    ซึ่งเป็นข้อความจากภายนอกที่ไหลเข้า context ของ agent ⇒ เป็นช่องของ indirect prompt injection
//    ตามนิยาม (มติ D-14 ขยายป้ายนี้ให้กว้างกว่าร่างแรกด้วยเหตุผลนี้)

import { defineTool, ToolError } from '../defineTool';
import { ProviderUnavailableError } from '../providers/errors';
import type { WebMCPDataProvider } from '../providers/types';
import { emitUi } from '../uiBridge';
import type { WebMCPTool } from '../types';
import { EXAMPLE_PLACES, capList, requiredText, toPlaceRef } from './shared';

/** จำนวนผลลัพธ์สูงสุดที่คืนให้ agent — มากกว่านี้กิน context โดยไม่ช่วยให้เลือกถูกขึ้น */
const MAX_RESULTS = 5;

export function createSearchLocationsTool(provider: WebMCPDataProvider): WebMCPTool {
  return defineTool({
    name: 'search_locations',
    description:
      'Find a place by name and return its province code. Accepts Thai or English, loose spelling, and prefixes like "จ." or "อ.". Call this first when the user names a place, then pass the returned code to the other tools. Works for locations in Thailand (77 provinces).',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Place name as the user said it, Thai or English. Loose spelling is fine.',
        },
      },
      required: ['query'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, idempotentHint: true, untrustedContentHint: true },
    async execute(input, ctx) {
      const query = requiredText(input, 'query');

      let hits;
      try {
        hits = await provider.searchLocations({ query, limit: MAX_RESULTS, signal: ctx.signal });
      } catch (error) {
        if (error instanceof ProviderUnavailableError) {
          /**
           * 🔑 ทะเบียนอ่านไม่ได้ ≠ ไม่พบสถานที่ — ⛔ ห้ามคืนรายการว่างในกรณีนี้เด็ดขาด
           *    เพราะ agent จะบอกผู้ใช้ว่า "ไม่มีจังหวัดนี้" ทั้งที่ปัญหาอยู่ที่ระบบเรา
           */
          throw new ToolError('registry_unavailable', `${error.message} Please try again in a moment.`);
        }
        throw error;
      }

      const { shown } = capList(hits, MAX_RESULTS);
      emitUi({ type: 'search.results', query, places: shown.map(toPlaceRef) });

      if (shown.length === 0) {
        return {
          query,
          matches: [],
          /** ⛔ ไม่โยน error เมื่อ "ค้นแล้วไม่เจอ" — นั่นคือคำตอบที่ถูกต้อง ไม่ใช่ความผิดพลาด */
          note: `No match in Thailand for "${query}". Try a province name such as ${EXAMPLE_PLACES}.`,
        };
      }

      return {
        query,
        matches: shown.map((hit) => ({
          code: hit.code,
          name_th: hit.nameTh,
          name_en: hit.nameEn,
          kind: hit.kind,
        })),
      };
    },
  });
}
