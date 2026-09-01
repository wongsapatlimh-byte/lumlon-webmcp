"use client"; // จำเป็นมาก เพราะต้องใช้ useState และ Context

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// กำหนด Type ของภาษาที่รองรับ
export type LanguageType = 'TH' | 'EN' | 'CN' | 'JP' | 'ES';

// กำหนด Interface สำหรับข้อมูลใน Context
interface LanguageContextType {
  lang: LanguageType;
  setLang: (lang: LanguageType) => void;
}

// สร้าง Context พร้อมค่าเริ่มต้น (default)
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

/** ชุดปิดของภาษาที่รองรับ — ⛔ ค่าที่ไม่อยู่ในนี้ (รวมของขยะใน storage) ต้องตกกลับค่าเริ่มต้น */
const SUPPORTED_LANGS: LanguageType[] = ['TH', 'EN', 'CN', 'JP', 'ES'];

/**
 * 🔴 **`localStorage` โยนได้ ⛔ ไม่ใช่แค่ "ไม่มีตอน SSR"** (แก้ 28 ส.ค. 2026)
 *
 * ตัวกัน `typeof window !== "undefined"` กันได้แค่ฝั่งเซิร์ฟเวอร์ — แต่ในเบราว์เซอร์จริง
 * การ **แตะพรอพเพอร์ตี้ `localStorage` เฉย ๆ ก็โยน `SecurityError` ได้**
 * (Safari ที่ตั้ง *Block All Cookies* · WebView/iframe ที่ปิดที่เก็บข้อมูลของเว็บ)
 *
 * 🔬 **วัดของจริงบน production build 28 ส.ค. 2026:** ตัวนี้อยู่ใน `LanguageProvider`
 *    ซึ่งหุ้ม **root layout** ⇒ มันโยนตั้งแต่ hydrate ⇒ **ทั้งเว็บล่ม ไม่ใช่แค่จอเดียว**
 *    ผู้ใช้เห็นแค่ *"This page couldn't load"* (จาก 1,215 ตัวอักษร เหลือ 70)
 *    ⚠️ สำคัญกับโปรเจกต์นี้เป็นพิเศษเพราะเป้าหมายคือ **LINE WebView** ซึ่งเป็นบริบทที่เกิดเคสนี้ได้จริง
 *
 * ✅ กติกาที่ใช้ = แบบเดียวกับที่ทีมใช้อยู่แล้วใน `src/lib/mascot/prefs.ts` และ `CookieNoticeBar.tsx`:
 *    **อ่าน/เขียนไม่ได้ = ใช้ค่าเริ่มต้นต่อไปเงียบ ๆ ⛔ ไม่ใช่โยนใส่หน้าผู้ใช้**
 *    (จำภาษาไม่ได้ = ผู้ใช้เลือกใหม่ · เว็บล่ม = ผู้ใช้ทำอะไรไม่ได้เลย — คนละระดับกัน)
 */
function readStoredLang(): LanguageType | null {
  try {
    const saved = window.localStorage.getItem("preferredLanguage");
    return saved && SUPPORTED_LANGS.includes(saved as LanguageType) ? (saved as LanguageType) : null;
  } catch {
    return null;
  }
}

function writeStoredLang(next: LanguageType): void {
  try {
    window.localStorage.setItem("preferredLanguage", next);
  } catch {
    /* เขียนไม่ได้ = จำข้ามรอบไม่ได้เท่านั้น · ภาษาที่เพิ่งเลือกยังเปลี่ยนได้ตามปกติ */
  }
}

// สร้าง Provider Component สำหรับหุ้ม Root Layout
/**
 * 🌐 **`initialLang` เพิ่ม 29 ส.ค. 2026 (เลน W) — ค่าปริยายยังเป็น `'TH'` เหมือนเดิมเป๊ะ**
 *    ⇒ แอปจริงไม่เปลี่ยนพฤติกรรมแม้แต่นิดเดียว (ไม่ส่งพรอพ = ได้ของเดิมทุกอย่าง)
 *    เหตุผลที่ต้องมี: ตัวส่งแข่ง WebMCP มีผู้อ่านเป็น **กรรมการต่างชาติ** ⇒ ค่าเริ่มต้น `'TH'`
 *    ทำให้แถบที่บอก *วิธีเปิด WebMCP* ขึ้นภาษาไทย ⇒ คนที่ต้องอ่านมันที่สุดกลับอ่านไม่ออก
 *    🔬 เจอตอนเปิดดูภาพจับจอของสำเนาที่ถ่ายออกไปแล้ว ⛔ ไม่ใช่จากเทส (เทสทุกตัวเขียว)
 * 📌 ค่าที่ผู้ใช้เคยเลือกไว้ใน `localStorage` ยังชนะค่านี้เสมอ — เลือกเองแล้วต้องได้ของที่เลือก
 */
export function LanguageProvider({
  children,
  initialLang = 'TH',
}: {
  children: ReactNode;
  initialLang?: LanguageType;
}) {
  // เก็บภาษาเริ่มต้นที่ TH
  const [lang, setLangState] = useState<LanguageType>(initialLang);

  // ฟังก์ชันสำหรับเปลี่ยนภาษา
  const setLang = (newLang: LanguageType) => {
    setLangState(newLang);
    // บันทึกลง localStorage เพื่อให้จำได้แม้ปิดเบราว์เซอร์แล้วเปิดใหม่ (ล้มเหลวได้ ไม่เป็นไร)
    if (typeof window !== "undefined") writeStoredLang(newLang);
  };

  // โหลดภาษาที่เคยเลือกไว้จาก localStorage ตอนเปิดเว็บครั้งแรก
  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedLang = readStoredLang();
    if (savedLang) setLangState(savedLang);
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

// สร้าง Custom Hook เพื่อให้เรียกใช้ Context ง่ายๆ ในหน้าอื่น
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}