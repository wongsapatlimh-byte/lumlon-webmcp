// src/webmcp/challenge/copy.ts
// ────────────────────────────────────────────────────────────────────────────
// 🗣️ **ถ้อยคำของหน้าตัวส่งแข่ง 2 ภาษา** (เจ้าของสั่งสด 29 ส.ค. 2026 ค่ำ)
//
// 🔴 **ทำไมมีไฟล์นี้ ⛔ ไม่ใช่ไปเติมใน `src/locales/translations.ts`:**
//    ไฟล์นั้นเป็น**ของกลางที่แอปจริงใช้ร่วม** (3,889 บรรทัด · 5 ภาษา) ⇒ การเติมคีย์ของ
//    ตัวแข่งลงไปคือการเอาเรื่องของงานแข่งไปวางในเส้นทางของผลิตภัณฑ์ · และเลนอื่น
//    แตะไฟล์นั้นอยู่ ⇒ ชนกันโดยไม่จำเป็น
//    ⇒ ถ้อยคำที่ **มีแต่ตัวแข่งใช้** อยู่กับตัวแข่ง — เหมือนที่ `ui/prompts.ts` ทำ
//
// 🔴 **EN คือค่าตั้งต้นเสมอ ⛔ ห้ามสลับเป็น TH** — ผู้อ่านคนแรกของหน้านี้คือกรรมการ
//    ต่างชาติ (`R6`: เข้าได้ทันทีแบบ guest) · TH เป็น *ทางเลือกที่ผู้ใช้กดเอง* เท่านั้น
//    🔬 เคยพลาดมาแล้ว 29 ส.ค. 2026: `LanguageProvider` เริ่มที่ `'TH'` ⇒ แถบที่บอก
//       **วิธีเปิด WebMCP** เป็นภาษาไทยบนหน้าอังกฤษ ⇒ คนที่ต้องอ่านที่สุดอ่านไม่ออก
//
// 🔴 **กติกาเหล็กของไฟล์นี้ — ถ้อยคำไทยต้องแบก "คำมั่น" ครบเท่าอังกฤษ**
//    หน้านี้มีประโยคที่เป็น *คำสัญญาเรื่องความซื่อสัตย์* อยู่ 7 ข้อ (สแนปช็อตติดวันที่ ·
//    มีผลิตภัณฑ์จริง · ของจริงอ่านสด · ส่วนนั้นกำลังพัฒนา · ผลงานถูกแช่แข็ง ·
//    ยังไม่เปิดสาธารณะ · อากาศกับพยากรณ์สดทุกคำขอ)
//    ⛔ **ห้ามแปลแบบย่อความจนคำมั่นข้อไหนหายไป** — จะกลายเป็นหน้าอังกฤษที่ซื่อสัตย์
//       คู่กับหน้าไทยที่พูดกำกวม ซึ่งแย่กว่ามีภาษาเดียว
//    ⇒ มีเทสบังคับครบทั้ง 7 ข้อ **ทั้งสองภาษา** ใน `webmcpChallenge.test.tsx`
//
// 🔴 **ทุก import ต้องเป็น `@/...` ⛔ ห้าม relative** — ไฟล์ที่ import ไฟล์นี้ (`page.tsx`)
//    ถูกตัวถ่ายสำเนา **ย้ายไปอยู่คนละที่** ใน repo สาธารณะ (ด่าน `RELATIVE_IN_SUBSTITUTED`)

import type { LanguageType } from '@/context/LanguageContext';

/**
 * 🌐 **ตัวแข่งรองรับ 2 ภาษา ⛔ ไม่ใช่ 5 เหมือนแอปจริง**
 *    เหตุผล: ถ้อยคำที่แปลไม่ครบ **แย่กว่าไม่มีปุ่มให้เลือก** — ผู้ใช้ที่กดแล้วได้หน้า
 *    ครึ่งไทยครึ่งอังกฤษจะสรุปว่าเว็บพัง ⛔ ไม่ใช่ว่า "ภาษานี้ยังไม่รองรับ"
 *    ⇒ ภาษาที่เหลือ (CN/JP/ES) ของ `LanguageProvider` ตกกลับมาที่ EN อย่างตั้งใจ
 */
export type ChallengeLang = 'EN' | 'TH';

/** แปลงภาษาของแอป (5 ตัว) → ภาษาที่หน้านี้แปลจริง (2 ตัว) */
export function challengeLangOf(lang: LanguageType): ChallengeLang {
  return lang === 'TH' ? 'TH' : 'EN';
}

export interface DataCredit {
  /** ⛔ ชื่อแหล่งไม่แปล — เป็นถ้อยคำที่ต้นทางกำหนด (`R14`) และเทส `REQUIRED_ON_PAGE` ตรวจตัวนี้ */
  readonly name: string;
  readonly note: string;
}

/**
 * 🎭 **ถ้อยคำของเวทีที่คนนั่งดู agent ทำงาน** (`AgentStage`)
 *
 * 🔬 **ทำไมถึงมาเพิ่มทีหลัง — บทเรียนที่ต้องไม่ลืม (30 ส.ค. 2026):**
 *    งานสลับภาษารอบแรกแปล *กรอบหน้า* ครบ แต่ลืม `AgentStage` ทั้งไฟล์ ⇒ กดปุ่มไทยแล้ว
 *    หัวเรื่องเป็นไทย **แต่กล่องที่ agent ทำงานเป็นอังกฤษล้วน** = หน้าครึ่งไทยครึ่งอังกฤษ
 *    ซึ่งเป็นสิ่งที่ไฟล์นี้เขียนห้ามไว้เองที่หัวไฟล์
 *    ⛔ **เทส 145 ตัวเขียวหมด** เพราะเทสตรวจแต่ *คำมั่น 7 ข้อ* ไม่ได้ตรวจกล่องนี้
 *    ⇒ เจอด้วย **ตาคนบนโดเมนจริง** เท่านั้น (รอบนี้เจ้าของเป็นคนเห็น) — เหมือนครั้งก่อน
 *      ที่เจอค่าตั้งต้น `'TH'` จากภาพจับจอ ⛔ ไม่ใช่จากเทส
 *    ⇒ **กติกาที่ออกจากบทเรียนนี้:** เพิ่มถ้อยคำที่ผู้ใช้เห็นตรงไหนก็ตามในโซนตัวแข่ง
 *      ต้องมาลงที่ไฟล์นี้ **ในคอมมิตเดียวกัน** ⛔ ห้ามฝังในคอมโพเนนต์
 *
 * ⛔ **ขอบเขตที่ตั้งใจไม่แปล (`R14`):** `reasons` · `advice` · `topAlert` · ชื่อแหล่งข้อมูล
 *    — พวกนี้เป็น**เนื้อความที่มาจากแหล่งข้อมูล/ตัว agent** ไม่ใช่ป้ายของหน้าเรา
 *    แปลมันคือการเขียนคำพูดใหม่ให้ต้นทาง ⇒ เป็นคนละเรื่องกับการแปลป้าย
 */
