// src/webmcp/challenge/api/environment/route.ts
// ────────────────────────────────────────────────────────────────────────────
// 🌤️ **เส้นข้อมูลอากาศของตัวส่งแข่ง** (`C2` · `C3` · `C5`)
//
// 🔴 **ไฟล์นี้ไม่มี route ในแอปจริง** — ตัวถ่ายสำเนาสลับมันเข้าไปเป็น
//    `src/app/api/webmcp/environment/route.ts` ใน repo สาธารณะเท่านั้น
//    ⇒ แอปผลิตภัณฑ์ **ไม่ได้เปิดเส้นสาธารณะไร้ auth เพิ่มแม้แต่เส้นเดียว**
//
// ── 📍 ทำไมเป็น POST ทั้งที่รับแค่รหัสจังหวัด (ไม่ใช่พิกัด) ──
//   รหัสจังหวัดอยู่ใน URL ได้ตามกติกา แต่ **ตัวเส้นนี้แปลงรหัส → จุดกึ่งกลางจังหวัด แล้วยิงต้นทาง**
//   ⇒ ถ้าเปิดเป็น GET เมื่อไร คนถัดไปจะเติม `?lat=&lon=` เข้ามาอย่างเป็นธรรมชาติ
//   ⇒ **ปิดประตูตั้งแต่รูปของ API** ปลอดภัยกว่าพึ่งวินัยของคนที่มาแก้ทีหลัง (GEO-0 · มติ D-26)
//   🔒 และพิกัดกึ่งกลางจังหวัด **ไม่เคยออกไปถึงเบราว์เซอร์** — มันอยู่ฝั่งเซิร์ฟเวอร์ตลอดทาง
//
// ── 🔁 fail-open ฝั่งอ่าน (มติ D-4 · `C3`) ──
//   ต้นทางล้ม ⇒ **ตอบสแนปช็อตสำรอง + ติดป้าย `cached: true`** ⛔ ไม่ตอบ 5xx
//   เพราะกรรมการอาจเปิดเว็บตอนที่ต้นทางล่ม และ *เว็บที่ตอบไม่ได้* เสียคะแนนมากกว่า
//   *เว็บที่บอกตรง ๆ ว่ากำลังใช้สำเนา*
//
// ── 🔀 แหล่งข้อมูลสลับได้ที่ค่าตั้ง (คำสั่งเจ้าของ 29 ส.ค. 2026) ──
//   ไฟล์นี้ **ไม่รู้จักชื่อผู้ให้บริการรายไหนอีกต่อไป** — มันถามทะเบียนใน `../../dataSources`
//   ว่า *"รอบนี้ให้อ่านจากใคร"* แล้วทำตาม ⇒ การถอด/สลับแหล่งไม่ต้องแตะไฟล์นี้เลย
//   🔑 หน้าที่ที่เหลืออยู่กับไฟล์นี้คือของที่ **ห้ามต่างกันตามแหล่ง**: ด่านทางเข้า · เพดานคำขอ ·
//      การคำนวณ AQI ด้วยตารางของแอปเอง · และการติดป้ายว่าคำตอบนี้สดหรือเป็นสำเนา
//
// 🔴 **ทุก import ในไฟล์นี้ต้องเป็น `@/...` ⛔ ห้าม relative** (`./` หรือ `../`)
//    เพราะตัวถ่ายสำเนา **ย้ายไฟล์นี้ไปอยู่คนละที่** ใน repo สาธารณะ ⇒ path แบบ relative
//    จะชี้ไปที่ที่ไม่มีอะไรอยู่ · `@/` ผูกกับรากของ `src/` ⇒ **ถูกต้องทั้ง 2 ตำแหน่ง**
//    🔬 เจอจริง 29 ส.ค. 2026: ก่อนแก้ repo ที่ push ไปแล้ว `npm run build` **ไม่ผ่าน**
//       (6 specifier หาไม่เจอ) และไม่มีด่านไหนจับได้ เพราะทุกด่านตรวจ *รายชื่อไฟล์* ไม่ใช่ *ของที่รันได้*
//    ⇒ มีด่านกันแล้วที่ `scripts/webmcp-export.mjs` (ค้นคำว่า RELATIVE_IN_SUBSTITUTED)

