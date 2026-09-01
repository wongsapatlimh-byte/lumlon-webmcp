// src/webmcp/challenge/dataSources.ts
// ────────────────────────────────────────────────────────────────────────────
// 🔀 **ทะเบียนแหล่งข้อมูลของตัวส่งแข่ง — สลับได้โดยไม่แก้โค้ด** (คำสั่งเจ้าของ 29 ส.ค. 2026)
//
// ── 🎯 ปัญหาที่ไฟล์นี้แก้ ──
//   เอกสารสิทธิ์ข้อมูล (`docs/tasks/2026-08-29_webmcp_data_rights.md` §4) ชี้ว่า **Open-Meteo
//   ชั้นฟรีเขียน "❌ commercial use"** และคำว่า *"promotional activities"* เป็น **ดุลพินิจของ
//   ผู้ให้บริการ ⛔ ไม่ใช่ข้อเท็จจริงที่เราตรวจได้** ⇒ วันหนึ่งอาจต้องถอดออกโดยไม่ทันตั้งตัว
//   ⚠️ และช่วง **แช่แข็ง 3–23 ก.ย. ห้ามแก้โค้ด/push** ⇒ ถ้าการถอดแหล่งข้อมูลต้องแก้โค้ด
//      = ต้องเลือกระหว่าง *ผิดกติกาการแช่แข็ง* กับ *ปล่อยให้เว็บใช้แหล่งที่เจ้าของบอกให้เลิกใช้*
//   ⇒ ไฟล์นี้ทำให้การถอด/สลับแหล่ง เหลือแค่ **เปลี่ยนค่าตัวแปรสภาพแวดล้อม 1 ตัวบนแดชบอร์ด**
//      📌 **พูดให้ตรง:** ค่าใหม่มีผลเมื่อ deployment รอบถัดไปหยิบไปใช้ (ธรรมดาของ env ทุกตัว)
//         — สิ่งที่หายไปคือ **การแก้โค้ด/รีวิว/เมิร์จ** ⛔ ไม่ใช่ "เปลี่ยนแล้วมีผลทันทีโดยไม่ทำอะไรเลย"
//
// ── 🔑 กติกาเหล็ก 3 ข้อของไฟล์นี้ ──
//   ① **แหล่งที่ยังไม่ได้ต่อ ⇒ ไม่มีตัวเลข + บอกตรง ๆ ว่าทำไม** (`gap`)
//      ⛔ ห้ามแอบตกไปใช้สำเนาแล้วปล่อยให้คนตั้งค่าเข้าใจว่า *"ต่อแล้วแต่ต้นทางล่ม"*
//   ② **3 สถานะห้ามยุบรวม** (หลักเดียวกับชั้นประกาศเตือนภัย `disabled`/`unavailable`/`none`):
//      · `source_misconfigured` — ค่าที่ตั้งไม่ใช่ชื่อแหล่งที่รู้จัก (สะกดผิด)
//      · `source_not_connected` — ชื่อถูก แต่ build นี้ยังอ่านแหล่งนั้นไม่เป็น
//      · `upstream_unavailable` — ต่อแล้ว แต่รอบนี้อ่านไม่ได้ ⇒ ตกไปใช้สำเนาที่ติดป้าย `cached`
//   ③ **ค่าที่สะกดผิด = แดง ⛔ ไม่ใช่เงียบแล้วใช้ค่าตั้งต้น** — ตัวที่เดา มันเดาไปทาง "ผ่าน" เสมอ
//      คนตั้งค่าจะเชื่อว่าตัวเองปิด Open-Meteo ไปแล้ว ทั้งที่มันยังยิงอยู่ (ผลตรงข้ามกับที่ตั้งใจ)
//
// ── 🪤 OpenAQ ยังไม่ต่อ และนี่คือ **การตัดสินใจ ไม่ใช่ของค้างที่ลืม** ──
//   บทเรียน `L-434`: เทส 63 ข้อเคยเขียวบนรหัสจังหวัดรูป `"TH-50"` ที่ **ไม่มีอยู่จริง**
//   เพราะเขียน mock จากรูปที่เดาเอาเอง ⇒ กติกาที่ได้มาคือ **ยิงของจริงก่อนเขียน mock ใบแรกเสมอ**
//   ⇒ OpenAQ ต้องมีกุญแจฟรีก่อนถึงจะยิงได้ · กุญแจยังไม่มี ⇒ **ยังไม่เขียนโค้ดอ่านมันแม้แต่บรรทัดเดียว**
//   ⇒ แหล่งนี้จึงขึ้นทะเบียนในสถานะ "ยังไม่ต่อ" ซึ่ง **ตอบตรง ๆ ได้ว่าขาดอะไร**
//      ⛔ ต่างจากการไม่มีชื่อมันอยู่เลย ซึ่งคนอ่านโค้ดจะไม่รู้ว่าเคยพิจารณาแล้ว