export interface ChallengeStageCopy {
  readonly emptyTitle: string;
  readonly emptyBody: string;
  readonly briefingHeading: string;
  readonly snapshotHeading: string;
  /**
   * 🆚 **หัวข้อตอนเวทีถือสถานที่มากกว่า 1 แห่ง** — `{count}` ถูกแทนด้วยจำนวนจริง
   *
   * 🔬 **ทำไมถึงมี (30 ส.ค. 2026):** เจ้าของถาม agent ว่า *"เทียบอากาศกรุงเทพกับเชียงใหม่"*
   *    ซึ่งเป็นคำถามที่คนถามบ่อยที่สุด · agent ทำได้อยู่แล้วโดยเรียก `get_environment_snapshot` 2 ครั้ง
   *    **แต่เวทีเก็บแค่ครั้งล่าสุด** ⇒ จอจะโชว์แค่จังหวัดเดียว ⇒ ดูเหมือน agent ทำงานไม่ครบ
   *    ⛔ **ทางแก้ที่ผิดคือเพิ่ม tool `compare_locations`** — ผิดมติ D-12 (`registry.ts`) ที่ว่า
   *       *"จำนวน tool คือต้นทุน ไม่ใช่ผลงาน"* และวันเดียวกันนั้นเราเพิ่งวัดได้ว่า
   *       **การเลือก tool ผิดคือจุดที่พังจริง** ⇒ เพิ่มตัวที่ 7 = ทำให้ 6 ตัวแรกแย่ลง
   *    ✅ ทางแก้ที่ถูกคือ **ให้จอเก็บหลายแห่งแล้ววางเทียบกัน** — ไม่เพิ่มต้นทุนฝั่ง agent เลยสักนิด
   */
  readonly compareHeading: string;
  /**
   * ✨ **ป้ายบอกว่าใบไหนคือใบที่ agent เพิ่งแตะ** (เจ้าของสั่ง 30 ส.ค. 2026: *"ทำสีให้คำตอบ จะได้รู้ว่าอะไรเปลี่ยน"*)
   *
   * 🔴 **ต้องเป็นป้ายที่ค้างอยู่ ⛔ ไม่ใช่แอนิเมชันที่วูบแล้วหาย** — เหตุผลที่ตัดสินแบบนี้:
   *    หน้านี้ถูกใช้ **ถ่ายวิดีโอและจับภาพนิ่งส่งกรรมการ** ⇒ เอฟเฟกต์ที่จางหายไปใน 2 วินาที
   *    **มองไม่เห็นเลยในภาพนิ่ง** และในวิดีโอก็ต้องจับจังหวะให้ทันพอดี
   *    ⇒ ป้ายที่ค้างจนกว่าจะมีใบใหม่มาแทน ทำงานได้ทั้งกับคนดูสด ภาพนิ่ง และวิดีโอ
   * 📌 โชว์เฉพาะตอนมีมากกว่า 1 ใบ — ใบเดียวไม่มีอะไรให้เทียบว่า "ใบไหน"
   */
  readonly justUpdated: string;
  /**
   * 👁️ **การ์ดกฎเฝ้าระวังบนเวที** (เจ้าของจับได้ 30 ส.ค. 2026: *"D3 ผ่านแบบไหน ผมไม่เห็นอะไรเปลี่ยนเลย"*)
   *
   * 🔴 **บั๊กที่ซ่อนอยู่:** `watchTools` ยิงเหตุการณ์ `watch.created` / `watch.deleted` / `watch.listed`
   *    ออกมาครบ **แต่ `AgentStage` ไม่เคยรับเหตุการณ์ตระกูลนี้เลยสักตัว** ⇒ เครื่องมือ **ฝั่งเขียนทั้ง 3 ตัว**
   *    (สร้าง · ดูรายการ · ลบ) ทำงานถูกต้องแต่ **มองไม่เห็นบนเวที** — เห็นได้เฉพาะในแผงมุมล่างซ้ายที่พับอยู่
   *    ⇒ คนดู (และกรรมการ · และวิดีโอ) จะสรุปว่า *"สั่งแล้วไม่เกิดอะไรขึ้น"*
   * 🔑 นี่คือครึ่งหนึ่งของเรื่องที่การแข่งนี้ให้คะแนน — tool ฝั่งเขียนคือส่วนที่ทำให้มันไม่ใช่แค่ API อ่านข้อมูล
   */
  readonly watchHeading: string;
  readonly watchCreated: string;
  readonly watchRemoved: string;
  readonly watchListed: string;
  readonly watchTriggered: string;
  readonly watchNone: string;
  /** คำเชื่อม «เกิน» ในประโยค `PM2.5 เกิน 75` */
  readonly watchAbove: string;
  /**
   * 🗣️ **แม่แบบประโยคเหตุผล/คำแนะนำ — คีย์ตรงกับ `SafetyReason.code` / `SafetyAdvice.code`**
   *    ตัวแทนค่าเขียนเป็น `{ชื่อ}` แล้วจอจะแทนด้วย `values` ที่ส่งมากับเหตุการณ์
   *    🔑 **ไม่มีแม่แบบ = ตกกลับไปใช้ประโยค EN เดิม ⛔ ไม่ใช่ซ่อนทิ้ง** — เหตุผลที่หายไป
   *       ทำให้จอดูสมบูรณ์กว่าความจริง ซึ่งเป็นสิ่งเดียวที่ทั้งหน้านี้พยายามป้องกัน
   *    ⛔ **ค่าใน `values` ที่มาจากกรมอุตุฯ (`event` · `headline`) คงรูปเดิมทุกภาษา** (`R14`)
   */
  readonly reasons: Readonly<Record<string, string>>;
  readonly searchHeading: string;
  readonly noMatch: string;
  readonly alertsLabel: string;
  readonly couldNotRead: string;
  readonly notAvailable: string;
  readonly noTimestamp: string;
  readonly cachedCopy: string;
  /**
   * 🕒 **ป้ายของแสตมป์รายชั้น + คำว่า «สด»** (เพิ่ม 31 ส.ค. 2026)
   *    🔴 `liveCopy` คือคู่ตรงข้ามของ `cachedCopy` ⇒ **ต้องมีทั้งคู่เสมอ**
   *       ถ้ามีแต่คำว่า «สำเนา» แล้วชั้นที่สดเงียบไว้ คนอ่านจะเดาว่าเงียบ = ไม่รู้
   */
  readonly liveCopy: string;
  readonly layerAir: string;
  readonly layerAlerts: string;
  /**
   * 🔴 **ป้ายบอกว่า *ใคร* เป็นคนอ่านค่าใบนี้ — เส้นแบ่งที่หน้านี้ห้ามทำให้เบลอ**
   *
   * 🔑 อยู่ในถ้อยคำของ **เวที** ⛔ ไม่ใช่ของแผนที่ เพราะทั้งการ์ดและกล่องลอยบนแผนที่ใช้ชุดเดียวกัน
   *    ⇒ 2 ที่พูดตรงกันเสมอ · ถ้าแยกไว้คนละก้อน วันหนึ่งจะแก้ที่เดียวแล้วอีกที่พูดคนละอย่าง
   * ⛔ **ห้ามตัดออกเพื่อความสวยงาม** — ป้ายนี้คือสิ่งเดียวที่ทำให้ *"หน้าเว็บอ่านเอง"* กับ
   *    *"agent อ่าน"* แยกออกจากกันได้ในภาพนิ่งที่กรรมการอาจใช้ตัดสิน
   */
  readonly readByAgent: string;
  readonly readByPage: string;
  /** ระดับคำแนะนำ 4 ค่า — คีย์ตรงกับ `SafetyLevel` */
  readonly levels: Readonly<Record<string, string>>;
  /** กิจกรรม 4 ค่า — คีย์ตรงกับ `SafetyActivity` */
  readonly activities: Readonly<Record<string, string>>;
  /**
   * ชื่อส่วนที่อ่านไม่ได้ — คีย์ตรงกับ `gap.part`
   * 🔑 **ต้องมีทางออกสำหรับคีย์ที่ไม่รู้จัก** — ฝั่งหลังบ้านเพิ่ม part ใหม่ได้ตลอดโดยไม่มาบอก
   *    ⇒ ตัวอ่านตกกลับไปแปลง `snake_case` เป็นคำอ่านได้ ⛔ ไม่ใช่โชว์ค่าว่างหรือซ่อนทิ้ง
   */
  readonly gaps: Readonly<Record<string, string>>;
}

