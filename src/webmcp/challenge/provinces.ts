// src/webmcp/challenge/provinces.ts
// ────────────────────────────────────────────────────────────────────────────
// 🗺️ **ทะเบียน 77 จังหวัดฉบับนิ่งของตัวส่งแข่ง** — ⛔ ไฟล์นี้ถูกสร้างด้วยสคริปต์ ห้ามแก้ด้วยมือ
//
// สร้างโดย: `node scripts/webmcp-sync-provinces.mjs`
// ถ่ายจากของจริงเมื่อ: **2026-08-29** (`/api/web/hazard/config`)
//
// 🔑 ตัวแข่งไม่มี backend (มติ D-3) ⇒ ทะเบียนต้องเดินทางไปกับ repo
//    แต่ยังเป็น **ก๊อปที่ถ่ายมา ⛔ ไม่ใช่รายชื่อที่พิมพ์เอง** ([[L-415]] ทะเบียนมีเจ้าของอยู่ที่ BE)
// 🔬 รหัสเป็น **2 หลัก** เช่น `'50'` ⛔ ไม่ใช่รูป ISO `'TH-50'` ([[L-434]])
//
// 📍 `lat`/`lon` = **จุดกึ่งกลางจังหวัด** ⛔ ไม่ใช่ตำแหน่งของผู้ใช้หรือของเหตุการณ์
//
// 🔴 **กติกา GEO-0 ที่บังคับกับพิกัดพวกนี้ — เขียนใหม่ให้ตรงกับความจริง 31 ส.ค. 2026:**
//    ✅ ที่ห้ามจริงคือ **พิกัดห้ามอยู่ใน query string / path / เนื้อคำขอที่ผู้ใช้เป็นคนกำหนด**
//       ⇒ เส้น `/api/webmcp/environment` จึงเป็น **POST ที่รับแค่ `provinceCode`** แล้วเปิด
//         ทะเบียนหาพิกัดเอาเองฝั่งเซิร์ฟเวอร์ · และ `UiPlaceRef` ไม่มีช่องพิกัดเลย
//    ⛔ **สิ่งที่ *ไม่ได้* ห้ามคือทะเบียนนิ่งก้อนนี้เดินทางไปกับบันเดิลฝั่งเบราว์เซอร์**
//       🔬 ข้อความเดิมตรงนี้เขียนว่า *"ห้ามส่งค่าเหล่านี้ออกไปให้เบราว์เซอร์"* ซึ่ง
//          **ขัดกับโค้ดของตัวเองมาตั้งแต่ต้น** — `providers/demoProvider.ts` (โค้ดฝั่งเบราว์เซอร์)
//          `import` ไฟล์นี้ตรง ๆ เพื่อค้นหาจังหวัดโดยไม่ยิงเน็ต ⇒ พิกัดอยู่ในบันเดิลอยู่แล้ว
//       ⇒ ปล่อยคำสั่งห้ามที่เป็นเท็จไว้ อันตรายกว่าไม่มีเลย เพราะคนอ่านจะเลิกเชื่อคำสั่งห้ามอื่นในไฟล์นี้
//    📌 ผู้ใช้ประโยชน์ฝั่งเบราว์เซอร์ตอนนี้: `challenge/ThailandMap.tsx` (วาดหมุด 77 จังหวัด)

export interface ChallengeProvince {
  code: string;
  th: string;
  en: string;
  lat: number;
  lon: number;
}

