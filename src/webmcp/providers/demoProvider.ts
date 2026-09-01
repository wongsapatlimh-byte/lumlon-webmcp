// src/webmcp/providers/demoProvider.ts
// ────────────────────────────────────────────────────────────────────────────
// 🎪 **ชั้นข้อมูลของตัวส่งแข่ง** (`C2` · `C3` · มติ D-6)
//
// 🔴 **ตัว tool ไม่รู้ด้วยซ้ำว่ากำลังคุยกับใคร** — ไฟล์นี้กับ `realProvider` ทำสัญญาเดียวกัน
//    ⇒ โค้ด tool ทั้ง 6 ตัว **ไม่ต่างกันแม้แต่บรรทัดเดียว** ระหว่างผลิตภัณฑ์จริงกับตัวส่งแข่ง
//    ⇒ ของที่กรรมการเห็นคือ **ของจริงที่ย่อส่วน ⛔ ไม่ใช่ฉากถ่ายหนัง** (มติ D-2)
//
// ── 🧭 แหล่งข้อมูล 2 ชั้น และเหตุผลที่ต่างกัน ──
//   ☁️ **อากาศ/พยากรณ์ = สดจริงทุกคำขอ** ผ่านเส้นในตัว (`/api/webmcp/environment` → Open-Meteo)
//      ⇒ นี่คือจุดที่ทำให้เว็บ *มีชีวิต* ตลอดช่วงแช่แข็ง
//   📢 **ประกาศเตือนภัย = สแนปช็อตที่ถ่ายมา** พร้อมวันที่ถ่ายจริง และติด `cached: true` เสมอ
//      ⇒ เพราะแผนกำหนดให้ตัวส่งแข่ง **ไม่พึ่งหลังบ้านของเราเลย** ช่วงแช่แข็ง (แผน §3.2 ข้อ 8)
//      ⛔ ห้ามทำให้มันดูเหมือนประกาศสด — คำโกหกเรื่องความปลอดภัยแพงกว่าคะแนนที่ได้เพิ่ม

import { ALERTS_ATTRIBUTION, ALERTS_CAPTURED_AT, alertsForProvince } from '../challenge/alertsSnapshot';
import { CHALLENGE_PROVINCES, type ChallengeProvince } from '../challenge/provinces';
import type { ToolGap } from '../types';
import { ProviderUnavailableError } from './errors';
import { matchProvince, searchProvinces } from './provinceMatch';
import type {
  EnvironmentSnapshot,
  ForecastPoint,
  LocationHit,
  SearchRequest,
  SnapshotRequest,
  WebMCPDataProvider,
} from './types';

/** เครดิตทุกแหล่งที่ตัวส่งแข่งใช้ (R14) — ⛔ ต่อแหล่งใหม่เมื่อไร ต้องมาเติมที่นี่ในคอมมิตเดียวกัน */
const ATTRIBUTIONS = [
  'Open-Meteo (CC BY 4.0)',
  'Thai Meteorological Department (CAP alerts)',
  'LUMLON province registry',
] as const;

/**
 * 📍 **เส้นในตัวของตัวส่งแข่ง — POST เท่านั้น**
 * เหตุผลที่ไม่เป็น GET อยู่ในหัว `challenge/api/environment/route.ts`
 * (สรุป: กันไม่ให้ใครเติม `?lat=&lon=` เข้ามาในอนาคต — ปิดที่รูปของ API ปลอดภัยกว่าพึ่งวินัย)
 */
const ENVIRONMENT_ENDPOINT = '/api/webmcp/environment';

function toHit(province: ChallengeProvince): LocationHit {
  return { code: province.code, kind: 'province', nameTh: province.th, nameEn: province.en };
}

interface EnvironmentResponse {
  air?: { pm25?: number | null; aqi?: number | null; category?: string | null; observedAt?: string | null; source?: string; cached?: boolean } | null;
  forecast?: { points?: ForecastPoint[]; observedAt?: string | null; source?: string; cached?: boolean } | null;
  note?: string | null;
  /**
   * 🔀 ส่วนที่เส้นในตัวตอบไม่ได้ + เหตุผล — **เส้นนั้นเป็นคนรู้ว่าแหล่งไหนถูกเลือกและเกิดอะไรขึ้น**
   *    (สวิตช์แหล่งข้อมูล `challenge/dataSources.ts`) ⇒ ที่นี่มีหน้าที่ **ส่งต่อ ⛔ ไม่ใช่เขียนใหม่**
   *    การเขียนเหตุผลซ้ำที่นี่ = คำอธิบาย 2 ชุดที่จะเพี้ยนจากกันวันที่ใครแก้ข้างเดียว
   */
  gaps?: Array<{ part?: unknown; reason?: unknown; detail?: unknown }> | null;
}

/** ⛔ รับเฉพาะ gap ที่ครบ 3 ช่องและเป็นข้อความ — ของผิดรูปห้ามกลายเป็น `undefined` ในคำตอบของ agent */
function toToolGaps(raw: EnvironmentResponse['gaps']): ToolGap[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (gap): gap is { part: string; reason: string; detail: string } =>
        typeof gap?.part === 'string' && typeof gap?.reason === 'string' && typeof gap?.detail === 'string',
    )
    .map((gap) => ({ part: gap.part, reason: gap.reason, detail: gap.detail }));
}

