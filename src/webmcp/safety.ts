// src/webmcp/safety.ts
// ────────────────────────────────────────────────────────────────────────────
// 🧭 **ชั้นตัดสินใจ — "ทำกิจกรรมนี้ตอนนี้ได้ไหม"** (เบื้องหลัง tool `get_safety_briefing`)
//
// 🔴 **ทำไมชั้นนี้ไม่ได้อยู่ใน provider:** provider ตอบว่า *ข้อมูลมาจากไหน* ส่วนไฟล์นี้ตอบว่า
//    *เราตัดสินยังไง* ⇒ คำตัดสินต้อง **เหมือนกันทุกที่** ไม่ว่าข้อมูลจะมาจาก BFF จริงหรือแหล่งเดโม
//    ⛔ ถ้าปล่อยให้แต่ละ provider ตัดสินเอง ตัวส่งแข่งกับผลิตภัณฑ์จริงจะแนะนำคนละอย่างวันหนึ่ง
//
// 🔑 **จุดที่ทำให้ tool นี้มีค่ากว่า `get_environment_snapshot`:** agent เรียกครั้งเดียวแล้วได้
//    *คำแนะนำ + เหตุผลที่อ้างข้อมูลจริง* ⇒ เอาไปตอบผู้ใช้จบในเทิร์นเดียว โดยไม่ต้องให้ LLM
//    เดาเกณฑ์ฝุ่นเอง (ซึ่งเป็นจุดที่โมเดลมั่วบ่อยที่สุดเวลาพูดเรื่องสุขภาพ)
//
// ⚠️ **ไม่มีข้อมูล ≠ ปลอดภัย** — ขาดข้อมูลต้องได้ระดับ `unknown` พร้อมบอกว่าขาดอะไร
//    ⛔ ห้าม default เป็น `good` เด็ดขาด (นั่นคือการบอกคนว่าออกไปได้ทั้งที่เราไม่รู้)

import { calculateAQI } from '@/lib/aqi';
import type { EnvironmentSnapshot } from './providers/types';

/** กิจกรรมที่รองรับ — ค่าเชิงความหมาย ⛔ ไม่ใช่รหัสตัวเลข (agent อ่านออกเอง) */
export type SafetyActivity = 'general' | 'outdoor_exercise' | 'children_outdoors' | 'travel';

export const SAFETY_ACTIVITIES: readonly SafetyActivity[] = [
  'general',
  'outdoor_exercise',
  'children_outdoors',
  'travel',
] as const;

/**
 * ระดับคำแนะนำ — เรียงจากปลอดภัยไปหาไม่ควรทำ
 * 🔑 `unknown` **ไม่ได้อยู่บนสเกลเดียวกัน** — มันแปลว่า "ตอบไม่ได้" ไม่ใช่ "อยู่ตรงกลาง"
 */
export type SafetyLevel = 'good' | 'caution' | 'avoid' | 'unknown';

export interface SafetyReason {
  /** รหัสเชิงความหมายให้เครื่องอ่าน เช่น `"pm25_high"` */
  code: string;
  /** ประโยค EN ที่ agent หยิบไปพูดต่อได้ทันที — อ้างตัวเลข/ชื่อประกาศจริงเสมอ */
  detail: string;
  /**
   * 🔢 **ค่าที่ประโยคนี้อ้างถึง** — มีไว้ให้ *จอ* ประกอบประโยคในภาษาของผู้ใช้เองได้
   *
   * 🔬 **ทำไมถึงเพิ่ม (30 ส.ค. 2026):** เจ้าของเปิดหน้าเว็บภาษาไทยแล้วเห็นการ์ดคำแนะนำ
   *    ยังเป็นอังกฤษ (`PM2.5 is 7.6 ug/m3 (AQI 32) — fine for this activity.`)
   *    🔴 **เดิมผมตัดสินว่าเป็น "ถ้อยคำที่ต้นทางกำหนด" (`R14`) จึงไม่แปล — ซึ่งผิด**
   *       `R14` คุ้มครองถ้อยคำของ **แหล่งข้อมูลภายนอก** (ชื่อแหล่ง · ชื่อ license · `event` จากกรมอุตุฯ)
   *       แต่ประโยคพวกนี้ **เราเขียนเองในไฟล์นี้** ⇒ ไม่มีเหตุผลอะไรที่มันจะแปลไม่ได้
   *    🔑 บทเรียน: **"ไม่แปล" ต้องมีเหตุผลว่า *ใครเป็นเจ้าของถ้อยคำ* ⛔ ไม่ใช่ว่ามันมาจากชั้นไหนของโค้ด**
   *
   * ⛔ `detail` ยังเป็น EN เสมอสำหรับ agent — จอเป็นคนแปล ⛔ ไม่ใช่เปลี่ยนภาษาที่ตัว tool
   */
  values?: Readonly<Record<string, string | number>>;
}

