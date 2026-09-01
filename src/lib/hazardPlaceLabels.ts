// src/lib/hazardPlaceLabels.ts
// ────────────────────────────────────────────────────────────────────────────
// 🏷️ **ป้ายชื่อสถานที่บนแผนที่** (`v7.1/SP2` WP6 · เลน 3)
//
// ── 🔴 ทำไมป้ายชื่อเป็น DOM ไม่ใช่ layer ชนิด `symbol` ของ MapLibre ──
// MapLibre วาดตัวอักษรได้ต่อเมื่อมี `glyphs` (ไฟล์ฟอนต์ `.pbf`) ให้โหลด
// บักเก็ตของเรามีแค่ `th_basemap_z12.pmtiles` ไฟล์เดียว **ไม่มีชุดฟอนต์เลย**
// ⇒ ทางเลือกคือ ① โฮสต์เซิร์ฟเวอร์ฟอนต์เอง ② พึ่งของคนอื่น ③ วาดเป็น DOM
//   ② ถูกตัดตั้งแต่ WP4: เพิ่ม third-party ให้จอภัยพิบัติ = เพิ่มจุดที่จอพังโดยที่เราคุมไม่ได้
//   ③ ได้เปรียบเพิ่มอีกอย่างที่สำคัญกับ **เกณฑ์สวยข้อ ③ (อ่านได้ที่จอสว่าง 30%)**:
//      ป้าย DOM คุมด้วย CSS ได้เต็มที่ (น้ำหนักฟอนต์ · เงา · ขอบ · คอนทราสต์) และใช้โทเคนสีของระบบได้จริง
//      ⛔ ต่างจาก WebGL ที่อ่าน `var(--color-ink)` ไม่ได้ (เหตุผลที่ `hazardMapPalette` ต้องมีสำเนาสี)
//
// ── 🔬 ที่มาของกติกาในไฟล์นี้: ยิงชั้น `places` ของไฟล์จริงแล้วอ่านออกมาเอง (28 ส.ค. 2026) ──
// ⛔ **ไม่ได้เดา schema** — วัดจากไฟล์ PMTiles ตัวจริงในเบราว์เซอร์:
//   · ช่องที่มีจริง: `name` · `name:en` · `kind` · `kind_detail` · `population` · `population_rank`
//     · `min_zoom` · `capital` · `sort_key` (+ `name:<ภาษา>` อีก 40 กว่าภาษา)
//   · 🪤 **ไม่มี `name:th`** — และ `name` คือ **ชื่อท้องถิ่น** ไม่ใช่ชื่อไทย
//     ⇒ ที่ zoom 5 ในกรอบไทย มี 25 แห่ง แต่ `name` เป็นอักษรไทยแค่ **16/25**
//       ที่เหลือเป็นเขมร (`កម្ពុជា`) ลาว (`ປະເທດລາວ`) พม่า (`မြိတ်မြို့`) ⇒ คนไทยอ่านไม่ออกเลย
//   · จำนวนสถานที่ในกรอบไทยต่อ zoom: **z5 = 25 · z6 = 58 · z8 = 72 · z10 = 363**
//     ⇒ ที่ z10 การวางป้ายทุกใบเป็น DOM = 363 โหนดที่ต้องขยับทุกเฟรม ⇒ **ต้องมีเพดานและตัวคัด**

/** ช่องที่เราใช้จริงจากชั้น `places` — ⛔ ประกาศเท่าที่ยิงเห็นจริง ไม่ประกาศเผื่อ */
export interface RawPlaceProperties {
  name?: unknown;
  'name:en'?: unknown;
  kind?: unknown;
  kind_detail?: unknown;
  population?: unknown;
  population_rank?: unknown;
  min_zoom?: unknown;
  capital?: unknown;
}

export interface RawPlaceFeature {
  properties?: RawPlaceProperties | null;
  geometry?: { type?: string; coordinates?: unknown } | null;
}

export interface PlaceCandidate {
  /** ชื่อท้องถิ่นตามที่ไฟล์แผนที่ส่งมา (อาจเป็นเขมร/ลาว/พม่า — ดู `pickPlaceName`) */
  name: string;
  /** `name:en` ของไฟล์แผนที่ — ตัวสำรองเมื่อชื่อท้องถิ่นอ่านไม่ออกสำหรับผู้ใช้ไทย */
  enName: string;
  lon: number;
  lat: number;
  rank: number;
  kind: string;
  isCapital: boolean;
  /** 🆕 ระดับของป้าย — ดู `PlaceTier` */
  tier: PlaceTier;
}