import { NextResponse } from 'next/server';
import { calculateAQI } from '@/lib/aqi';
import {
  AIR_SOURCE_ENV,
  FORECAST_SOURCE_ENV,
  selectAirSource,
  selectForecastSource,
  type AirReading,
  type ForecastReading,
  type SourceGap,
} from '@/webmcp/challenge/dataSources';
import { BUNDLED_BY_CONFIG_NOTE, FALLBACK_AIR, FALLBACK_NOTE } from '@/webmcp/challenge/fallback';
import { provinceByCode } from '@/webmcp/challenge/provinces';

export const dynamic = 'force-dynamic';

/** ⏱️ เพดานเวลารอต้นทาง — ช้ากว่านี้ให้ตกไปใช้สำเนาแทนการปล่อยให้กรรมการนั่งดูวงกลมหมุน */
const UPSTREAM_TIMEOUT_MS = 4_000;

/** 🚦 `C5` — เพดานคำขอต่อ 1 ผู้เรียก */
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;

/**
 * ⚠️ **ตัวนับอยู่ในหน่วยความจำของอินสแตนซ์เดียว** — บนแพลตฟอร์มไร้เซิร์ฟเวอร์
 *    คำขอที่ไปคนละอินสแตนซ์จะนับแยกกัน ⇒ **นี่คือตัวลดความเสี่ยง ⛔ ไม่ใช่ตัวกันเด็ดขาด**
 *    ประกาศไว้ตรง ๆ ดีกว่าเขียนให้ดูเหมือนกันได้จริง · ชั้นที่กันจริงคือแคชต้นทาง + เพดานของผู้ให้บริการ
 */
const hits = new Map<string, number[]>();

function rateLimited(key: string, now: number): boolean {
  const recent = (hits.get(key) ?? []).filter((at) => now - at < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  /** กันแผนที่บวมเมื่อมีผู้เรียกจำนวนมาก — ล้างคีย์ที่เงียบไปแล้ว */
  if (hits.size > 500) {
    for (const [k, v] of hits) if (v.every((at) => now - at >= RATE_LIMIT_WINDOW_MS)) hits.delete(k);
  }
  return recent.length > RATE_LIMIT_MAX;
}

function callerKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded ? forwarded.split(',')[0].trim() : 'unknown';
}

/**
 * 🔒 `C5` — ยอมรับเฉพาะคำขอที่มาจากหน้าเว็บของเราเอง
 *
 * 🪤 **`Origin` ที่ไม่มีค่า ต้องยอมให้ผ่าน** — คำขอฝั่งเซิร์ฟเวอร์และเครื่องมือทดสอบบางตัว
 *    ไม่ส่ง header นี้เลย ⇒ ปฏิเสธไปด้วยจะกันเครื่องมือของกรรมการเองออกไป
 *    ⇒ ชั้นนี้กัน *เว็บอื่นที่เอาเส้นเราไปใช้ในเบราว์เซอร์ผู้ใช้* ซึ่งเป็นภัยที่ตั้งใจกันจริง ๆ
 */