/** สิ่งที่ควรทำต่อ — มีรหัสเพื่อให้จอแปลได้เหมือน `SafetyReason` */
export interface SafetyAdvice {
  code: string;
  detail: string;
}

export interface SafetyAssessment {
  level: SafetyLevel;
  reasons: SafetyReason[];
  /** สิ่งที่ควรทำต่อ — ว่างได้เมื่อไม่มีอะไรต้องเตือน */
  advice: SafetyAdvice[];
}

/**
 * 📏 **เกณฑ์ PM2.5 (µg/m³) ที่ใช้ตัดสิน**
 *
 * ที่มา: ค่ามาตรฐานที่ระบบ AQI ของแอปใช้อยู่แล้ว (`src/lib/aqi.ts` — ตารางไทย)
 * ⛔ **ห้ามตั้งตัวเลขใหม่ที่นี่** ให้ยึดตารางเดียวกับที่จอแสดงผล ไม่งั้น agent กับจอจะพูดคนละเรื่อง
 * 🔑 ระดับกิจกรรมที่ไวกว่า (เด็ก/ออกกำลังกาย) ใช้เกณฑ์เตี้ยกว่า เพราะหายใจแรงและนานกว่า
 */
const PM25_CAUTION: Record<SafetyActivity, number> = {
  general: 37.5,
  travel: 37.5,
  outdoor_exercise: 25,
  children_outdoors: 25,
};

const PM25_AVOID: Record<SafetyActivity, number> = {
  general: 75,
  travel: 75,
  outdoor_exercise: 50,
  children_outdoors: 50,
};

/** ระดับความรุนแรงของ CAP ที่ถือว่า "อย่าเพิ่งออกไป" — ตามคำที่ต้นทางใช้จริง */
const SEVERE_CAP = new Set(['extreme', 'severe']);

/**
 * ⏳ **ใบนี้หมดอายุไปแล้วหรือยัง** — เทียบ `expires` ของประกาศกับเวลาที่ถาม
 *
 * 🔴 **ทำไมต้องมีตัวนี้ (เจอ 31 ส.ค. 2026 ค่ำ · Codex ชี้ · ตรวจซ้ำกับซอร์สแล้ว):**
 *    สแนปช็อตประกาศคัด "ฉบับที่ยังมีผล" ไว้ **ตอนถ่าย** (`ALERTS_CAPTURED_AT`) แล้ว
 *    **ไม่มีใครเช็กซ้ำอีกเลย** ⇒ พอเลยเวลา `expires` ไป ชั้นนี้ยังพูดว่า *currently in effect*
 *    ⇒ เครื่องมือความปลอดภัยยืนยันประกาศที่ตายแล้วว่ายังมีผล ซึ่งเป็นความผิดชนิดเดียวกับ
 *      คำเคลมที่เพิ่งถอดออกไปเมื่อ `558d5fc` · และตัวส่งแข่งถูกแช่แข็ง 3 สัปดาห์
 *      ⇒ **ตอนกรรมการตัดสิน ใบพวกนี้หมดอายุแน่นอน 100%**
 *
 * 🔑 **ทิศทางที่พลาดได้ทางเดียว** — อ่านวันหมดอายุไม่ออก (`null` หรือรูปแบบพัง)
 *    ⇒ ตอบว่า **ยังไม่หมดอายุ** ⛔ ไม่ใช่หมดอายุ · ข้อมูลที่ขาดต้องไม่ลดระดับคำเตือน
 *    (กติกาเดียวกับ `missing_alerts` ที่หัวไฟล์ — ไม่รู้ ≠ ปลอดภัย)
 */
function isAlertExpired(alert: { expires: string | null }, now: number): boolean {
  if (!alert.expires) return false;
  const expiresAt = Date.parse(alert.expires);
  if (!Number.isFinite(expiresAt)) return false;
  return expiresAt <= now;
}

function rank(level: SafetyLevel): number {
  if (level === 'avoid') return 3;
  if (level === 'caution') return 2;
  if (level === 'good') return 1;
  return 0;
}