export interface PlaceLabel extends PlaceCandidate {
  x: number;
  y: number;
}

export type CopyLang = 'th' | 'en';

/**
 * 🆕 **ระดับของป้ายชื่อ** (`v7.1/SP2` WP7 · คำสั่งเจ้าของ 28 ส.ค. ค่ำ *"ตรวจชื่อจังหวัดในแผนที่ให้ถูกต้อง"*)
 *
 * 🔴 **ทำไมเรื่องนี้ไม่ใช่เรื่องความสวยงาม:** ประกาศเตือนภัยทางการออกเป็น **รายจังหวัด**
 *    (`geocode` ISO3166-2) ⇒ ผู้ใช้ที่เห็น *"ปากช่อง"* กับ *"นครราชสีมา"* ด้วยสไตล์เดียวกัน
 *    จะอ่านว่าเป็นหน่วยเดียวกัน แล้ว **จับคู่ประกาศผิดหน่วย**
 *
 * - `province` — ชื่อตรงกับทะเบียน 77 จังหวัดของเรา ([[C-14]] §8)
 * - `country`  — ชื่อประเทศจากไฟล์แผนที่ (`kind === 'country'`)
 * - `place`    — อย่างอื่นทั้งหมด (อำเภอ · เมือง · สถานที่ต่างประเทศ)
 *   ⚠️ **`place` แปลว่า *"ไม่ยืนยันว่าเป็นจังหวัด"* ⛔ ไม่ใช่ *"ยืนยันว่าเป็นอำเภอ"***
 *      — ทะเบียนของเราตอบได้แค่ทิศเดียว ⇒ ถ้อยคำบนตำนานสีต้องไม่กล่าวเกินนี้
 */
export type PlaceTier = 'province' | 'country' | 'place';

/**
 * ชุดชื่อที่ใช้ตัดสินว่าใบไหนเป็นจังหวัด — **มาจากหลังบ้านเท่านั้น** (`hazardConfig.provinceNameSet`)
 * ⛔ ชุดว่าง = จอไม่ติดยศให้ใครเลย (หลังบ้านรุ่นเก่า) ⇒ กลับไปพฤติกรรมเดิมทั้งหมด
 */
export interface ProvinceNames {
  th: Set<string>;
  en: Set<string>;
}

export const NO_PROVINCE_NAMES: ProvinceNames = { th: new Set(), en: new Set() };

/**
 * 🔴 **ตัวตัดสินระดับป้าย — เทียบตรงตัวหลัง trim เท่านั้น**
 *
 * 🪤 **ทำไมต้องเทียบทั้ง `name` และ `name:en` ไม่ใช่เฉพาะชื่อที่จะแสดง:**
 *    ไฟล์แผนที่บางใบมี `name` เป็นอักษรอื่น (เขมร/พม่า) แต่ `name:en` ตรงกับจังหวัดไทย
 *    และผู้ใช้ EN จะเห็น `name:en` ⇒ ถ้าตัดสินจาก *ชื่อที่แสดง* อย่างเดียว **ระดับของป้ายใบเดียวกัน
 *    จะเปลี่ยนตามภาษาที่ผู้ใช้เลือก** ซึ่งเป็นไปไม่ได้ในความเป็นจริง
 *    ⇒ ระดับต้องเป็นคุณสมบัติของ **สถานที่** ⛔ ไม่ใช่ของ **การแสดงผล**
 *
 * ⛔ ไม่ตัดคำนำหน้า `จังหวัด`/`จ.` ที่นี่ — กติกานั้นเป็นของ `provinceRegistry.findByThaiName`
 *    ฝั่ง BE ที่เดียว ([[C-14]] §8 ข้อ 4 · มีเทส `tests/hazardProvincePayload.test.js` ยึดไว้)
 */
export function classifyPlaceTier(
  props: { name?: unknown; 'name:en'?: unknown; kind?: unknown } | null | undefined,
  provinces: ProvinceNames,
): PlaceTier {
  const kind = typeof props?.kind === 'string' ? props.kind : '';
  if (kind === 'country') return 'country';

  const local = typeof props?.name === 'string' ? props.name.trim() : '';
  const en = typeof props?.['name:en'] === 'string' ? (props['name:en'] as string).trim() : '';
  if ((local && provinces.th.has(local)) || (en && provinces.en.has(en))) return 'province';
  return 'place';
}