import { FALLBACK_AIR, FALLBACK_FORECAST } from './fallback';
import { describeWmo, toIsoWithOffset } from './wmo';

// ── ชื่อแหล่ง ────────────────────────────────────────────────────────────────

export type AirSourceId = 'open-meteo' | 'openaq' | 'bundled';
export type ForecastSourceId = 'open-meteo' | 'bundled';

export const AIR_SOURCE_IDS: readonly AirSourceId[] = ['open-meteo', 'openaq', 'bundled'];
export const FORECAST_SOURCE_IDS: readonly ForecastSourceId[] = ['open-meteo', 'bundled'];

/**
 * 📌 **ค่าตั้งต้นเมื่อไม่ได้ตั้งอะไรเลย** — ตรงกับสิ่งที่เว็บแข่งใช้อยู่วันนี้
 * ⇒ การเพิ่มสวิตช์นี้ **ไม่เปลี่ยนพฤติกรรมของ deployment ที่มีอยู่แล้วแม้แต่นิดเดียว**
 */
export const DEFAULT_AIR_SOURCE: AirSourceId = 'open-meteo';
export const DEFAULT_FORECAST_SOURCE: ForecastSourceId = 'open-meteo';

/** ชื่อตัวแปรสภาพแวดล้อม — เขียนไว้ที่เดียว เพื่อให้ README กับโค้ดเพี้ยนจากกันไม่ได้ */
export const AIR_SOURCE_ENV = 'WEBMCP_AIR_SOURCE';
export const FORECAST_SOURCE_ENV = 'WEBMCP_FORECAST_SOURCE';

// ── รูปของสิ่งที่แหล่งข้อมูลคืน ───────────────────────────────────────────────

/**
 * ค่าที่อ่านได้จากแหล่ง — **ยังไม่แปลงเป็น AQI**
 * 🔑 การคำนวณ AQI อยู่ที่ route ที่เดียว (ใช้ตารางของแอปเอง) ⇒ ทุกแหล่งได้ตัวเลขที่เทียบกันได้
 *    ⛔ ถ้าปล่อยให้แต่ละแหล่งคำนวณเอง วันสลับแหล่งตัวเลขจะกระโดดโดยที่อากาศไม่ได้เปลี่ยน
 */
export interface AirReading {
  pm25: number | null;
  observedAt: string | null;
  source: string;
  cached: boolean;
}

export interface ForecastPointReading {
  at: string | null;
  tempC: number | null;
  rainChance: number | null;
  summary: string | null;
}

export interface ForecastReading {
  points: ForecastPointReading[];
  observedAt: string | null;
  source: string;
  cached: boolean;
}

/** `unavailable` = ต่อแล้วแต่อ่านไม่ได้รอบนี้ ⇒ ผู้เรียกตกไปใช้สำเนาที่ติดป้าย */
export type ReadResult<T> = { outcome: 'ok'; value: T } | { outcome: 'unavailable' };

export interface SourceContext {
  lat: number;
  lon: number;
  signal: AbortSignal;
}

export interface AirSource {
  id: AirSourceId;
  read(ctx: SourceContext): Promise<ReadResult<AirReading>>;
}

export interface ForecastSource {
  id: ForecastSourceId;
  read(ctx: SourceContext): Promise<ReadResult<ForecastReading>>;
}

/** ส่วนที่ตอบไม่ได้ พร้อมเหตุผลที่ agent หยิบไปบอกผู้ใช้ได้ทันที (รูปเดียวกับ `ToolGap`) */
export interface SourceGap {
  part: 'air_quality' | 'forecast';
  reason: 'source_not_connected' | 'source_misconfigured' | 'upstream_unavailable' | 'not_in_snapshot';
  detail: string;
}

/** `blocked` = เลือกแหล่งไม่สำเร็จตั้งแต่ตอนอ่านค่าตั้ง ⇒ **ยังไม่ได้ยิงต้นทางเลยสักครั้ง** */
export type Selection<S> = { status: 'ready'; source: S } | { status: 'blocked'; gap: SourceGap };