/** ยกระดับขึ้นเท่านั้น — ⛔ ห้ามมีเส้นทางไหนลดระดับความเสี่ยงที่ประเมินไว้แล้ว */
function escalate(current: SafetyLevel, next: SafetyLevel): SafetyLevel {
  if (current === 'unknown') return next;
  if (next === 'unknown') return current;
  return rank(next) > rank(current) ? next : current;
}

/**
 * ประเมินจาก snapshot 1 ใบ — **ฟังก์ชันบริสุทธิ์ ⛔ ไม่มี I/O** (เทสยึดได้ทุกกิ่ง)
 *
 * @param now เวลาที่ใช้ตัดสินว่าประกาศหมดอายุหรือยัง — ⛔ รับเข้ามาแทนที่จะอ่านนาฬิกาข้างใน
 *            เพื่อให้ยังเป็นฟังก์ชันบริสุทธิ์ และเทสยึดกิ่ง "หมดอายุแล้ว" ได้โดยไม่ต้องแกล้งนาฬิกา
 */
export function assessSafety(
  snapshot: EnvironmentSnapshot,
  activity: SafetyActivity,
  now: number = Date.now(),
): SafetyAssessment {
  const reasons: SafetyReason[] = [];
  const advice: SafetyAdvice[] = [];
  let level: SafetyLevel = 'unknown';

  const pm25 = snapshot.air?.value.pm25 ?? null;
  if (typeof pm25 === 'number' && Number.isFinite(pm25)) {
    const aqi = calculateAQI(pm25);
    if (pm25 >= PM25_AVOID[activity]) {
      level = escalate(level, 'avoid');
      reasons.push({
        code: 'pm25_high',
        detail: `PM2.5 is ${pm25} ug/m3 (AQI ${aqi}) — unhealthy for this activity.`,
        values: { pm25, aqi },
      });
      advice.push({ code: 'advice_stay_indoors', detail: 'Stay indoors, or wear an N95 mask if you must go out.' });
    } else if (pm25 >= PM25_CAUTION[activity]) {
      level = escalate(level, 'caution');
      reasons.push({
        code: 'pm25_moderate',
        detail: `PM2.5 is ${pm25} ug/m3 (AQI ${aqi}) — acceptable but not clean.`,
        values: { pm25, aqi },
      });
      advice.push({ code: 'advice_keep_it_short', detail: 'Keep it short and avoid the busiest roads.' });
    } else {
      level = escalate(level, 'good');
      reasons.push({
        code: 'pm25_low',
        detail: `PM2.5 is ${pm25} ug/m3 (AQI ${aqi}) — fine for this activity.`,
        values: { pm25, aqi },
      });
    }
  }

  const alerts = snapshot.alerts?.value ?? null;
  /**
   * 🔴 **แยก "ยังมีผล" ออกจาก "หมดอายุแล้ว" ก่อนตัดสินใจอะไรทั้งสิ้น**
   *    ⛔ ใบที่หมดอายุห้ามยกระดับคำแนะนำ และห้ามถูกเรียกว่า *in effect*
   *    ✅ **แต่ยังต้องพูดถึงมัน** — เงียบไปเลยจะกลายเป็น "ไม่มีประกาศ" ซึ่งเป็นคนละข้อเท็จจริง
   *       (กติกาเดียวกับ `no_official_alert` ด้านล่าง)
   * 🔑 `get_environment_snapshot` **ยังส่งใบเต็มพร้อม `expires` ออกไปเหมือนเดิม** ⛔ ไม่ได้กรองทิ้ง
   *    ⇒ agent ยังอ่านวันหมดอายุเองแล้วตัดสินเองได้ (ของที่ยิงเจอจริงในเทส `A3` 30 ส.ค.)
   */
  const activeAlerts = alerts ? alerts.filter((a) => !isAlertExpired(a, now)) : null;
  const expiredAlerts = alerts ? alerts.filter((a) => isAlertExpired(a, now)) : [];
  if (activeAlerts && activeAlerts.length > 0) {
    const severe = activeAlerts.filter((a) => SEVERE_CAP.has(String(a.severity || '').toLowerCase()));
    if (severe.length > 0) {
      level = escalate(level, 'avoid');
      for (const alert of severe.slice(0, 2)) {
        reasons.push({
          code: 'official_alert_severe',
          detail: `Official alert in effect: ${alert.event || 'hazard'}${alert.headline ? ` — ${alert.headline}` : ''}.`,
          /** ⛔ `event`/`headline` เป็นถ้อยคำของกรมอุตุฯ — คงรูปเดิมทุกภาษา (`R14`) */
          values: { event: alert.event || 'hazard', headline: alert.headline || '' },
        });
      }
      advice.push({
        code: 'advice_follow_alert',
        detail: 'Follow the official alert first — it outranks air quality.',
      });
    } else {
      level = escalate(level, 'caution');
      reasons.push({
        code: 'official_alert_active',
        detail: `${activeAlerts.length} official alert(s) currently in effect for this province.`,
        values: { count: activeAlerts.length },
      });
    }
  } else if (alerts && expiredAlerts.length === 0) {
    /**
     * 🔑 **"อ่านได้ และไม่มีประกาศ" เป็นข้อเท็จจริงที่มีค่า** ⇒ พูดออกมา
     *    ⛔ ต่างจาก `alerts === null` (อ่านไม่ได้) ซึ่งจะไปโผล่ใน `gaps` แทน
     */
    reasons.push({ code: 'no_official_alert', detail: 'No official hazard alert is currently in effect here.' });
  }

  /**
   * ⏳ **ใบที่หมดอายุ — บอกตรง ๆ ว่ามีอยู่ และบอกว่ามันหมดอายุแล้ว**
   *    ⛔ ไม่ยกระดับคำแนะนำ (ประกาศที่ตายแล้วไม่ใช่ภัยปัจจุบัน)
   *    ⛔ และไม่เงียบ (เงียบ = คนฟังเข้าใจว่าไม่เคยมีประกาศเลย)
   */
  if (expiredAlerts.length > 0) {
    const events = expiredAlerts.map((a) => a.event || 'hazard').join(', ');
    reasons.push({
      code: 'official_alert_expired',
      detail:
        `${expiredAlerts.length} official alert(s) in this dated snapshot have expired and are ` +
        `not in effect now: ${events}.`,
      values: { count: expiredAlerts.length, events },
    });
  }

  /**
   * 🚧 **ส่วนที่ขาดถูกยกขึ้นมาเป็นเหตุผลด้วย** — คนอ่านคำตอบของ agent ไม่เห็นหน้าจอ
   *    ⇒ ถ้าไม่พูดว่า "ไม่มีข้อมูลฝุ่น" เขาจะเข้าใจว่าเราตรวจแล้วและมันโอเค
   */
  for (const gap of snapshot.gaps) {
    reasons.push({ code: `missing_${gap.part}`, detail: gap.detail });
  }

  /**
   * 🔴 **เพดานความมั่นใจ — ข้อมูลขาดต้องกดคำตอบที่ "ปลอดใจ" ลงเป็น `unknown`**
   *
   * 🔬 **ผู้ตรวจ (Gemini 5 มุม · 29 ส.ค. 2026) จับได้เป็น P0 และมันจริง:** เดิมถ้าค่าฝุ่นปกติ
   *    ระดับจะถูกยกเป็น `good` แล้ว **ค้างอยู่ที่ `good` แม้ชั้นประกาศเตือนภัยจะอ่านไม่ได้ทั้งชั้น**
   *    ⇒ ระบบเตือนภัยพูดว่า *"ปลอดภัย"* ในวันที่มันมองไม่เห็นประกาศเตือนภัย
   *    ⇒ ละเมิดหลักของตัวเองที่เขียนไว้บนหัวไฟล์ว่า **ไม่มีข้อมูล ≠ ปลอดภัย**
   *
   * 🔑 **ทิศของกฎสำคัญกว่าตัวกฎ: กดลงได้เฉพาะความมั่นใจ ⛔ ห้ามกดคำเตือน**
   *    · `good`/`caution` + มีส่วนที่ขาด ⇒ `unknown` (เราพูดไม่ได้ว่ามันโอเค)
   *    · `avoid` ⇒ **คงไว้เสมอ** — อันตรายที่รู้แล้ว มีน้ำหนักกว่าข้อมูลที่ขาด
   *      ⛔ ถ้าเผลอกดตัวนี้ลงด้วย จะกลายเป็นการกลบคำเตือนด้วยความไม่รู้ ซึ่งแย่กว่าบั๊กเดิม
   */
  if (snapshot.gaps.length > 0 && rank(level) < rank('avoid')) {
    level = 'unknown';
  }

  if (level === 'unknown') {
    advice.push({
      code: 'advice_not_enough_data',
      detail: 'Not enough data to judge — check the on-screen dashboard before you decide.',
    });
  }

  return { level, reasons, advice };
}