export function createDemoProvider(): WebMCPDataProvider {
  return {
    id: 'demo',
    attributions: ATTRIBUTIONS,

    async searchLocations({ query, limit = 5 }: SearchRequest): Promise<LocationHit[]> {
      /**
       * 🔑 **ค้นหาเป็นฟังก์ชันบริสุทธิ์ ไม่ยิงใคร** — ทะเบียนอยู่ในไฟล์นิ่งที่เดินทางไปกับ repo
       *    ⇒ ตัวส่งแข่งค้นสถานที่ได้แม้ต้นทางทั้งโลกจะล่ม (และคำค้นไม่เคยออกจากเบราว์เซอร์)
       */
      return searchProvinces(CHALLENGE_PROVINCES, query, limit).map(toHit);
    },

    async getEnvironmentSnapshot({ location, signal }: SnapshotRequest): Promise<EnvironmentSnapshot> {
      const province = matchProvince(CHALLENGE_PROVINCES, location);
      if (!province) throw new ProviderUnavailableError('location', `Unknown location: ${location}`);

      const gaps: ToolGap[] = [];

      let payload: EnvironmentResponse | null = null;
      try {
        const res = await fetch(ENVIRONMENT_ENDPOINT, {
          method: 'POST',
          signal,
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ provinceCode: province.code }),
        });
        if (res.ok) payload = (await res.json()) as EnvironmentResponse;
      } catch {
        payload = null;
      }

      /**
       * 🔑 **เส้นในตัวล้มทั้งเส้น ⇒ ประกาศเป็น `gaps` แล้วตอบส่วนที่เหลือ** (fail-open ฝั่งอ่าน)
       *    ⛔ ไม่ล้มทั้ง snapshot เพราะชั้นประกาศเตือนภัยยังตอบได้อยู่ — และนั่นคือส่วนที่
       *    สำคัญกว่าสำหรับคำถามเรื่องความปลอดภัย
       */
      gaps.push(...toToolGaps(payload?.gaps));

      /**
       * 🔴 **ก้อนที่หายแต่ไม่มีใครอธิบาย ห้ามเงียบ** (กติกา ② ของชั้น provider)
       *    ครอบ 2 กรณีที่ `gaps` ของเส้นในตัวมาไม่ถึง: ① ยิงเส้นไม่ติดเลย ② คำตอบผิดรูป
       *    ⇒ agent ได้ยินเสมอว่า *ขาดอะไร* ⛔ ไม่ใช่ค่าที่หายไปเฉย ๆ ให้เข้าใจเอาเองว่าไม่มีปัญหา
       */
      const explained = new Set(gaps.map((gap) => gap.part));
      if (!payload?.air && !explained.has('air_quality')) {
        gaps.push({
          part: 'air_quality',
          reason: 'upstream_unavailable',
          detail: 'Air quality could not be read right now — this is not the same as "the air is clean".',
        });
      }
      const forecastPoints = payload?.forecast?.points;
      if (!(Array.isArray(forecastPoints) && forecastPoints.length > 0) && !explained.has('forecast')) {
        gaps.push({
          part: 'forecast',
          reason: 'upstream_unavailable',
          detail: 'The forecast could not be read right now — this is not the same as "no rain expected".',
        });
      }

      /**
       * 📢 สแนปช็อตประกาศ — **มีเสมอ อ่านไม่พลาด** (อยู่ในไฟล์) ⇒ ไม่มีสถานะ "อ่านไม่ได้"
       *    แต่ **ต้องติด `cached: true` เสมอ** และแสตมป์เป็นวันที่ถ่ายจริง ⛔ ไม่ใช่เวลาปัจจุบัน
       */
      const alerts = alertsForProvince(province.code);

      return {
        place: toHit(province),
        air: payload?.air
          ? {
              value: {
                pm25: payload.air.pm25 ?? null,
                aqi: payload.air.aqi ?? null,
                category: payload.air.category ?? null,
              },
              observedAt: payload.air.observedAt ?? null,
              source: payload.air.source ?? 'Open-Meteo (CC BY 4.0)',
              cached: Boolean(payload.air.cached),
            }
          : null,
        forecast:
          payload?.forecast && Array.isArray(payload.forecast.points) && payload.forecast.points.length > 0
            ? {
                value: payload.forecast.points,
                observedAt: payload.forecast.observedAt ?? null,
                source: payload.forecast.source ?? 'Open-Meteo (CC BY 4.0)',
                cached: Boolean(payload.forecast.cached),
              }
            : null,
        alerts: {
          value: alerts.map((alert) => ({
            event: alert.event,
            severity: alert.severity,
            headline: alert.headline,
            provinces: alert.provinces,
            sent: alert.sent,
            expires: alert.expires,
          })),
          observedAt: ALERTS_CAPTURED_AT,
          source: ALERTS_ATTRIBUTION,
          cached: true,
        },
        gaps,
      };
    },
  };
}