/**
 * 🗺️ **ถ้อยคำของแผนที่หมุด 77 จังหวัด** (`ThailandMap`)
 *
 * 🔴 **`legend` คือช่องที่สำคัญที่สุดในก้อนนี้ ⛔ ห้ามตัดทิ้งเพื่อความสวยงาม**
 *    คนที่เห็นแผนที่ครั้งแรกจะอ่านหมุดเทาว่า *"ที่นี่อากาศดี"* โดยอัตโนมัติ
 *    ⇒ ประโยคเดียวนี้คือสิ่งที่กันไม่ให้แผนที่ทั้งใบกลายเป็นคำโกหกที่ดูดี
 */
export interface ChallengeMapCopy {
  /** คำอธิบายภาพสำหรับตัวอ่านหน้าจอ — แผนที่เป็น `role="img"` ⇒ ต้องมีคำบรรยาย */
  readonly mapAlt: string;
  readonly legend: string;
  /**
   * 🔴 **ประโยคที่บอกว่ารูปนี้ไม่ใช่เส้นขอบประเทศจริง ⛔ ห้ามตัดทิ้ง**
   *    รูปร่างบนแผนที่คือ *สนามความหนาแน่นของหมุด 77 จังหวัด* ที่เราวาดเอง
   *    ⇒ ถ้าไม่บอก คนจะอ่านว่าเราอ้างชายฝั่งที่แม่นยำ ซึ่งเราไม่มีและตรวจสอบเองไม่ได้
   */
  readonly shapeNote: string;
}

/**
 * 📊 **ถ้อยคำของกระดานที่ขึ้นตั้งแต่เปิดหน้า** (`LiveBoard`)
 *
 * 🔴 **`sub` ต้องบอกตรง ๆ ว่าค่าพวกนี้ *หน้าเว็บ* อ่านเอง ⛔ ไม่ใช่ผลงานของ agent**
 *    เพราะเวทีข้างล่างขายเรื่อง *"สิ่งที่ agent เพิ่งทำ"* ⇒ ถ้ากระดานบนไม่ประกาศตัว
 *    คนดูจะเหมาว่าทั้งหน้าเป็นฝีมือ agent ซึ่งคือคำโกหกข้อเดียวที่ทำลายผลงานนี้ได้ทั้งชิ้น
 */
export interface ChallengeLiveCopy {
  readonly heading: string;
  readonly sub: string;
  readonly loading: string;
  /** ⛔ อ่านไม่สำเร็จต้องเขียนบนจอ — ห้ามซ่อนการ์ดแล้วทำเหมือนไม่เคยตั้งใจอ่าน */
  readonly failed: string;
  /**
   * 🔍 **ถ้อยคำของช่องค้นหาสำหรับ *คน*** (เพิ่ม 31 ส.ค. 2026)
   *    🔴 `searchNote` ต้องบอกว่านี่คือ **เครื่องมือชุดเดียวกับที่ agent ใช้**
   *       ⇒ กรรมการที่ไม่มี agent จะเข้าใจว่าที่เห็นคือของจริง ไม่ใช่ของสาธิตคนละชุด
   */
  readonly searchHeading: string;
  readonly searchPlaceholder: string;
  readonly searchNone: string;
  readonly searchNote: string;
  readonly readNow: string;
  /**
   * 🧭 **ปุ่มพาไปคู่มือ + คัดลอกที่อยู่สวิตช์** (`GuideBeacon`)
   *    ⛔ `flagCopyFailed` ห้ามตัดทิ้ง — คัดลอกอาจล้มได้จริง (ไม่ใช่ secure context / ผู้ใช้ปฏิเสธ)
   *       และการเงียบตอนล้ม แย่กว่าการไม่มีปุ่มคัดลอกตั้งแต่แรก
   */
  readonly guideCta: string;
  readonly copyFlag: string;
  readonly flagCopied: string;
  readonly flagCopyFailed: string;
  readonly map: ChallengeMapCopy;
}

/**
 * 🔢 **ป้ายของแถบตัวเลข 4 ช่องบนหัวหน้า** (`HeroStats`)
 *    ⛔ **ไม่มีช่องสำหรับ "ค่า" ของ 2 ช่องแรกโดยตั้งใจ** — ตัวเลขต้องมาจากโค้ดที่นับของจริง
 *       ถ้าเปิดช่องให้พิมพ์ค่าเองที่นี่ วันหนึ่งจะมีคนพิมพ์ แล้วหน้าแรกจะโกหกโดยไม่มีใครรู้
 */
export interface ChallengeStatsCopy {
  readonly provinces: string;
  readonly tools: string;
  readonly liveValue: string;
  readonly liveLabel: string;
  readonly snapshotLabel: string;
}

