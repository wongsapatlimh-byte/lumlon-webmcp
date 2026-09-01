// src/webmcp/ui/AgentBar.tsx
// ────────────────────────────────────────────────────────────────────────────
// 🤖 **แถบผู้ช่วย AI** — สิ่งเดียวที่ผู้ใช้ *เห็น* จากโมดูล WebMCP ทั้งก้อน
//
// 🔴 **ทำหน้าที่ 3 อย่างที่แยกกันไม่ได้:**
//   ① `D2` **ไม่รองรับก็ต้องไม่พัง** — เบราว์เซอร์ธรรมดาเห็นเว็บปกติ + คำแนะนำวิธีเปิด
//      ⛔ ไม่ใช่จอว่างหรือ error (กรรมการที่เปิดผิดเบราว์เซอร์ต้องรู้ว่าต้องทำอะไรต่อ)
//   ② `D1` **ชุดคำสั่งตัวอย่างที่กดคัดลอกได้** — กรรมการสวมบทได้ใน 5 วินาที
//   ③ `B4` **จอขยับเมื่อ agent ทำงาน** — กฎเฝ้าที่เพิ่งถูกสร้าง และคำเตือนที่เพิ่งเด้ง
//      โผล่ที่นี่ ⇒ คนกับ agent มองของชิ้นเดียวกัน ซึ่งคือธีมของการแข่งขัน
//
// 🪤 **ตำแหน่งบนจอ:** แถบแจ้งคุกกี้เป็น `fixed bottom-0 z-50` เต็มความกว้าง ⇒ ถ้าวางทับกันจะบังกัน
//    เลน 3 ทำตัวแปร `--cookie-notice-h` ไว้ให้แล้ว (แถบประกาศความสูงจริงของตัวเอง · เป็น `0px`
//    เมื่อไม่แสดง) ⇒ ที่นี่หลบด้วยตัวแปรนั้น ⛔ ห้ามเดาความสูงเป็นตัวเลขตายตัว

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/locales/translations';
import type { HostKind } from '../host';
import { subscribeUi, type UiEvent } from '../uiBridge';
import { listWatches, type Watch } from '../watchStore';
import { SUGGESTED_PROMPTS } from './prompts';

export interface AgentBarProps {
  hostKind: HostKind;
  registered: number;
}

/** เวลาที่คำว่า "คัดลอกแล้ว" ค้างอยู่ก่อนกลับเป็น "คัดลอก" */
const COPIED_MS = 1_600;

/**
 * 📏 **แถบนี้ประกาศความสูงของตัวเองออกไป — หน้าที่อยู่ใต้มันจะได้เว้นที่ถูก**
 *
 * 🔬 **ที่มา (เจ้าของเห็นบนโดเมนแข่ง 31 ส.ค. 2026):** แถบเป็น `fixed` มุมล่างซ้าย ⇒ มันลอย
 *    ทับ **บล็อกเครดิตแหล่งข้อมูลท้ายหน้า** จนอ่านไม่ครบ — ซึ่งเป็นบล็อกที่กติกา `R14` บังคับให้มี
 *    ⇒ บังของที่ *ห้ามหาย* พอดี
 * 🔑 ใช้วิธีเดียวกับแถบคุกกี้ของเลน 3 (`--cookie-notice-h`) — **แถบวัดตัวเองแล้วประกาศ**
 *    ⛔ ไม่ใช่ให้หน้าที่ต้องหลบไปเดาความสูงเป็นตัวเลขตายตัว (ความสูงเปลี่ยนตามภาษาและความกว้างจอ)
 * 📌 ไม่ได้ mount = ไม่มีตัวแปร ⇒ ทุกที่ที่อ่านต้องใส่ค่าสำรอง `var(--webmcp-bar-h, 0px)`
 */
export const WEBMCP_BAR_HEIGHT_VAR = '--webmcp-bar-h';