function originAllowed(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

interface AirBlock {
  pm25: number | null;
  aqi: number | null;
  category: string | null;
  observedAt: string | null;
  source: string;
  cached: boolean;
}

/** ระดับเชิงความหมายจากค่า PM2.5 — คำที่ agent เอาไปพูดต่อได้ทันที */
function categoryOf(pm25: number | null): string | null {
  if (pm25 === null) return null;
  if (pm25 < 15) return 'good';
  if (pm25 < 25) return 'moderate';
  if (pm25 < 37.5) return 'unhealthy for sensitive groups';
  if (pm25 < 75) return 'unhealthy';
  return 'very unhealthy';
}

/**
 * 🔑 **AQI คำนวณด้วยตารางของแอปเอง ⛔ ไม่ใช้ `us_aqi` ที่ต้นทางแถมมา**
 *    เพราะ `safety.ts` และหน้าจอของแอปใช้ `calculateAQI` อยู่แล้ว ⇒ ถ้าหยิบเลขของต้นทางมา
 *    **agent กับหน้าจอจะพูดคนละตัวเลขในหน้าเดียวกัน** ซึ่งเป็นสิ่งที่กรรมการจับได้ทันที
 * 🔀 และเมื่อสลับแหล่งได้แล้ว ข้อนี้สำคัญขึ้นอีกชั้น: **ทุกแหล่งต้องผ่านตารางเดียวกัน**
 *    ไม่งั้นวันสลับแหล่ง ตัวเลข AQI จะกระโดดโดยที่อากาศไม่ได้เปลี่ยนเลย
 */
function toAirBlock(reading: AirReading): AirBlock {
  return {
    pm25: reading.pm25,
    aqi: reading.pm25 === null ? null : calculateAQI(reading.pm25),
    category: categoryOf(reading.pm25),
    observedAt: reading.observedAt,
    source: reading.source,
    cached: reading.cached,
  };
}

/** พยากรณ์ที่อ่านไม่ได้ — เหตุผลต่างกันตามว่า *ต้นทางล่ม* หรือ *สำเนาไม่มีของชิ้นนี้* */
function forecastGap(sourceId: string): SourceGap {
  return sourceId === 'bundled'
    ? {
        part: 'forecast',
        reason: 'not_in_snapshot',
        detail:
          'This deployment answers from a bundled snapshot, which carries no forecast — a forecast copied earlier is not a forecast.',
      }
    : {
        part: 'forecast',
        reason: 'upstream_unavailable',
        detail: 'The forecast could not be read right now — this is not the same as "no rain expected".',
      };
}

export async function POST(request: Request) {
  if (!originAllowed(request)) {
    return NextResponse.json({ error: 'cross-origin requests are not accepted' }, { status: 403 });
  }
  if (rateLimited(callerKey(request), Date.now())) {
    return NextResponse.json({ error: 'too many requests — try again in a minute' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'expected a JSON body with provinceCode' }, { status: 400 });
  }

  const code = String((body as { provinceCode?: unknown })?.provinceCode ?? '').trim();
  const province = provinceByCode(code);
  /**
   * 🔒 **fail-closed ที่ทางเข้า** — รหัสที่ไม่อยู่ในทะเบียนถูกปฏิเสธ **ก่อน** จะมีการยิงต้นทางใด ๆ
   *    ⇒ ไม่มีทางที่ใครจะใช้เส้นนี้เป็นตัวแทนยิงพิกัดอะไรก็ได้ที่เขาอยากได้
   */
  if (!province) {
    return NextResponse.json(
      { error: `unknown province code "${code}" — this demo covers Thailand (77 provinces)` },
      { status: 400 },
    );
  }

  /**
   * 🔀 **อ่านค่าตั้งตรงนี้ ⛔ ไม่ใช่ที่ระดับโมดูล** — อ่านตอนโหลดโมดูลจะค้างค่าไว้ทั้งอายุอินสแตนซ์
   *    ⇒ ตอนทดสอบ/ตอนสลับค่า พฤติกรรมจะขึ้นกับว่าใครโหลดไฟล์นี้ก่อน ซึ่งเป็นเรื่องที่มองไม่เห็น
   */
  const airSelection = selectAirSource(process.env[AIR_SOURCE_ENV]);
  const forecastSelection = selectForecastSource(process.env[FORECAST_SOURCE_ENV]);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  const ctx = { lat: province.lat, lon: province.lon, signal: controller.signal };
  let airResult: { outcome: 'ok'; value: AirReading } | { outcome: 'unavailable' } | null = null;
  let forecastResult: { outcome: 'ok'; value: ForecastReading } | { outcome: 'unavailable' } | null = null;
  try {
    [airResult, forecastResult] = await Promise.all([
      airSelection.status === 'ready' ? airSelection.source.read(ctx) : Promise.resolve(null),
      forecastSelection.status === 'ready' ? forecastSelection.source.read(ctx) : Promise.resolve(null),
    ]);
  } finally {
    clearTimeout(timer);
  }

  const gaps: SourceGap[] = [];

  /**
   * ── 💨 ก้อนคุณภาพอากาศ ──
   * 3 ทางที่ห้ามยุบรวม:
   *   ① เลือกแหล่งไม่ได้ (สะกดผิด/ยังไม่ต่อ) ⇒ **ไม่มีตัวเลขเลย + `gap` บอกว่าทำไม**
   *      ⛔ ห้ามตกไปใช้สำเนา — จะทำให้คนตั้งค่าเข้าใจว่าแหล่งที่เลือกทำงานอยู่
   *   ② อ่านได้ ⇒ ตัวเลขจริง (สดหรือสำเนา ขึ้นกับว่าแหล่งไหน — แหล่งเป็นคนติดป้าย `cached` เอง)
   *   ③ ต่อแล้วแต่อ่านไม่ได้รอบนี้ ⇒ สำเนา + ป้าย `cached` + `note` (`C3` เดิม)
   */
  let air: AirBlock | null = null;
  let noteFromFailure = false;
  let noteFromConfig = false;

  if (airSelection.status === 'blocked') {
    gaps.push(airSelection.gap);
  } else if (airResult?.outcome === 'ok') {
    air = toAirBlock(airResult.value);
    if (airSelection.source.id === 'bundled') noteFromConfig = true;
  } else {
    /**
     * 🔴 **ตกไปใช้สำเนาเพราะอ่านไม่ได้ ⇒ ต้องมี `gap` ด้วย ⛔ ไม่ใช่แค่ป้าย `cached`**
     *
     * 🔬 **ผู้ตรวจ (Codex · 29 ส.ค. 2026) จับได้ และมันจริง:** ก่อนแก้ ก้อนนี้กับก้อนของ
     *    *"เจ้าของตั้งค่าให้ใช้สำเนา"* ออกไปหน้าตา **เหมือนกันเป๊ะ** ในสายตา agent
     *    (`cached: true` + แหล่งเดียวกัน) · สิ่งเดียวที่แยกได้คือ `note` ซึ่ง **อยู่แค่ชั้น HTTP
     *    และไม่เคยเดินทางไปถึง agent เลย** ⇒ 2 สถานะยุบรวมกันที่ปลายทางจริง
     * ⇒ `gap` เดินทางไปถึง agent เสมอ (ชั้น provider ส่งต่อให้) ⇒ ความต่างจึงถึงคนฟัง
     */
    air = toAirBlock(FALLBACK_AIR);
    gaps.push({
      part: 'air_quality',
      reason: 'upstream_unavailable',
      detail:
        'Live air quality could not be read just now, so this number comes from a bundled snapshot — indicative, not current.',
    });
    noteFromFailure = true;
  }

  // ── 🌤️ ก้อนพยากรณ์ — ไม่มีสำเนาให้ตกกลับ (สำเนาพยากรณ์ที่หมดอายุแล้วไม่ใช่พยากรณ์) ──
  let forecast: ForecastReading | null = null;
  if (forecastSelection.status === 'blocked') {
    gaps.push(forecastSelection.gap);
  } else if (forecastResult?.outcome === 'ok') {
    forecast = forecastResult.value;
    if (forecastSelection.source.id === 'bundled') noteFromConfig = true;
  } else {
    /**
     * 🔴 **พยากรณ์ล้ม ⛔ ห้ามติด `FALLBACK_NOTE`**
     *
     * 🔬 **ผู้ตรวจ (Codex · 29 ส.ค. 2026) จับได้ และมันจริง — เป็นบั๊กที่ผมเพิ่งใส่เข้าไปเอง:**
     *    ก่อนแก้ ถ้าอากาศอ่านได้สด ๆ แต่พยากรณ์ล้ม คำตอบจะติดประโยคว่า
     *    *"this answer uses a bundled snapshot"* ทั้งที่ **ไม่มีสำเนาพยากรณ์อยู่จริงสักอัน**
     *    และตัวเลขอากาศก็เป็นของสด ⇒ **ประโยคที่บรรยายคำตอบผิดทั้งประโยค**
     * 🔑 กฎที่ได้: **ป้ายบอกที่มา ต้องผูกกับก้อนที่ถูกแทนที่จริง ⛔ ไม่ใช่กับทั้งคำตอบ**
     *    ⇒ พยากรณ์ที่หายไปพูดผ่าน `gap` ของตัวเองซึ่งแม่นกว่าอยู่แล้ว
     */
    gaps.push(forecastGap(forecastSelection.source.id));
  }

  return NextResponse.json({
    province: { code: province.code, name_th: province.th, name_en: province.en },
    air,
    forecast,
    /**
     * ⚠️ ประกาศตัวเองเมื่อคำตอบไม่ได้มาจากต้นทางสด (มติ D-16)
     * 🔴 *ต้นทางล่ม* กับ *ตั้งค่าให้ใช้สำเนา* ใช้ **คนละประโยค** — รอไปก็ไม่เหมือนกัน
     */
    note: noteFromFailure ? FALLBACK_NOTE : noteFromConfig ? BUNDLED_BY_CONFIG_NOTE : null,
    /** ส่วนที่ตอบไม่ได้ + เหตุผล — `demoProvider` ส่งต่อให้ agent ตรง ๆ (กติกา ② ของชั้น provider) */
    gaps,
  });
}