/**
 * 🏗️ **ส่วน «สร้างขึ้นข้าง ๆ ผลิตภัณฑ์จริง»** (เพิ่ม 31 ส.ค. 2026 — เจ้าของสั่งเอง)
 *
 * 🔴 **กรอบที่ถูกคือ «ชั้นใหม่ที่สร้างข้าง ๆ» ⛔ ไม่ใช่ «ส่วนเล็ก ๆ ของผลิตภัณฑ์»**
 *    ผู้ตรวจอิสระค้านร่างแรกตรงนี้ และค้านถูก: โมดูล WebMCP **ทั้งก้อนสร้างใหม่เพื่อการแข่งนี้**
 *    ⇒ เขียนว่าเป็นส่วนย่อยของผลิตภัณฑ์ = **เคลมประวัติที่ไม่มีจริง** และยังลดค่าของงานตัวเองไปด้วย
 * ⛔ ทุกประโยคในนี้อ้างได้เฉพาะของที่ **ใช้ได้จริงแล้ว** ในตารางสถานะของแผนแม่บท
 *    🔬 ประโยค «ส่งเตือนภัยผ่าน LINE» ที่เคยอยู่ในไฟล์นี้ **เป็นคำเคลมเท็จ** — ตัวส่งเตือนภัยตามหมุด
 *       อยู่ในรายการ «ยังไม่มีทั้งเส้น» ของแผนแม่บท ⇒ ถอดออกในคอมมิตเดียวกับที่เพิ่มก้อนนี้
 */
export interface ChallengeAlongsideCopy {
  readonly heading: string;
  /** ย่อหน้าละหนึ่งช่อง — จำนวนย่อหน้าต้องเท่ากันทั้ง 2 ภาษา (ด่านเทียบถ้อยคำเดินลงชั้นในให้เอง) */
  readonly body: readonly string[];
}

/** หนึ่งข้อของ «ทำไมต้องใช้ WebMCP» — ตัวหนาขึ้นต้น แล้วตามด้วยส่วนขยาย (รูปแบบเดียวกับ bullet เดิม) */
export interface ChallengeWhyItem {
  readonly bold: string;
  readonly rest: string;
}

/**
 * 🧠 **ส่วน «ทำไมงานนี้ต้องใช้ WebMCP»**
 *
 * 🔴 **ทำไมต้องมี:** เกณฑ์ตัดสิน 2 ข้อจาก 4 (ความลึกของการใช้ WebMCP · ความแปลกใหม่) วัดสิ่งที่หน้านี้
 *    **ทำอยู่แล้วแต่ไม่เคยพูดออกมา** ⇒ กรรมการที่อ่านผ่าน ๆ จะอ่านออกมาเป็น *แดชบอร์ดที่มี API*
 *    ⛔ ซึ่งไม่ใช่สิ่งที่เกิดขึ้นจริงบนหน้านี้
 */
export interface ChallengeWhyCopy {
  readonly heading: string;
  readonly items: readonly ChallengeWhyItem[];
}

export interface ChallengeCopy {
  readonly htmlLang: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly lede: string;
  readonly provenance: string;
  readonly stageHeading: string;
  readonly howHeading: string;
  /**
   * 🔴 **เงื่อนไขที่ต้องมีก่อน ⛔ ไม่ใช่คำแนะนำเสริม** (เพิ่ม 30 ส.ค. 2026 หลังเจ้าของทดสอบจริง)
   *
   * 🔬 **เรื่องจริงที่ทำให้ช่องนี้เกิด:** เจ้าของทำตามคู่มือเดิมของหน้านี้เป๊ะ ๆ **3 รอบแล้วไม่เกิดอะไรเลย**
   *    · รอบ 1 agent ไปสร้างงานตั้งเวลาของ ChatGPT เอง · รอบ 2 ตอบจาก `iqair.com` · รอบ 3 ขึ้น *Searching …* แล้วนิ่ง
   *    สาเหตุ: เอกสารทางการระบุว่า **เฉพาะ ChatGPT Work / Codex + โมเดล GPT-5.6 Sol หรือ Terra** เท่านั้น
   *    ที่ได้รับ site tools — โหมด Chat ธรรมดา + โมเดล Instant **มองไม่เห็นเครื่องมือเลย**
   *    ⇒ คู่มือเดิมของเราขาดเงื่อนไขนี้ ⇒ **กรรมการที่ทำตามหน้าเราจะสรุปว่าผลงานพัง**
   * ⛔ **ห้ามลบช่องนี้ออกเพื่อความสวยงาม** — มันคือความต่างระหว่าง "เปิดแล้วใช้ได้" กับ "เปิดแล้วคิดว่าพัง"
   */
  readonly requirements: string;
  readonly step1Before: string;
  readonly step1After: string;
  readonly step2Before: string;
  readonly step2Panel: string;
  readonly step2After: string;
  readonly step3: string;
  readonly step4: string;
  /**
   * 💡 **สิ่งที่รู้จากการทดลองจริง ⛔ ไม่ใช่ข้อแก้ตัว** — คำถามกว้าง ๆ ที่ agent ตอบเองได้
   *    (เช่น "เทียบอากาศ 2 เมือง") มันจะเลือกค้นเว็บแทน ⇒ บอกผู้อ่านตรง ๆ ว่าให้ถามถึง *หน้านี้*
   */
  readonly tip: string;
  readonly noAccount: string;
  readonly snapshotHeading: string;
  readonly snapshotIntro: string;
  readonly bullet1Bold: string;
  readonly bullet1Rest: string;
  readonly bullet2Bold: string;
  readonly bullet2Rest: string;
  readonly snapshotBodyBefore: string;
  readonly snapshotBodyAfter: string;
  readonly notPublicYet: string;
  readonly alongside: ChallengeAlongsideCopy;
  readonly why: ChallengeWhyCopy;
  readonly creditsHeading: string;
  readonly credits: readonly DataCredit[];
  readonly coverage: string;
  /** ป้ายปุ่มสลับภาษา — เขียนด้วยภาษาของตัวเองเสมอ (คนที่หาปุ่มนี้คือคนที่อ่านอีกภาษาไม่ออก) */
  readonly switchLabel: string;
  readonly stage: ChallengeStageCopy;
  readonly live: ChallengeLiveCopy;
  readonly stats: ChallengeStatsCopy;
}