/** ถ่ายมาเมื่อ 2026-08-29 — จำนวน 77 จังหวัด */
export const CHALLENGE_PROVINCES: readonly ChallengeProvince[] = [
  { code: '10', th: 'กรุงเทพมหานคร', en: 'Bangkok', lat: 13.75, lon: 100.52 },
  { code: '11', th: 'สมุทรปราการ', en: 'Samut Prakan', lat: 13.6, lon: 100.6 },
  { code: '12', th: 'นนทบุรี', en: 'Nonthaburi', lat: 13.86, lon: 100.51 },
  { code: '13', th: 'ปทุมธานี', en: 'Pathum Thani', lat: 14.02, lon: 100.53 },
  { code: '14', th: 'พระนครศรีอยุธยา', en: 'Phra Nakhon Si Ayutthaya', lat: 14.35, lon: 100.58 },
  { code: '15', th: 'อ่างทอง', en: 'Ang Thong', lat: 14.59, lon: 100.46 },
  { code: '16', th: 'ลพบุรี', en: 'Lop Buri', lat: 14.8, lon: 100.65 },
  { code: '17', th: 'สิงห์บุรี', en: 'Sing Buri', lat: 14.89, lon: 100.4 },
  { code: '18', th: 'ชัยนาท', en: 'Chai Nat', lat: 15.19, lon: 100.13 },
  { code: '19', th: 'สระบุรี', en: 'Saraburi', lat: 14.53, lon: 100.91 },
  { code: '20', th: 'ชลบุรี', en: 'Chon Buri', lat: 13.36, lon: 100.98 },
  { code: '21', th: 'ระยอง', en: 'Rayong', lat: 12.68, lon: 101.28 },
  { code: '22', th: 'จันทบุรี', en: 'Chanthaburi', lat: 12.61, lon: 102.1 },
  { code: '23', th: 'ตราด', en: 'Trat', lat: 12.24, lon: 102.51 },
  { code: '24', th: 'ฉะเชิงเทรา', en: 'Chachoengsao', lat: 13.69, lon: 101.07 },
  { code: '25', th: 'ปราจีนบุรี', en: 'Prachin Buri', lat: 14.05, lon: 101.37 },
  { code: '26', th: 'นครนายก', en: 'Nakhon Nayok', lat: 14.2, lon: 101.21 },
  { code: '27', th: 'สระแก้ว', en: 'Sa Kaeo', lat: 13.82, lon: 102.07 },
  { code: '30', th: 'นครราชสีมา', en: 'Nakhon Ratchasima', lat: 14.98, lon: 102.1 },
  { code: '31', th: 'บุรีรัมย์', en: 'Buri Ram', lat: 14.99, lon: 103.1 },
  { code: '32', th: 'สุรินทร์', en: 'Surin', lat: 14.88, lon: 103.49 },
  { code: '33', th: 'ศรีสะเกษ', en: 'Si Sa Ket', lat: 15.12, lon: 104.32 },
  { code: '34', th: 'อุบลราชธานี', en: 'Ubon Ratchathani', lat: 15.24, lon: 104.85 },
  { code: '35', th: 'ยโสธร', en: 'Yasothon', lat: 15.79, lon: 104.15 },
  { code: '36', th: 'ชัยภูมิ', en: 'Chaiyaphum', lat: 15.81, lon: 102.03 },
  { code: '37', th: 'อำนาจเจริญ', en: 'Amnat Charoen', lat: 15.87, lon: 104.63 },
  { code: '38', th: 'บึงกาฬ', en: 'Bueng Kan', lat: 18.36, lon: 103.65 },
  { code: '39', th: 'หนองบัวลำภู', en: 'Nong Bua Lam Phu', lat: 17.2, lon: 102.44 },
  { code: '40', th: 'ขอนแก่น', en: 'Khon Kaen', lat: 16.44, lon: 102.83 },
  { code: '41', th: 'อุดรธานี', en: 'Udon Thani', lat: 17.41, lon: 102.79 },
  { code: '42', th: 'เลย', en: 'Loei', lat: 17.49, lon: 101.73 },
  { code: '43', th: 'หนองคาย', en: 'Nong Khai', lat: 17.88, lon: 102.74 },
  { code: '44', th: 'มหาสารคาม', en: 'Maha Sarakham', lat: 16.18, lon: 103.3 },
  { code: '45', th: 'ร้อยเอ็ด', en: 'Roi Et', lat: 16.05, lon: 103.65 },
  { code: '46', th: 'กาฬสินธุ์', en: 'Kalasin', lat: 16.43, lon: 103.51 },
  { code: '47', th: 'สกลนคร', en: 'Sakon Nakhon', lat: 17.16, lon: 104.15 },
  { code: '48', th: 'นครพนม', en: 'Nakhon Phanom', lat: 17.41, lon: 104.78 },
  { code: '49', th: 'มุกดาหาร', en: 'Mukdahan', lat: 16.54, lon: 104.72 },
  { code: '50', th: 'เชียงใหม่', en: 'Chiang Mai', lat: 18.79, lon: 98.98 },
  { code: '51', th: 'ลำพูน', en: 'Lamphun', lat: 18.58, lon: 99.01 },
  { code: '52', th: 'ลำปาง', en: 'Lampang', lat: 18.29, lon: 99.49 },
  { code: '53', th: 'อุตรดิตถ์', en: 'Uttaradit', lat: 17.62, lon: 100.1 },
  { code: '54', th: 'แพร่', en: 'Phrae', lat: 18.14, lon: 100.14 },
  { code: '55', th: 'น่าน', en: 'Nan', lat: 18.78, lon: 100.77 },
  { code: '56', th: 'พะเยา', en: 'Phayao', lat: 19.17, lon: 99.9 },
  { code: '57', th: 'เชียงราย', en: 'Chiang Rai', lat: 19.91, lon: 99.83 },
  { code: '58', th: 'แม่ฮ่องสอน', en: 'Mae Hong Son', lat: 19.3, lon: 97.97 },
  { code: '60', th: 'นครสวรรค์', en: 'Nakhon Sawan', lat: 15.7, lon: 100.14 },
  { code: '61', th: 'อุทัยธานี', en: 'Uthai Thani', lat: 15.38, lon: 100.02 },
  { code: '62', th: 'กำแพงเพชร', en: 'Kamphaeng Phet', lat: 16.48, lon: 99.52 },
  { code: '63', th: 'ตาก', en: 'Tak', lat: 16.87, lon: 99.13 },
  { code: '64', th: 'สุโขทัย', en: 'Sukhothai', lat: 17.01, lon: 99.82 },
  { code: '65', th: 'พิษณุโลก', en: 'Phitsanulok', lat: 16.82, lon: 100.27 },
  { code: '66', th: 'พิจิตร', en: 'Phichit', lat: 16.44, lon: 100.35 },
  { code: '67', th: 'เพชรบูรณ์', en: 'Phetchabun', lat: 16.42, lon: 101.16 },
  { code: '70', th: 'ราชบุรี', en: 'Ratchaburi', lat: 13.54, lon: 99.82 },
  { code: '71', th: 'กาญจนบุรี', en: 'Kanchanaburi', lat: 14.6, lon: 99 },
  { code: '72', th: 'สุพรรณบุรี', en: 'Suphan Buri', lat: 14.47, lon: 100.12 },
  { code: '73', th: 'นครปฐม', en: 'Nakhon Pathom', lat: 13.82, lon: 100.06 },
  { code: '74', th: 'สมุทรสาคร', en: 'Samut Sakhon', lat: 13.55, lon: 100.27 },
  { code: '75', th: 'สมุทรสงคราม', en: 'Samut Songkhram', lat: 13.41, lon: 100 },
  { code: '76', th: 'เพชรบุรี', en: 'Phetchaburi', lat: 13.11, lon: 99.94 },
  { code: '77', th: 'ประจวบคีรีขันธ์', en: 'Prachuap Khiri Khan', lat: 11.81, lon: 99.8 },
  { code: '80', th: 'นครศรีธรรมราช', en: 'Nakhon Si Thammarat', lat: 8.43, lon: 99.96 },
  { code: '81', th: 'กระบี่', en: 'Krabi', lat: 8.09, lon: 98.91 },
  { code: '82', th: 'พังงา', en: 'Phang Nga', lat: 8.45, lon: 98.53 },
  { code: '83', th: 'ภูเก็ต', en: 'Phuket', lat: 7.88, lon: 98.39 },
  { code: '84', th: 'สุราษฎร์ธานี', en: 'Surat Thani', lat: 9.14, lon: 99.33 },
  { code: '85', th: 'ระนอง', en: 'Ranong', lat: 9.96, lon: 98.64 },
  { code: '86', th: 'ชุมพร', en: 'Chumphon', lat: 10.49, lon: 99.18 },
  { code: '90', th: 'สงขลา', en: 'Songkhla', lat: 7.2, lon: 100.6 },
  { code: '91', th: 'สตูล', en: 'Satun', lat: 6.62, lon: 100.07 },
  { code: '92', th: 'ตรัง', en: 'Trang', lat: 7.56, lon: 99.61 },
  { code: '93', th: 'พัทลุง', en: 'Phatthalung', lat: 7.62, lon: 100.08 },
  { code: '94', th: 'ปัตตานี', en: 'Pattani', lat: 6.87, lon: 101.25 },
  { code: '95', th: 'ยะลา', en: 'Yala', lat: 6.54, lon: 101.28 },
  { code: '96', th: 'นราธิวาส', en: 'Narathiwat', lat: 6.43, lon: 101.82 },
] as const;

/** หาใบเดียวจากรหัส — ⛔ เทียบตรงตัว ไม่เดา (การเดารูปรหัสเป็นหน้าที่ของชั้นบน) */
export function provinceByCode(code: string): ChallengeProvince | null {
  return CHALLENGE_PROVINCES.find((p) => p.code === code) ?? null;
}