export default function AgentBar({ hostKind, registered }: AgentBarProps) {
  const { lang } = useLanguage();
  const t = translations[lang] as Record<string, string>;

  const [open, setOpen] = useState(false);
  const [watches, setWatches] = useState<Watch[]>([]);
  const [alert, setAlert] = useState<{ label: string; metric: string; observed: number } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const supported = hostKind !== 'none';

  /** อ้างถึง **ปุ่มที่เห็นตลอดเวลา** เท่านั้น ⛔ ไม่ใช่ทั้งกล่องรวมแผงที่กางออก (เหตุผลอยู่ใน effect) */
  const barRef = useRef<HTMLButtonElement | null>(null);

  /**
   * 🔑 อ่านกฎเฝ้าหลัง mount เท่านั้น — `localStorage` ไม่มีตอน render ฝั่งเซิร์ฟเวอร์
   *    ⇒ อ่านตอน render จะทำให้ HTML ของเซิร์ฟเวอร์กับของเบราว์เซอร์ไม่ตรงกัน (hydration mismatch)
   */
  useEffect(() => {
    setWatches(listWatches());
  }, []);

  useEffect(() => {
    return subscribeUi((event: UiEvent) => {
      if (event.type === 'watch.created' || event.type === 'watch.deleted') {
        setWatches(listWatches());
        setOpen(true);
        return;
      }
      if (event.type === 'watch.triggered') {
        setWatches(listWatches());
        setAlert({ label: event.place.labelEn, metric: event.metric, observed: event.observed });
        /** 🔴 คำเตือนต้อง **เปิดตัวเอง** — คำเตือนที่ซ่อนอยู่ในแผงที่พับไว้ ไม่ใช่คำเตือน */
        setOpen(true);
      }
    });
  }, []);

  const status = useMemo(() => {
    if (!supported) return t.webmcpBarUnsupported ?? 'WebMCP is not available in this browser';
    return (t.webmcpBarReady ?? 'Ready · {count} site tools').replace('{count}', String(registered));
  }, [supported, registered, t]);

  /**
   * 📏 **วัดความสูงจริงของปุ่มแล้วประกาศออกไป**
   *
   * 🔴 **วัดเฉพาะปุ่ม ⛔ ไม่ใช่ทั้ง `<div>` ที่ครอบอยู่** — เพราะเมื่อผู้ใช้กางแผงตัวอย่างคำสั่ง
   *    กล่องจะสูงได้ถึง 70% ของจอ ⇒ ถ้าประกาศความสูงรวม หน้าข้างใต้จะกระโดดเว้นที่ว่างมหาศาล
   *    ทุกครั้งที่กดเปิด · แผงที่กางคือของที่ผู้ใช้ **ตั้งใจเปิดเอง** และปิดเองได้ ⇒ ไม่ต้องเว้นที่ให้
   * 🪤 `ResizeObserver` ไม่มีใน jsdom ของเทส ⇒ ต้องกันไว้ ไม่งั้นเทสล้มทั้งไฟล์ (บทเรียนเดียวกับแถบคุกกี้)
   */
  useEffect(() => {
    const root = typeof document === 'undefined' ? null : document.documentElement;
    const el = barRef.current;
    if (!root || !el) return;

    const apply = () => {
      root.style.setProperty(WEBMCP_BAR_HEIGHT_VAR, `${Math.ceil(el.getBoundingClientRect().height)}px`);
    };
    apply();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(apply);
    observer?.observe(el);
    window.addEventListener('resize', apply);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', apply);
      /** ถอด component ออกแล้วต้องคืนเป็น 0 ⛔ ไม่ปล่อยให้หน้าอื่นเว้นที่ให้แถบที่ไม่มีอยู่แล้ว */
      root.style.setProperty(WEBMCP_BAR_HEIGHT_VAR, '0px');
    };
  }, [status]);

  async function copyPrompt(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      window.setTimeout(() => setCopied((current) => (current === text ? null : current)), COPIED_MS);
    } catch {
      /**
       * คลิปบอร์ดถูกปฏิเสธ (ไม่ใช่ secure context / ผู้ใช้ไม่อนุญาต) — ⛔ ไม่ขึ้น error ใส่หน้าผู้ใช้
       * ข้อความยังอยู่บนจอให้เลือกคัดลอกเองได้อยู่แล้ว ⇒ ความล้มเหลวนี้ไม่ได้ปิดทางไปต่อ
       */
      setCopied(null);
    }
  }

  return (
    <div
      className="fixed left-3 z-40 w-[min(22rem,calc(100vw-1.5rem))] sm:left-4"
      /**
       * 🔴 **ระยะห่างจากขอบล่าง 1.5rem ⛔ ไม่ใช่ 0.75rem** (เจ้าของสั่ง 30 ส.ค. 2026 หลังเห็นของจริง)
       *    ของเดิมชิดขอบจนดูเหมือนแถบระบบของเบราว์เซอร์ ⛔ ไม่ใช่ส่วนหนึ่งของหน้าเว็บ
       *    ⚠️ ยังบวก `--cookie-notice-h` เหมือนเดิม — แถบคุกกี้เป็น `fixed bottom-0` ⇒ ถอดออกเมื่อไรทับกันทันที
       */
      style={{ bottom: 'calc(var(--cookie-notice-h, 0px) + 1.5rem)' }}
    >
      {open && (
        <div className="lml-card mb-2 max-h-[70vh] overflow-y-auto p-4 text-sm shadow-lg">
          {alert && (
            <div className="lml-note lml-note-danger mb-3 block">
              <p className="font-bold">{t.webmcpAlertTitle ?? 'A watched reading crossed its threshold'}</p>
              <p className="text-muted">
                {alert.label} · {alert.metric.toUpperCase()} {alert.observed}
              </p>
            </div>
          )}

          {!supported && (
            <div className="lml-note lml-note-info mb-3 block">
              <p className="text-muted">{t.webmcpBarHowTo}</p>
            </div>
          )}

          <p className="mb-2 font-bold text-ink">{t.webmcpBarTry ?? 'Try asking the agent'}</p>
          <ul className="mb-4 flex flex-col gap-2">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <li key={prompt.text} className="flex items-start gap-2">
                {/* 🔑 ประโยคเป็นภาษาอังกฤษเสมอ — เหตุผลอยู่ใน `prompts.ts` (กรรมการต่างชาติกดคัดลอกไปใช้ตรง ๆ) */}
                <span className="flex-1 text-muted">{prompt.text}</span>
                <button
                  type="button"
                  className="lml-btn lml-btn-ghost shrink-0 px-2 py-1 text-xs"
                  onClick={() => void copyPrompt(prompt.text)}
                >
                  {copied === prompt.text ? t.webmcpBarCopied : t.webmcpBarCopy}
                </button>
              </li>
            ))}
          </ul>

          <p className="mb-1 font-bold text-ink">{t.webmcpWatchTitle ?? 'Watches in this browser'}</p>
          <p className="mb-2 text-xs text-muted">{t.webmcpWatchNote}</p>
          {watches.length === 0 ? (
            <p className="text-muted">{t.webmcpWatchEmpty}</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {watches.map((watch) => (
                <li key={watch.id} className="flex items-center justify-between gap-2 text-muted">
                  <span>
                    {watch.place.labelEn} · {watch.metric.toUpperCase()} &gt; {watch.threshold}
                  </span>
                  <span className="text-xs opacity-70">{watch.id}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/*
        🔬 **แก้จากการดูจอจริง (29 ส.ค. 2026):** เดิมวางชื่อกับสถานะไว้ **บรรทัดเดียวกัน**
           แล้วครอบด้วย `truncate` ⇒ บนจอจริงข้อความถูกตัดเป็น *«พร้อมใช้ · เครือ…»*
           ⇒ ตัวเลขจำนวนเครื่องมือ ซึ่งเป็นข้อมูลชิ้นเดียวที่บอกว่า **ระบบทำงานอยู่จริงไหม** หายไปพอดี
        ⇒ แยกเป็น 2 บรรทัด · ปุ่มสูงพอ ⛔ ไม่ตัดข้อความสถานะอีก
        🪤 เทสจับไม่ได้เพราะ `truncate` เป็นเรื่องของ CSS ล้วน — `getByText` ยังเจอข้อความเต็ม ([[L-368]])
      */}
      <button
        ref={barRef}
        type="button"
        className="lml-btn lml-btn-secondary h-auto w-full items-start justify-start gap-2 py-2 text-left shadow-md"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span
          aria-hidden
          className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full"
          style={{ background: supported ? 'var(--color-brand)' : 'var(--color-muted)' }}
        />
        <span className="flex min-w-0 flex-col">
          <span className="font-bold leading-snug">{t.webmcpBarTitle ?? 'This site is agent-ready'}</span>
          <span className="text-xs font-normal leading-snug text-muted">{status}</span>
        </span>
      </button>
    </div>
  );
}