const EN: ChallengeCopy = {
  htmlLang: 'en',
  eyebrow: 'Agent-ready web',
  title: 'LUMLON — air & hazard companion for Thailand',
  lede:
    'In Thailand, “is the air safe today?” is a decision, not a curiosity — whether a child walks to ' +
    'school, whether you go for a run. Ask an agent: it reads the same live air quality and forecast you ' +
    'see here, plus a dated snapshot of the official hazard alerts, then leaves a watch this browser ' +
    'keeps checking while the page is open.',
  provenance:
    'Every number on this page carries the time it was observed and the source it came from. When something can’t be ' +
    'read, the page says so instead of showing a zero.',
  stageHeading: 'What the agent just did',
  howHeading: 'How to try it',
  requirements:
    'You need the ChatGPT desktop app with the chat set to Work (or Codex), and GPT-5.6 Sol or Terra selected. ' +
    'Site tools are not offered to the plain Chat mode or to other models — nothing will happen there.',
  step1Before: 'Open this page in the ChatGPT desktop app browser, or in Chrome 149+ with ',
  step1After: ' enabled.',
  step2Before: 'An arrow appears in the address bar when a page offers tools. Select it to open the ',
  step2Panel: 'Site tools',
  step2After: ' panel — six tools should be listed: four that read, two that write.',
  step3: 'Set the chat to Work and pick GPT-5.6 Sol or Terra.',
  step4:
    'Copy a suggested prompt from the bar at the bottom left and send it. Keep this tab open — this page updates as ' +
    'the agent works.',
  tip:
    'Ask about this page. A broad question the agent can answer on its own — “compare the air in two cities” — will ' +
    'usually be answered from its own web search instead, and this page will stay empty.',
  noAccount:
    'No sign-in, no account, nothing stored on a server. Watches you create are evaluated only in this ' +
    'browser, and only while this page is open. LUMLON’s LINE channel can answer weather and forecast ' +
    'questions; this demo does not send watch or hazard alerts through LINE.',
  snapshotHeading: 'Why the hazard alerts here are a dated snapshot',
  snapshotIntro:
    'LUMLON is a real product being built for launch — not something assembled for this challenge. In the product, ' +
    'the hazard layer reads the official feed live, through our own backend. This entry deliberately does not, for ' +
    'two reasons.',
  bullet1Bold: 'That layer is under active development right now.',
  bullet1Rest:
    ' A frozen competition entry pointed at a service we are still changing would let our own work break a judge’s ' +
    'experience without us noticing.',
  bullet2Bold: 'This entry is frozen once judging opens',
  bullet2Rest: ' and cannot be redeployed. Whatever it depends on has to be something that cannot go down.',
  snapshotBodyBefore:
    'So the alerts here come from a snapshot of the official Thai Meteorological Department CAP feed, captured on a ' +
    'stated date. Every answer that uses them is labelled ',
  snapshotBodyAfter:
    ' and carries that capture time — nothing on this page, and nothing an agent reads, presents them as current. ' +
    'Air quality and the forecast are live on every request.',
  notPublicYet:
    'The product isn’t open to the public yet, so we can’t point you at it to check this for yourself. We’d rather ' +
    'say that plainly than imply a link we can’t give you.',
  alongside: {
    heading: 'Built alongside LUMLON',
    body: [
      'This WebMCP layer was built beside an existing product, not extracted from it. It gives an agent six ' +
        'focused tools: read environmental data, explain a safety decision, and manage watches that live in ' +
        'your browser.',
      'LUMLON itself is a weather and hazard companion for Thailand, still being built for launch. Working ' +
        'today: a LINE assistant that answers weather and forecast questions, sign-in through four providers, ' +
        'a forecast dashboard, and backend layers that read satellite flood coverage and regional earthquake ' +
        'feeds. Not built yet: pushing hazard alerts to a person’s own pinned locations.',
      'The product is not open to the public yet, so there is no link to give you — not because it is a ' +
        'prototype, but because the door is not open. After the challenge, these six tools are the part we ' +
        'intend to carry back into it.',
    ],
  },
  why: {
    heading: 'Why this needs WebMCP',
    items: [
      {
        bold: 'The site answers in facts, not pixels.',
        rest:
          ' The agent receives typed readings with their source and observation time — not a screenshot to ' +
          'guess at, and not a page to scrape.',
      },
      {
        bold: 'Two of the six tools write.',
        rest:
          ' An agent can create a watch that is saved and evaluated in this browser while the page stays ' +
          'open. Removing a saved watch asks for your confirmation first.',
      },
      {
        bold: 'You and the agent inspect the same reading.',
        rest:
          ' Every card states whether the page read it or an agent did — and those two labels come from ' +
          'different code paths, not from a flag anyone sets by hand.',
      },
    ],
  },
  creditsHeading: 'Data sources',
  credits: [
    { name: 'Open-Meteo', note: 'air quality & forecast · CC BY 4.0' },
    { name: 'Thai Meteorological Department (CAP alerts)', note: 'public domain · dated snapshot, see below' },
    { name: 'LUMLON province registry', note: '77 provinces' },
  ],
  coverage: 'Coverage: Thailand, all 77 provinces.',
  switchLabel: 'English',
  stats: {
    provinces: 'provinces covered',
    tools: 'site tools registered',
    liveValue: 'live',
    liveLabel: 'air & forecast, every request',
    snapshotLabel: 'hazard alerts: snapshot taken',
  },
  live: {
    heading: 'Thailand right now',
    sub: 'Read by this page when it loaded — not by an agent.',
    loading: 'Reading…',
    failed: 'Could not read this one right now.',
    searchHeading: 'Try it yourself',
    searchPlaceholder: 'Search a province — “Chiang Rai” or “เชียงราย”',
    searchNone: 'No province in the registry matches that.',
    searchNote:
      'This search runs in your browser against the same 77-province registry the agent’s search_locations tool uses. Reading a province calls the same data path the agent calls — no account, nothing sent anywhere else.',
    readNow: 'read now',
    guideCta: 'How to try it with an agent',
    copyFlag: 'Copy the Chrome flag address',
    flagCopied: 'Copied — paste it in the address bar',
    flagCopyFailed: 'Copying was blocked. Copy this by hand:',
    map: {
      mapAlt: 'Map of Thailand drawn from the 77 province registry. Provinces that have been read carry an air quality colour.',
      legend: 'Grey = not read yet. A province is only coloured once its air quality has actually been read.',
      shapeNote: 'The shape is drawn from the 77 province points themselves — it is a diagram, not a coastline.',
    },
  },
  stage: {
    emptyTitle: 'Nothing yet — the stage fills in when an agent uses this site.',
    emptyBody:
      'Open this page inside the ChatGPT app browser (or Chrome 149+ with the WebMCP flag on), then copy one of the ' +
      'suggested prompts from the bar at the bottom left.',
    briefingHeading: 'Safety briefing',
    snapshotHeading: 'Environment snapshot',
    compareHeading: 'Environment snapshot · {count} places side by side',
    justUpdated: 'just updated',
    watchHeading: 'Watches',
    watchCreated: 'Watch set',
    watchRemoved: 'Watch removed',
    watchListed: 'Watches listed',
    watchTriggered: 'Watch triggered',
    watchNone: 'No watches in this browser',
    watchAbove: 'above',
    reasons: {
      pm25_high: 'PM2.5 is {pm25} ug/m3 (AQI {aqi}) — unhealthy for this activity.',
      pm25_moderate: 'PM2.5 is {pm25} ug/m3 (AQI {aqi}) — acceptable but not clean.',
      pm25_low: 'PM2.5 is {pm25} ug/m3 (AQI {aqi}) — fine for this activity.',
      official_alert_severe: 'Official alert in effect: {event}.',
      official_alert_active: '{count} official alert(s) currently in effect for this province.',
      no_official_alert: 'No official hazard alert is currently in effect here.',
      official_alert_expired:
        '{count} official alert(s) in this dated snapshot have expired and are not in effect now: {events}.',
      missing_air_quality: 'Air quality could not be read — this is not the same as clean air.',
      missing_forecast: 'The forecast could not be read — this is not the same as no rain expected.',
      missing_alerts: 'The official alert feed could not be read — this is not the same as no alerts.',
      advice_stay_indoors: 'Stay indoors, or wear an N95 mask if you must go out.',
      advice_keep_it_short: 'Keep it short and avoid the busiest roads.',
      advice_follow_alert: 'Follow the official alert first — it outranks air quality.',
      advice_not_enough_data: 'Not enough data to judge — check the on-screen dashboard before you decide.',
    },
    searchHeading: 'Location search',
    noMatch: 'No match in Thailand.',
    alertsLabel: 'Official alerts',
    couldNotRead: 'could not read',
    notAvailable: 'Not available right now',
    noTimestamp: 'time not reported by the source',
    cachedCopy: 'cached copy',
    liveCopy: 'live',
    layerAir: 'Air:',
    layerAlerts: 'Alerts:',
    readByAgent: 'read by the agent',
    readByPage: 'read by this page',
    levels: {
      good: 'Good to go',
      caution: 'Take care',
      avoid: 'Better not',
      unknown: 'Not enough data',
    },
    activities: {
      general: 'general',
      outdoor_exercise: 'outdoor exercise',
      children_outdoors: 'children outdoors',
      travel: 'travel',
    },
    gaps: {
      air_quality: 'air quality',
      forecast: 'forecast',
      alerts: 'official alerts',
    },
  },
};

