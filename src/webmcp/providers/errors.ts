// src/webmcp/providers/errors.ts
// ────────────────────────────────────────────────────────────────────────────
// 🚨 **ข้อผิดพลาดของชั้นข้อมูล** — แยกจาก `ToolError` โดยตั้งใจ
//
// 🔑 **คนละคำถามกัน:** `ToolError` = *"agent ขออะไรที่ไม่ถูกต้อง"* (ผู้ใช้/agent แก้ได้)
//    ส่วนไฟล์นี้ = *"ระบบข้างล่างตอบเราไม่ได้"* (ผู้ใช้แก้ไม่ได้) ⇒ ตัว tool เป็นคนตัดสินว่า
//    จะแปลงเป็นคำตอบบางส่วน (`gaps`) หรือปฏิเสธทั้งคำสั่ง ตามว่ากำลัง fail คำถามไหน

/** ต้นทาง/ทะเบียนใช้ไม่ได้ชั่วคราว — ⛔ ไม่ใช่ "ไม่มีข้อมูล" */
export class ProviderUnavailableError extends Error {
  /** ส่วนของคำตอบที่หายไปเพราะ error นี้ เช่น `"location_registry"` */
  readonly part: string;

  constructor(part: string, message: string) {
    super(message);
    this.name = 'ProviderUnavailableError';
    this.part = part;
  }
}