/** ช่วงยูนิโคดของอักษรไทย */
const THAI_BLOCK = /[฀-๿]/;

/**
 * ครึ่งความกว้างโดยประมาณต่อ 1 ตัวอักษร (พิกเซล) — ใช้กันป้ายถูกตัดที่ขอบจอ
 * 🔑 ค่านี้เป็น **การประมาณที่ตั้งใจให้เผื่อสูง** — ป้ายที่หายไปเพราะกันไว้เกิน
 *    เสียหายน้อยกว่าป้ายที่โผล่มาครึ่งใบ (ป้ายครึ่งใบอ่านผิดได้ เช่นชื่อจังหวัดที่ถูกตัดหัว)
 */
const HALF_CHAR_PX = 4;
/** เพดานของการประมาณ — ชื่อยาวมากไม่ควรถูกกันจนหายทั้งจอ */
const MAX_LABEL_HALF_WIDTH_PX = 90;

/** ความสูงของบรรทัดป้าย (ตรงกับ `text-[11px]`/`text-[13px]` + ระยะเยื้องลงของจอ) */
const LABEL_LINE_HEIGHT_PX = 16;
/** ช่องว่างขั้นต่ำระหว่างกล่องป้าย 2 ใบ — ป้ายที่ชิดกันจนอ่านเป็นคำเดียวคือป้ายที่อ่านผิดได้ */
const LABEL_GAP_PX = 6;

/**
 * 🔴 **ชื่อที่ผู้ใช้อ่านออก ⛔ ไม่ใช่ `name` ดิบ**
 *
 * 🪤 ชั้น `places` **ไม่มี `name:th`** และ `name` คือ **ชื่อท้องถิ่นของที่นั่น**
 *    ⇒ ผู้ใช้ไทยที่เปิดจอจะเห็น `កម្ពុជា` / `ປະເທດລາວ` / `မြိတ်မြို့` ปนอยู่กลางแผนที่
 *    ⇒ ป้ายที่อ่านไม่ออก **แย่กว่าไม่มีป้าย** เพราะมันกินพื้นที่และดึงสายตาไปจากชั้นภัยพิบัติ
 *
 * กติกา:
 *   · `th` → ใช้ `name` **เฉพาะเมื่อมีอักษรไทย** · ไม่งั้นตกไป `name:en`
 *   · `en` → ใช้ `name:en` ก่อนเสมอ · ไม่มีค่อยตกมาที่ `name`
 *   · ไม่มีอะไรใช้ได้เลย = `null` ⇒ **ไม่วางป้ายใบนั้น** ⛔ ไม่ใส่ข้อความแทน
 */
export function pickPlaceName(props: RawPlaceProperties | null | undefined, lang: CopyLang): string | null {
  const local = typeof props?.name === 'string' ? props.name.trim() : '';
  const en = typeof props?.['name:en'] === 'string' ? (props['name:en'] as string).trim() : '';

  if (lang === 'th') {
    if (local && THAI_BLOCK.test(local)) return local;
    if (en) return en;
    return local || null;
  }
  if (en) return en;
  return local || null;
}