const TH: ChallengeCopy = {
  htmlLang: 'th',
  eyebrow: 'เว็บที่ AI agent ใช้งานได้',
  title: 'LUMLON — เพื่อนคู่คิดเรื่องอากาศและภัยพิบัติสำหรับประเทศไทย',
  lede:
    'ในไทย คำถามว่า “วันนี้อากาศปลอดภัยไหม” เป็นการตัดสินใจ ไม่ใช่ความอยากรู้ — จะให้ลูกเดินไปโรงเรียนไหม ' +
    'จะออกไปวิ่งไหม ลองถาม agent ดู: มันอ่านค่าคุณภาพอากาศและพยากรณ์สดชุดเดียวกับที่คุณเห็นบนหน้านี้ ' +
    'พร้อมสแนปช็อตประกาศเตือนภัยทางการที่ติดวันที่ไว้ แล้วฝากกฎเฝ้าไว้ให้เบราว์เซอร์นี้คอยตรวจให้ ' +
    'ขณะที่หน้าเว็บเปิดอยู่',
  provenance:
    'ตัวเลขทุกตัวบนหน้านี้มีเวลาที่วัดและแหล่งที่มากำกับ ถ้าอ่านค่าไหนไม่ได้ หน้านี้จะบอกตรง ๆ ว่าอ่านไม่ได้ ' +
    'แทนที่จะแสดงเลขศูนย์',
  stageHeading: 'สิ่งที่ agent เพิ่งทำไป',
  howHeading: 'ลองใช้ยังไง',
  requirements:
    'ต้องใช้แอป ChatGPT บนเดสก์ท็อป โดยตั้งแชทเป็นโหมด Work (หรือใช้ Codex) และเลือกโมเดล GPT-5.6 Sol หรือ Terra ' +
    'โหมดแชทธรรมดาและโมเดลอื่นจะไม่ได้รับเครื่องมือของเว็บ — กดไปก็จะไม่มีอะไรเกิดขึ้น',
  step1Before: 'เปิดหน้านี้ในเบราว์เซอร์ของแอป ChatGPT บนเดสก์ท็อป หรือใน Chrome 149 ขึ้นไปที่เปิด ',
  step1After: ' ไว้แล้ว',
  step2Before: 'เมื่อหน้าเว็บมีเครื่องมือให้ใช้ จะมีลูกศรโผล่ในแถบที่อยู่ กดที่ลูกศรเพื่อเปิดแผง ',
  step2Panel: 'Site tools',
  step2After: ' — ควรเห็นเครื่องมือครบ 6 ตัว เป็นตัวอ่าน 4 และตัวเขียน 2',
  step3: 'ตั้งแชทเป็นโหมด Work แล้วเลือกโมเดล GPT-5.6 Sol หรือ Terra',
  step4: 'คัดลอกตัวอย่างคำถามจากแถบมุมล่างซ้ายแล้วส่งไป เปิดแท็บนี้ค้างไว้ — หน้านี้จะขยับตามที่ agent ทำงาน',
  tip:
    'ให้ถามถึงหน้านี้ ถ้าถามกว้าง ๆ แบบที่ agent ตอบเองได้ เช่น “เทียบอากาศสองเมือง” ' +
    'มันมักจะไปค้นเว็บมาตอบแทน แล้วหน้านี้จะไม่ขยับเลย',
  noAccount:
    'ไม่ต้องล็อกอิน ไม่ต้องสมัครบัญชี ไม่มีอะไรถูกเก็บไว้บนเซิร์ฟเวอร์ กฎเฝ้าที่คุณตั้งถูกประเมินในเบราว์เซอร์เครื่องนี้เท่านั้น ' +
    'และเฉพาะตอนที่หน้านี้เปิดอยู่ — ช่องทาง LINE ของ LUMLON ตอบคำถามอากาศและพยากรณ์ได้ ' +
    'แต่เดโมนี้ไม่ได้ส่งกฎเฝ้าหรือประกาศเตือนภัยผ่าน LINE',
  snapshotHeading: 'ทำไมประกาศเตือนภัยบนหน้านี้เป็นสแนปช็อตที่ติดวันที่ไว้',
  snapshotIntro:
    'LUMLON เป็นผลิตภัณฑ์จริงที่กำลังสร้างเพื่อเปิดตัว ⛔ ไม่ใช่ของที่ประกอบขึ้นมาเพื่อการแข่งขันครั้งนี้ ' +
    'ในตัวผลิตภัณฑ์ ชั้นภัยพิบัติอ่านฟีดทางการแบบสดผ่านหลังบ้านของเราเอง แต่ผลงานที่ส่งแข่งชิ้นนี้จงใจไม่ทำแบบนั้น ด้วยเหตุผล 2 ข้อ',
  bullet1Bold: 'ชั้นนั้นกำลังพัฒนาอยู่ในตอนนี้',
  bullet1Rest:
    ' ผลงานที่ถูกแช่แข็งแล้วแต่ยังชี้ไปที่บริการที่เรายังแก้อยู่ทุกวัน จะทำให้งานของเราเองทำพังประสบการณ์ของกรรมการได้ ' +
    'โดยที่เราไม่รู้ตัว',
  bullet2Bold: 'ผลงานชิ้นนี้จะถูกแช่แข็งทันทีที่เริ่มตัดสิน',
  bullet2Rest: ' และ deploy ใหม่ไม่ได้อีก ⇒ สิ่งที่มันพึ่งพาต้องเป็นสิ่งที่ล่มไม่ได้',
  snapshotBodyBefore:
    'ประกาศเตือนภัยบนหน้านี้จึงมาจากสแนปช็อตของฟีด CAP ทางการของกรมอุตุนิยมวิทยา ที่ถ่ายไว้ ณ วันที่ซึ่งระบุไว้ชัดเจน ' +
    'ทุกคำตอบที่ใช้ข้อมูลชุดนี้จะติดป้าย ',
  snapshotBodyAfter:
    ' พร้อมเวลาที่ถ่ายไว้เสมอ — ไม่มีอะไรบนหน้านี้ และไม่มีอะไรที่ agent อ่าน ที่นำเสนอข้อมูลชุดนี้ว่าเป็นข้อมูลปัจจุบัน ' +
    'ส่วนคุณภาพอากาศและพยากรณ์อากาศเป็นข้อมูลสดทุกครั้งที่เรียก',
  notPublicYet:
    'ตัวผลิตภัณฑ์ยังไม่เปิดให้บุคคลทั่วไปใช้ เราจึงยังชี้ให้คุณเข้าไปตรวจสอบข้อนี้ด้วยตัวเองไม่ได้ ' +
    'เราเลือกที่จะบอกตรง ๆ แบบนี้ ดีกว่าจะพูดเป็นนัยถึงลิงก์ที่เราให้คุณไม่ได้',
  alongside: {
    heading: 'สร้างขึ้นข้าง ๆ LUMLON',
    body: [
      'ชั้น WebMCP นี้ถูกสร้างขึ้นข้าง ๆ ผลิตภัณฑ์ที่มีอยู่ ⛔ ไม่ได้ตัดออกมาจากมัน มันให้เครื่องมือ 6 ตัวกับ agent ' +
        'สำหรับอ่านข้อมูลสิ่งแวดล้อม อธิบายเหตุผลของคำแนะนำด้านความปลอดภัย และจัดการกฎเฝ้าที่อยู่ในเบราว์เซอร์ของคุณ',
      'ตัว LUMLON เองเป็นเพื่อนคู่คิดเรื่องอากาศและภัยพิบัติสำหรับประเทศไทย ที่ยังสร้างอยู่เพื่อเปิดตัว ' +
        'สิ่งที่ใช้ได้จริงแล้ววันนี้: ผู้ช่วยบน LINE ที่ตอบคำถามอากาศและพยากรณ์ · เข้าระบบได้ 4 ช่องทาง · ' +
        'แดชบอร์ดพยากรณ์ · และชั้นหลังบ้านที่อ่านพื้นที่น้ำท่วมจากภาพดาวเทียมและข้อมูลแผ่นดินไหวในภูมิภาค ' +
        'สิ่งที่ยังไม่มี: การส่งประกาศเตือนภัยไปตามหมุดที่ผู้ใช้ปักเอง',
      'ผลิตภัณฑ์ยังไม่เปิดให้บุคคลทั่วไปใช้ เราจึงยังไม่มีลิงก์ให้คุณ — ไม่ใช่เพราะมันเป็นต้นแบบ แต่เพราะประตูยังไม่เปิด ' +
        'หลังจบการแข่งขัน เครื่องมือ 6 ตัวนี้คือส่วนที่เราตั้งใจจะยกกลับเข้าไปในผลิตภัณฑ์',
    ],
  },
  why: {
    heading: 'ทำไมงานนี้ต้องใช้ WebMCP',
    items: [
      {
        bold: 'เว็บนี้ตอบเป็นข้อเท็จจริง ไม่ใช่พิกเซล',
        rest:
          ' agent ได้รับค่าที่อ่านมาพร้อมแหล่งที่มาและเวลาที่วัดกำกับ ⛔ ไม่ใช่ภาพหน้าจอให้เดาเอง ' +
          'และไม่ใช่หน้าเว็บให้ไปไล่ขูดข้อความ',
      },
      {
        bold: 'เครื่องมือ 2 ใน 6 ตัวเป็นฝั่งเขียน',
        rest:
          ' agent สร้างกฎเฝ้าที่ถูกบันทึกและถูกประเมินในเบราว์เซอร์เครื่องนี้ขณะที่หน้าเว็บเปิดอยู่ได้ ' +
          'และการลบกฎที่บันทึกไว้ต้องให้คุณยืนยันก่อนเสมอ',
      },
      {
        bold: 'คนกับ agent ตรวจค่าตัวเดียวกันได้',
        rest:
          ' การ์ดทุกใบบอกว่าหน้าเว็บเป็นคนอ่านหรือ agent เป็นคนอ่าน และป้ายสองอันนั้นมาจากเส้นทางโค้ดคนละเส้น ' +
          '⛔ ไม่ใช่จากธงที่ใครตั้งเอาไว้เอง',
      },
    ],
  },
  creditsHeading: 'แหล่งข้อมูล',
  credits: [
    /** ⛔ ชื่อแหล่งและชื่อ license คงรูปเดิมทั้งสองภาษา — เป็นถ้อยคำที่ต้นทางกำหนด (`R14`) */
    { name: 'Open-Meteo', note: 'คุณภาพอากาศและพยากรณ์ · CC BY 4.0' },
    { name: 'Thai Meteorological Department (CAP alerts)', note: 'สาธารณสมบัติ · สแนปช็อตติดวันที่ ดูคำอธิบายด้านล่าง' },
    { name: 'LUMLON province registry', note: '77 จังหวัด' },
  ],
  coverage: 'พื้นที่ที่ครอบคลุม: ประเทศไทย ครบทั้ง 77 จังหวัด',
  switchLabel: 'ไทย',
  stats: {
    provinces: 'จังหวัดที่ครอบคลุม',
    tools: 'เครื่องมือที่ลงทะเบียนไว้',
    liveValue: 'สด',
    liveLabel: 'อากาศและพยากรณ์ ทุกคำขอ',
    snapshotLabel: 'ประกาศเตือนภัย: ถ่ายไว้เมื่อ',
  },
  live: {
    heading: 'ประเทศไทย ณ ตอนนี้',
    sub: 'ค่าชุดนี้หน้าเว็บอ่านเองตอนเปิดหน้า ⛔ ไม่ใช่ผลงานของ agent',
    loading: 'กำลังอ่าน…',
    failed: 'ตอนนี้อ่านค่าของจังหวัดนี้ไม่ได้',
    searchHeading: 'ลองกดเองก็ได้',
    searchPlaceholder: 'ค้นหาจังหวัด — «เชียงราย» หรือ «Chiang Rai»',
    searchNone: 'ไม่มีจังหวัดในทะเบียนที่ตรงกับคำนี้',
    searchNote:
      'ช่องค้นหานี้ทำงานในเบราว์เซอร์ของคุณ บนทะเบียน 77 จังหวัดชุดเดียวกับที่เครื่องมือ search_locations ของ agent ใช้ · การกดอ่านค่าจังหวัดก็เดินเส้นทางข้อมูลเดียวกับที่ agent เรียก — ไม่ต้องสมัคร ไม่มีอะไรถูกส่งไปที่อื่น',
    readNow: 'กดอ่านค่า',
    guideCta: 'วิธีลองกับ agent',
    copyFlag: 'คัดลอกที่อยู่สวิตช์ของ Chrome',
    flagCopied: 'คัดลอกแล้ว — เอาไปวางในแถบที่อยู่',
    flagCopyFailed: 'คัดลอกอัตโนมัติถูกบล็อก คัดลอกข้อความนี้เองได้เลย:',
    map: {
      mapAlt: 'แผนที่ประเทศไทยที่วาดจากทะเบียน 77 จังหวัด จังหวัดที่ถูกอ่านค่าแล้วจะมีสีตามระดับคุณภาพอากาศ',
      legend: 'หมุดสีเทา = ยังไม่ได้อ่าน · จังหวัดจะได้สีก็ต่อเมื่อมีการอ่านค่าคุณภาพอากาศจริงแล้วเท่านั้น',
      shapeNote: 'รูปร่างบนแผนที่วาดจากหมุด 77 จังหวัดเอง — เป็นแผนภาพ ⛔ ไม่ใช่เส้นขอบชายฝั่งจริง',
    },
  },
  stage: {
    emptyTitle: 'ยังไม่มีอะไร — เวทีนี้จะขึ้นข้อมูลเมื่อ agent เริ่มใช้เว็บนี้',
    emptyBody:
      'เปิดหน้านี้ในเบราว์เซอร์ของแอป ChatGPT (หรือใน Chrome 149 ขึ้นไปที่เปิดสวิตช์ WebMCP ไว้แล้ว) ' +
      'จากนั้นคัดลอกตัวอย่างคำถามจากแถบมุมล่างซ้ายแล้วส่งไป',
    briefingHeading: 'คำแนะนำความปลอดภัย',
    snapshotHeading: 'สภาพแวดล้อม ณ ตอนนี้',
    compareHeading: 'สภาพแวดล้อม · เทียบ {count} แห่ง',
    justUpdated: 'เพิ่งอัปเดต',
    watchHeading: 'กฎเฝ้าระวัง',
    watchCreated: 'ตั้งกฎเฝ้าระวังแล้ว',
    watchRemoved: 'ลบกฎเฝ้าระวังแล้ว',
    watchListed: 'ดูรายการกฎเฝ้าระวัง',
    watchTriggered: 'กฎเฝ้าระวังทำงาน',
    watchNone: 'ยังไม่มีกฎเฝ้าระวังในเบราว์เซอร์นี้',
    watchAbove: 'เกิน',
    reasons: {
      pm25_high: 'PM2.5 {pm25} ug/m3 (AQI {aqi}) — สูงเกินไปสำหรับกิจกรรมนี้',
      pm25_moderate: 'PM2.5 {pm25} ug/m3 (AQI {aqi}) — พอรับได้ แต่ยังไม่สะอาด',
      pm25_low: 'PM2.5 {pm25} ug/m3 (AQI {aqi}) — เหมาะกับกิจกรรมนี้',
      /** ⛔ `{event}` เป็นชื่อประกาศของกรมอุตุฯ — คงภาษาอังกฤษไว้ตามต้นทาง (`R14`) */
      official_alert_severe: 'มีประกาศเตือนภัยทางการที่ยังมีผล: {event}',
      official_alert_active: 'มีประกาศเตือนภัยทางการที่ยังมีผลอยู่ {count} ใบในจังหวัดนี้',
      no_official_alert: 'ไม่มีประกาศเตือนภัยทางการที่ยังมีผลในพื้นที่นี้',
      official_alert_expired:
        'สแนปช็อตนี้มีประกาศเตือนภัยทางการ {count} ใบที่หมดอายุแล้ว ⇒ ไม่มีผลตอนนี้: {events}',
      missing_air_quality: 'อ่านค่าคุณภาพอากาศไม่ได้ — ไม่ได้แปลว่าอากาศสะอาด',
      missing_forecast: 'อ่านพยากรณ์อากาศไม่ได้ — ไม่ได้แปลว่าจะไม่มีฝน',
      missing_alerts: 'อ่านชั้นประกาศเตือนภัยทางการไม่ได้ — ไม่ได้แปลว่าไม่มีประกาศ',
      advice_stay_indoors: 'อยู่ในอาคาร หรือถ้าจำเป็นต้องออกไป ให้ใส่หน้ากาก N95',
      advice_keep_it_short: 'ใช้เวลาให้สั้นลง และเลี่ยงถนนที่รถหนาแน่น',
      advice_follow_alert: 'ยึดประกาศเตือนภัยทางการก่อน — สำคัญกว่าค่าคุณภาพอากาศ',
      advice_not_enough_data: 'ข้อมูลไม่พอจะตัดสิน — ดูหน้าจอประกอบก่อนตัดสินใจ',
    },
    searchHeading: 'ค้นหาสถานที่',
    noMatch: 'ไม่พบสถานที่นี้ในประเทศไทย',
    alertsLabel: 'ประกาศเตือนภัยทางการ',
    /** 🔴 «อ่านไม่ได้» ⛔ ไม่ใช่ «ไม่มี» — คนละความหมาย และเป็นคำมั่นข้อหนึ่งของหน้านี้ */
    couldNotRead: 'อ่านไม่ได้',
    notAvailable: 'ตอนนี้ยังไม่มีข้อมูลส่วนนี้',
    noTimestamp: 'ต้นทางไม่ได้ระบุเวลาที่วัด',
    cachedCopy: 'สำเนาที่เก็บไว้',
    liveCopy: 'สด',
    layerAir: 'อากาศ:',
    layerAlerts: 'ประกาศ:',
    readByAgent: 'agent เป็นคนอ่าน',
    readByPage: 'หน้าเว็บอ่านเอง',
    levels: {
      good: 'ไปได้เลย',
      caution: 'ระวังหน่อย',
      avoid: 'ยังไม่ควร',
      /** ⛔ «ข้อมูลไม่พอ» ⛔ ไม่ใช่ «ปลอดภัย» — ไม่รู้ ≠ ไม่มีอันตราย */
      unknown: 'ข้อมูลไม่พอ',
    },
    activities: {
      general: 'ทั่วไป',
      outdoor_exercise: 'ออกกำลังกายกลางแจ้ง',
      children_outdoors: 'พาเด็กออกนอกบ้าน',
      travel: 'เดินทาง',
    },
    gaps: {
      air_quality: 'คุณภาพอากาศ',
      forecast: 'พยากรณ์อากาศ',
      alerts: 'ประกาศเตือนภัยทางการ',
    },
  },
};

export const CHALLENGE_COPY: Readonly<Record<ChallengeLang, ChallengeCopy>> = { EN, TH };