// ── ตัวช่วยยิงต้นทาง ─────────────────────────────────────────────────────────

async function fetchJson(url: string, signal: AbortSignal): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

// ── แหล่ง: Open-Meteo ────────────────────────────────────────────────────────

export const OPEN_METEO_AIR_ATTRIBUTION = 'Open-Meteo Air Quality (CC BY 4.0)';
export const OPEN_METEO_FORECAST_ATTRIBUTION = 'Open-Meteo (CC BY 4.0)';

const openMeteoAir: AirSource = {
  id: 'open-meteo',
  async read({ lat, lon, signal }) {
    const url =
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}` +
      '&current=pm2_5&timezone=Asia%2FBangkok';
    const json = await fetchJson(url, signal);
    const current = (json?.current ?? null) as { time?: unknown; pm2_5?: unknown } | null;
    /** 🔑 ต้นทางตอบ 200 แต่ไม่มีตัวเลข = **อ่านไม่ได้** ⛔ ไม่ใช่ "ค่าเป็น null" ที่เอาไปแสดงได้ */
    if (typeof current?.pm2_5 !== 'number') return { outcome: 'unavailable' };
    return {
      outcome: 'ok',
      value: {
        pm25: current.pm2_5,
        observedAt: toIsoWithOffset(current.time, json?.utc_offset_seconds),
        source: OPEN_METEO_AIR_ATTRIBUTION,
        cached: false,
      },
    };
  },
};

/** จำนวนช่วงพยากรณ์ที่ส่งต่อ — ฝั่ง tool ตัดอีกชั้นตามงบตัวอักษร (`MAX_FORECAST_POINTS`) */
const FORECAST_POINTS = 3;

const openMeteoForecast: ForecastSource = {
  id: 'open-meteo',
  async read({ lat, lon, signal }) {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      '&hourly=temperature_2m,precipitation_probability,weather_code&forecast_days=1&timezone=Asia%2FBangkok';
    const json = await fetchJson(url, signal);
    const hourly = (json?.hourly ?? null) as {
      time?: unknown[];
      temperature_2m?: unknown[];
      precipitation_probability?: unknown[];
      weather_code?: unknown[];
    } | null;
    if (!Array.isArray(hourly?.time) || hourly.time.length === 0) return { outcome: 'unavailable' };

    /**
     * 🕒 หยิบช่วงเวลาที่ **ยังไม่ผ่านไป** — พยากรณ์ของเมื่อ 6 ชั่วโมงที่แล้วไม่ใช่พยากรณ์
     * ⛔ ห้ามหยิบ 3 ตัวแรกของอาร์เรย์ดื้อ ๆ (ต้นทางคืนตั้งแต่เที่ยงคืนของวันนั้น)
     */
    const nowMs = Date.now();
    const points = hourly.time
      .map((t, i) => ({
        at: toIsoWithOffset(t, json?.utc_offset_seconds),
        tempC: typeof hourly.temperature_2m?.[i] === 'number' ? (hourly.temperature_2m[i] as number) : null,
        rainChance:
          typeof hourly.precipitation_probability?.[i] === 'number'
            ? (hourly.precipitation_probability[i] as number)
            : null,
        summary: describeWmo(hourly.weather_code?.[i]),
      }))
      .filter((point) => point.at !== null && Date.parse(point.at) >= nowMs)
      .slice(0, FORECAST_POINTS);

    /**
     * 🔑 อ่านได้แต่ **ไม่เหลือช่วงเวลาในอนาคตเลย** ⇒ ถือว่าอ่านไม่ได้
     *    ⇒ ผู้เรียกประกาศเป็น `gap` แทนการส่งพยากรณ์เปล่า ๆ ที่ agent เอาไปใช้ไม่ได้
     */
    if (points.length === 0) return { outcome: 'unavailable' };
    return {
      outcome: 'ok',
      value: { points, observedAt: points[0].at, source: OPEN_METEO_FORECAST_ATTRIBUTION, cached: false },
    };
  },
};

// ── แหล่ง: สำเนาที่เดินทางไปกับ repo ─────────────────────────────────────────

/**
 * 🛟 **สำเนาในตัว — เลือกได้ตรง ๆ ไม่ใช่แค่ตัวสำรองอัตโนมัติ**
 * 🔑 นี่คือ **ทางถอยที่ถูกกฎทุกข้อ** ถ้าวันหนึ่งต้องถอดต้นทางภายนอกออกทั้งหมด:
 *    เว็บยังตอบครบทุก tool · ทุกตัวเลขติดป้าย `cached` · ไม่เหลือคำถามเรื่องสิทธิ์แม้แต่ข้อเดียว
 */
const bundledAir: AirSource = {
  id: 'bundled',
  async read() {
    return { outcome: 'ok', value: { ...FALLBACK_AIR } };
  },
};

const bundledForecast: ForecastSource = {
  id: 'bundled',
  async read() {
    /**
     * ⚠️ สำเนาพยากรณ์ **ไม่มีช่วงเวลาใด ๆ โดยตั้งใจ** — พยากรณ์ที่ถ่ายไว้เมื่อวานไม่ใช่พยากรณ์
     *    ⇒ คืน `unavailable` เพื่อให้ผู้เรียกประกาศเป็น `gap` ⛔ ไม่ส่งอาร์เรย์เปล่าไปให้ agent เดา
     */
    if (FALLBACK_FORECAST.points.length === 0) return { outcome: 'unavailable' };
    return { outcome: 'ok', value: { ...FALLBACK_FORECAST } };
  },
};

// ── ทะเบียน + การเลือกจากค่าตั้ง ─────────────────────────────────────────────

/**
 * 🔴 **`Partial` โดยตั้งใจ** — ชื่อที่ขึ้นทะเบียนใน `AIR_SOURCE_IDS` แล้วยังไม่มีตัวอ่านที่นี่
 *    = สถานะ "ยังไม่ต่อ" ที่ระบบ **ตอบได้ว่าขาดอะไร** ⛔ ไม่ใช่ชื่อที่ระบบไม่รู้จัก
 */
const AIR_SOURCES: Partial<Record<AirSourceId, AirSource>> = {
  'open-meteo': openMeteoAir,
  bundled: bundledAir,
  /**
   * 🪤 `openaq` **จงใจไม่มีตัวอ่าน** — เหตุผลเต็มอยู่หัวไฟล์ (`L-434`)
   *    ปลดล็อกด้วย ① เจ้าของสมัครกุญแจฟรี ② ยิงของจริงแล้วบันทึกรูป response ที่เห็นกับตา
   *    ③ ค่อยเขียนตัวอ่าน + mock จากรูปนั้น ⛔ ห้ามสลับลำดับ 3 ข้อนี้
   */
};

const FORECAST_SOURCES: Partial<Record<ForecastSourceId, ForecastSource>> = {
  'open-meteo': openMeteoForecast,
  bundled: bundledForecast,
};

/** เหตุผลรายแหล่งที่ยังต่อไม่ได้ — เขียนให้ agent อ่านแล้วเล่าต่อได้ทันทีโดยไม่ต้องเปิดโค้ด */
const NOT_CONNECTED_DETAIL: Record<string, string> = {
  openaq:
    'OpenAQ is a registered air-quality source but this build cannot read it yet: it needs an API key that has not been issued. No reading is shown rather than a guessed one.',
};

const partLabel = (part: SourceGap['part']) => (part === 'air_quality' ? 'air-quality' : 'forecast');

function misconfiguredDetail(part: SourceGap['part'], valid: readonly string[]): string {
  return `The configured ${partLabel(part)} source is not one this build knows about (expected: ${valid.join(', ')}). Nothing is shown for this block rather than a guessed value.`;
}

function notConnectedDetail(part: SourceGap['part'], id: string): string {
  return (
    NOT_CONNECTED_DETAIL[id] ??
    `The ${partLabel(part)} source selected for this deployment is not wired up in this build, so no reading is available.`
  );
}

/**
 * 🔴 **ค่าที่อ่านไม่ออก = แดง ⛔ ไม่ใช่ตกกลับไปใช้ค่าตั้งต้นเงียบ ๆ**
 *
 * 🔑 เหตุผลที่สำคัญกว่าที่เห็น: คนที่ตั้ง `WEBMCP_AIR_SOURCE=openmeteo` (สะกดผิด) กำลังตั้งใจ
 *    *เปลี่ยน* แหล่ง · ถ้าเราเงียบแล้วใช้ค่าตั้งต้น เขาจะเชื่อว่าปิด Open-Meteo ไปแล้ว
 *    ทั้งที่มันยังยิงอยู่ ⇒ **ผลตรงข้ามกับที่เขาตั้งใจ โดยไม่มีสัญญาณอะไรเลย**
 *
 * 🔒 ⛔ **ไม่สะท้อนค่าดิบกลับไปในคำตอบ** — เส้นนี้เป็นเส้นสาธารณะ ไม่มีเหตุผลให้เนื้อหาของ
 *    ตัวแปรสภาพแวดล้อมเดินทางออกไปถึงผู้เรียก แม้จะไม่ใช่ความลับก็ตาม
 *
 * 🔓 fail-open ฝั่งอ่านยังอยู่ครบ: ก้อนที่เลือกแหล่งไม่ได้กลายเป็น `gap` ก้อนเดียว
 *    **ก้อนอื่นและประกาศเตือนภัยยังตอบตามปกติ** ⛔ ไม่ล้มทั้งคำตอบเพราะค่าตั้งผิดตัวเดียว
 */
/**
 * 🪤 **ค่าที่มีตัวตนแต่เป็นช่องว่างล้วน = ตั้งผิด ⛔ ไม่ใช่ "ไม่ได้ตั้ง"**
 *
 * 🔬 **ผู้ตรวจ (Codex · 29 ส.ค. 2026) จับได้ และมันขัดกับกฎที่ไฟล์นี้ประกาศไว้เอง:**
 *    เดิม `(raw ?? '').trim() || DEFAULT` ทำให้ `WEBMCP_AIR_SOURCE="   "` **ตกกลับไปใช้ค่าตั้งต้นเงียบ ๆ**
 *    ซึ่งเป็นสิ่งเดียวกับที่กติกาข้อ ③ ของไฟล์นี้ห้ามไว้ (คนที่พิมพ์ค่าเพี้ยนกำลังตั้งใจ *เปลี่ยน* แหล่ง)
 *
 * 🔑 **แต่ต้องแยก 2 กรณีที่หน้าตาคล้ายกัน:**
 *    · ไม่ได้ตั้งเลย (`undefined`) หรือสตริงว่าง (`''`) ⇒ **ค่าตั้งต้น** — แพลตฟอร์มโฮสต์หลายเจ้า
 *      ส่งช่องว่างมาแทน "ไม่ได้ตั้ง" ⇒ ถือเป็นข้อผิดพลาดจะทำให้ deployment ปกติพังฟรี ๆ
 *    · มีตัวอักษรอยู่แต่ trim แล้วเหลือว่าง (`'   '`) ⇒ **ตั้งผิด** — ไม่มีเหตุผลที่ใครตั้งใจทำแบบนี้
 */
function normalizeSourceId(raw: string | undefined): { id: string } | { misconfigured: true } {
  if (raw === undefined || raw === '') return { id: '' };
  const trimmed = raw.trim();
  if (trimmed === '') return { misconfigured: true };
  return { id: trimmed };
}

export function selectAirSource(raw: string | undefined): Selection<AirSource> {
  const normalized = normalizeSourceId(raw);
  const misconfigured: Selection<AirSource> = {
    status: 'blocked',
    gap: {
      part: 'air_quality',
      reason: 'source_misconfigured',
      detail: misconfiguredDetail('air_quality', AIR_SOURCE_IDS),
    },
  };
  if ('misconfigured' in normalized) return misconfigured;

  const id = normalized.id || DEFAULT_AIR_SOURCE;
  if (!(AIR_SOURCE_IDS as readonly string[]).includes(id)) {
    return misconfigured;
  }
  const source = AIR_SOURCES[id as AirSourceId];
  if (!source) {
    return {
      status: 'blocked',
      gap: { part: 'air_quality', reason: 'source_not_connected', detail: notConnectedDetail('air_quality', id) },
    };
  }
  return { status: 'ready', source };
}

export function selectForecastSource(raw: string | undefined): Selection<ForecastSource> {
  const normalized = normalizeSourceId(raw);
  const misconfigured: Selection<ForecastSource> = {
    status: 'blocked',
    gap: {
      part: 'forecast',
      reason: 'source_misconfigured',
      detail: misconfiguredDetail('forecast', FORECAST_SOURCE_IDS),
    },
  };
  if ('misconfigured' in normalized) return misconfigured;

  const id = normalized.id || DEFAULT_FORECAST_SOURCE;
  if (!(FORECAST_SOURCE_IDS as readonly string[]).includes(id)) {
    return misconfigured;
  }
  const source = FORECAST_SOURCES[id as ForecastSourceId];
  if (!source) {
    return {
      status: 'blocked',
      gap: { part: 'forecast', reason: 'source_not_connected', detail: notConnectedDetail('forecast', id) },
    };
  }
  return { status: 'ready', source };
}