/** อ่านตัวเลขแบบเข้มงวด — ⛔ `Number(null) = 0` จะทำให้ของที่ไม่มีอันดับกลายเป็นอันดับ 0 */
function strictNum(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * คัด + เรียงลำดับความสำคัญของสถานที่
 *
 * 🔑 **ตัวคัดหลักคือ `min_zoom` ของไฟล์เอง ⛔ ไม่ใช่เกณฑ์ที่เราคิดขึ้น**
 *    ไฟล์แผนที่รู้ดีกว่าเราว่าชื่อไหนควรโผล่ที่ zoom ไหน (คนทำแผนที่คัดมาแล้ว)
 *    ⇒ เราคัดซ้ำเองเมื่อไร = เดาแทนคนที่มีข้อมูลมากกว่า
 * 📌 `population_rank` ใช้เป็น **ลำดับความสำคัญ** เมื่อพื้นที่ไม่พอ ⛔ ไม่ใช่ตัวคัดเข้า/ออก
 */
export function rankPlaces(
  features: RawPlaceFeature[],
  zoom: number,
  provinces: ProvinceNames = NO_PROVINCE_NAMES,
): PlaceCandidate[] {
  const seen = new Set<string>();
  const out: PlaceCandidate[] = [];

  for (const f of features || []) {
    const props = f?.properties;
    const coords = f?.geometry?.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) continue;
    const lon = strictNum(coords[0]);
    const lat = strictNum(coords[1]);
    if (lon === null || lat === null) continue;

    const minZoom = strictNum(props?.min_zoom);
    // ไม่มี `min_zoom` = ปล่อยผ่าน (ให้เพดานจำนวนเป็นตัวคุมแทน) ⛔ ไม่ทิ้งของที่อาจสำคัญ
    if (minZoom !== null && zoom + 0.0001 < minZoom) continue;

    const name = typeof props?.name === 'string' ? props.name.trim() : '';
    const enName = typeof props?.['name:en'] === 'string' ? (props['name:en'] as string).trim() : '';
    if (!name && !enName) continue;

    /**
     * 🪤 **กันซ้ำด้วยชื่อ + พิกัดปัดหยาบ** — vector tile ส่งฟีเจอร์เดียวกันซ้ำได้เมื่อมันคาบกระเบื้อง
     *    (เหตุผลเดียวกับที่ชั้นน้ำท่วมต้องใช้ `promoteId`)
     */
    const key = `${name}|${enName}|${lon.toFixed(3)},${lat.toFixed(3)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({
      name,
      enName,
      lon,
      lat,
      rank: strictNum(props?.population_rank) ?? 0,
      kind: typeof props?.kind === 'string' ? props.kind : '',
      isCapital: props?.capital === 'yes',
      tier: classifyPlaceTier(props, provinces),
    });
  }

  /**
   * 🔴 **จังหวัดมาก่อน `population_rank` ⛔ ไม่ใช่หลัง** (แก้ `v7.1/SP2` WP7)
   *
   * 🔬 หลักฐานที่บังคับลำดับนี้ (วัดของจริงบนจอ 29 ส.ค. 2026):
   *    `หันคา` (อำเภอ) มี `population_rank` = **8 เท่ากับ `สระบุรี` (จังหวัด)**
   *    ⇒ บนจอมือถือ 393px ที่วางป้ายได้ 10 ใบ ผลจริงคือ **อำเภอ 3 ใบเบียด `นครราชสีมา` ตกจอ**
   *    ⇒ ผู้ใช้ที่เปิดจอเพื่อหาจังหวัดของตัวเอง ได้ชื่ออำเภอที่ไม่รู้จักแทน
   * 📌 ภายในระดับเดียวกันยังใช้ `population_rank` ของไฟล์แผนที่เหมือนเดิม —
   *    เราไม่ได้แทนที่การจัดอันดับของคนทำแผนที่ แค่บอกว่า **หน่วยที่ประกาศเตือนภัยใช้ ต้องได้เห็นก่อน**
   */
  const tierWeight = (t: PlaceTier) => (t === 'country' ? 2 : t === 'province' ? 1 : 0);
  out.sort((a, b) => {
    const wa = tierWeight(a.tier);
    const wb = tierWeight(b.tier);
    if (wa !== wb) return wb - wa;
    if (b.rank !== a.rank) return b.rank - a.rank;
    if (a.isCapital !== b.isCapital) return a.isCapital ? -1 : 1;
    return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
  });
  return out;
}

export interface LayoutOptions {
  /** ขนาดพื้นที่แผนที่เป็นพิกเซล */
  viewport: { width: number; height: number };
  /** เพดานจำนวนป้ายที่ยอมให้อยู่บนจอพร้อมกัน */
  max: number;
  /** ระยะห่างขั้นต่ำระหว่างจุดกึ่งกลางของ 2 ป้าย (พิกเซล) */
  minGapPx: number;
  /** ขอบที่ป้ายต้องไม่ล้นออกไป */
  edgePaddingPx: number;
  /** ภาษาที่ใช้เลือกชื่อ */
  lang: CopyLang;
  /** ⛔ ห้ามวางป้ายทับพื้นที่นี้ (แถบสรุป/ปุ่ม) — พิกัดพิกเซลบนผืนแผนที่ */
  avoid?: Array<{ x: number; y: number; width: number; height: number }>;
}

/**
 * วางป้ายจริงบนพิกเซล — คัดตัวที่ชนกันออกด้วยวิธี "มาก่อนได้ก่อน ตามลำดับความสำคัญ"
 *
 * 🔑 **ทำไมต้องคัดชนเอง ทั้งที่ MapLibre ทำให้ได้:** เพราะเราไม่ได้ใช้ `symbol` layer (ไม่มีฟอนต์)
 * 🔴 **เพดานจำนวนไม่ใช่ของประดับ** — วัดจริงที่ z10 มีสถานที่ในกรอบไทย **363 แห่ง**
 *    ⇒ ปล่อยให้วางครบ = 363 โหนด DOM ที่ต้องคำนวณตำแหน่งใหม่ทุกเฟรมตอนลากแผนที่
 *      บนเครื่องเป้าหมายของเรา (UHD 620 · Android กลาง) นั่นคือจอที่ลากไม่ลื่น
 *
 * @param project ฟังก์ชันแปลง lon/lat → พิกเซล (ฉีดเข้ามาเพื่อให้เทสได้โดยไม่ต้องมี WebGL)
 */
export function layoutPlaceLabels(
  candidates: PlaceCandidate[],
  project: (lon: number, lat: number) => { x: number; y: number },
  opts: LayoutOptions,
): PlaceLabel[] {
  const { viewport, max, minGapPx, edgePaddingPx, lang, avoid = [] } = opts;
  const placed: PlaceLabel[] = [];
  const minGapSq = minGapPx * minGapPx;

  for (const c of candidates) {
    if (placed.length >= max) break;

    const name = pickPlaceName({ name: c.name, 'name:en': c.enName }, lang);
    // หาชื่อที่ผู้ใช้อ่านออกไม่ได้ = ⛔ ไม่วางป้าย (ป้ายที่อ่านไม่ออกแย่กว่าไม่มีป้าย) และไม่กินโควตาเพดาน
    if (!name) continue;

    const p = project(c.lon, c.lat);
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;

    /**
     * 🪤 **ต้องกันขอบด้วย *ความกว้างของป้าย* ⛔ ไม่ใช่แค่จุดยึด**
     *    ป้ายวางแบบจัดกึ่งกลางบนจุด ⇒ เช็กเฉพาะจุดยึดจะได้ป้ายยาว ๆ ที่ **ถูกตัดครึ่ง** ที่ขอบจอ
     *    (เจอของจริงตอนเปิดเบราว์เซอร์: *"Andaman and Nicobar Islands"* โผล่มาเป็น *"…an and Nicobar Islands"*)
     *    ⇒ ประมาณความกว้างจากจำนวนตัวอักษร — ⛔ ไม่วัดจริงเพราะต้องแตะ DOM ทุกเฟรม (แพงเกินไป)
     *      `HALF_CHAR_PX` เผื่อไว้ด้านสูงเล็กน้อย: ป้ายที่ถูกตัดออกเพราะกันไว้เกิน เสียหายน้อยกว่าป้ายที่โผล่มาครึ่งใบ
     */
    const halfWidthPx = Math.min(name.length * HALF_CHAR_PX, MAX_LABEL_HALF_WIDTH_PX);
    if (p.x - halfWidthPx < edgePaddingPx || p.x + halfWidthPx > viewport.width - edgePaddingPx) continue;
    if (p.y < edgePaddingPx || p.y > viewport.height - edgePaddingPx) continue;

    // ⛔ ห้ามทับพื้นที่ที่จอจองไว้ (แถบสรุปคือสิ่งที่ผู้ใช้ต้องอ่านได้ก่อนอย่างอื่น)
    if (avoid.some((r) => p.x >= r.x && p.x <= r.x + r.width && p.y >= r.y && p.y <= r.y + r.height)) continue;

    /**
     * 🆕 **คัดชนด้วย 2 เงื่อนไข ⛔ ไม่ใช่รัศมีอย่างเดียว** (`v7.1/SP2` WP7)
     *
     * 🔬 **ปัญหาที่วัดได้จริงบนจอ 393px (29 ส.ค. 2026):** รัศมีคงที่ 78px วางป้ายได้
     *    **2 ใบ** ที่ระยะทั้งประเทศ และ **10 ใบ** ที่ z8 ⇒ ผู้ใช้มือถือแทบไม่มีชื่อให้ยึด
     *    แต่ **ลดรัศมีเฉย ๆ ไม่ได้** เพราะป้ายยาวอย่าง `พระนครศรีอยุธยา` จะทับกันจริง
     *
     * ✅ ทางที่ใช้: ให้ *รัศมี* เป็นเพียง **พื้นขั้นต่ำที่สเกลตามจอ** แล้วให้ **กล่องของป้ายจริง**
     *    เป็นตัวกันทับ ⇒ ชื่อสั้น (`ตาก`) เบียดกันได้ · ชื่อยาวยังกันระยะเท่าที่มันกว้างจริง
     *    ⇒ ได้ป้ายมากขึ้นบนจอเล็ก **โดยไม่มีป้ายทับกันเพิ่มขึ้นเลย**
     * 📌 ใช้ตัวประมาณความกว้างตัวเดียวกับที่ใช้กันขอบจอ — ⛔ ไม่สร้างตัวที่ 2 ที่จะดริฟต์กันวันหลัง
     */
    let collides = false;
    for (const q of placed) {
      const dx = q.x - p.x;
      const dy = q.y - p.y;
      if (dx * dx + dy * dy < minGapSq) { collides = true; break; }
      const qHalf = Math.min(q.name.length * HALF_CHAR_PX, MAX_LABEL_HALF_WIDTH_PX);
      const overlapX = Math.abs(dx) < halfWidthPx + qHalf + LABEL_GAP_PX;
      const overlapY = Math.abs(dy) < LABEL_LINE_HEIGHT_PX + LABEL_GAP_PX;
      if (overlapX && overlapY) { collides = true; break; }
    }
    if (collides) continue;

    placed.push({ ...c, name, x: p.x, y: p.y });
  }

  return placed;
}

/**
 * ทางเข้าเดียวที่ผืนแผนที่เรียก — รวม 3 ขั้นไว้ให้เรียกครั้งเดียว
 * 🔑 แยกเป็น 3 ฟังก์ชันข้างบนเพื่อให้เทสจับผิดได้ทีละขั้น ⛔ ไม่ใช่ก้อนเดียวที่เทสได้แค่ปลายทาง
 */
export function selectPlaceLabels(
  features: RawPlaceFeature[],
  zoom: number,
  project: (lon: number, lat: number) => { x: number; y: number },
  opts: LayoutOptions,
  provinces: ProvinceNames = NO_PROVINCE_NAMES,
): PlaceLabel[] {
  return layoutPlaceLabels(rankPlaces(features, zoom, provinces), project, opts);
}

/** เพดานที่จอใช้จริง — ประกาศไว้ที่เดียวเพื่อให้เทสและจออ้างค่าเดียวกัน */
export const PLACE_LABEL_DEFAULTS = {
  max: 28,
  minGapPx: 78,
  edgePaddingPx: 16,
} as const;

/** จอที่ค่า `minGapPx: 78` ถูกจูนไว้ให้ — โน้ตบุ๊ก/เดสก์ท็อป */
export const REFERENCE_VIEWPORT_PX = 1280;
/** พื้นขั้นต่ำ — ต่ำกว่านี้ป้ายจะเริ่มเรียงเป็นแถวจนอ่านเป็นย่อหน้าแทนที่จะเป็นป้าย */
export const MIN_GAP_FLOOR_PX = 40;

/**
 * 🆕 **ระยะขั้นต่ำที่สเกลตามความกว้างจอ** (`v7.1/SP2` WP7)
 *
 * 🔬 ทำไมต้องมี: ค่าเดิม 78px คงที่ ⇒ บนจอ 393px มันกินพื้นที่เท่ากับ **20% ของความกว้างจอ**
 *    ขณะที่บนจอ 1280px กินแค่ 6% ⇒ ผู้ใช้มือถือได้ป้าย 2–5 ใบ ส่วนเดสก์ท็อปได้ 15 ใบ
 *    (วัดของจริง 29 ส.ค. 2026 — ดูตัวเลขที่ `layoutPlaceLabels`)
 * 🔒 มีพื้นที่ `MIN_GAP_FLOOR_PX` เพราะระยะที่เล็กเกินไปทำให้ป้ายเกาะกันเป็นพืด
 *    และตัวกันทับจริง (กล่องของป้าย) ทำงานอยู่แล้วอีกชั้นหนึ่ง
 */
export function responsiveMinGapPx(viewportWidthPx: number): number {
  if (!Number.isFinite(viewportWidthPx) || viewportWidthPx <= 0) return PLACE_LABEL_DEFAULTS.minGapPx;
  const scaled = Math.round((PLACE_LABEL_DEFAULTS.minGapPx * viewportWidthPx) / REFERENCE_VIEWPORT_PX);
  return Math.min(PLACE_LABEL_DEFAULTS.minGapPx, Math.max(MIN_GAP_FLOOR_PX, scaled));
}
