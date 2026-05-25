import { useState, useMemo, useEffect, useRef } from 'react';
import { Icon } from '../components/ui/Icon';
import { Page } from '../components/layout/Page';
import { fmt } from '../utils/format';
import { useApp } from '../context/AppContext';
import { useConfirm } from '../components/ui/ConfirmDialog';

const TODAY = new Date().toISOString().split('T')[0];

// ─── Invoice print utilities ─────────────────────────────────────────────────

const INVOICE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{
    font-family:'Noto Nastaliq Urdu','Jameel Noori Nastaleeq','Traditional Arabic',sans-serif;
    direction:rtl;background:#f0f0f0;color:#111;
    padding:20px 16px;font-size:15px;line-height:2;
  }
  /* ── outer card ── */
  .inv{
    background:#fff;border:2px solid #1a237e;
    max-width:780px;margin:0 auto;
    box-shadow:0 4px 24px rgba(0,0,0,.18);
  }
  /* ── header image ── */
  .inv img.hdr{width:100%;display:block;border-bottom:3px solid #c62828}
  /* ── title bar ── */
  .inv-title{
    background:#1a237e;color:#fff;
    text-align:center;padding:10px 16px;
    font-size:19px;font-weight:700;line-height:1.5;
    border-bottom:3px solid #c62828;
  }
  .inv-title small{display:block;font-size:12px;font-weight:400;opacity:.85;font-family:'Segoe UI',sans-serif;direction:ltr;margin-top:2px}
  /* ── info grid ── */
  .info-grid{display:grid;grid-template-columns:1fr 1fr;border-bottom:2px solid #1a237e}
  .info-cell{padding:7px 14px;border-left:1px solid #dce0f0}
  .info-cell:nth-child(odd){border-left:none}
  .info-cell:nth-child(1),.info-cell:nth-child(2){border-top:none}
  .info-cell .lbl{font-size:11px;color:#666;display:block;margin-bottom:1px}
  .info-cell .val{font-size:15px;font-weight:700;color:#1a237e}
  /* ── party strip ── */
  .party-strip{
    display:flex;justify-content:space-between;align-items:center;
    background:#f5f7ff;padding:8px 16px;
    border-bottom:2px solid #1a237e;font-size:14px;
  }
  .party-strip .pname{font-weight:700;font-size:16px;color:#1a237e}
  .party-strip .pphone{color:#555;font-family:'Segoe UI',sans-serif;direction:ltr}
  /* ── section heading ── */
  .sec-head{
    background:#e8eaf6;color:#1a237e;
    padding:6px 16px;font-weight:700;font-size:14px;
    border-top:1px solid #c5cae9;border-bottom:1px solid #c5cae9;
  }
  /* ── items table ── */
  .items-tbl{width:100%;border-collapse:collapse}
  .items-tbl th{
    background:#1a237e;color:#fff;
    padding:9px 12px;font-size:14px;font-weight:700;
    border:1px solid #1a237e;text-align:center;
  }
  .items-tbl td{
    padding:8px 12px;border:1px solid #d0d4e8;
    font-size:14px;text-align:center;vertical-align:middle;
  }
  .items-tbl td.name{text-align:right;font-weight:600}
  .items-tbl tbody tr:nth-child(even){background:#f8f9ff}
  .items-tbl tfoot td{
    background:#e8eaf6;font-weight:700;
    border-top:2px solid #1a237e;
  }
  /* ── totals block ── */
  .totals-wrap{display:flex;justify-content:flex-start;padding:0 0 0 0;border-top:2px solid #1a237e}
  .totals-inner{width:55%;border-left:2px solid #1a237e}
  .t-row{
    display:flex;justify-content:space-between;
    padding:7px 14px;border-bottom:1px solid #e0e4f0;
    font-size:14px;
  }
  .t-row .lbl{color:#333}
  .t-row .amt{font-family:'Courier New',monospace;font-weight:700;color:#111}
  .t-row.ded .lbl{color:#c62828}
  .t-row.ded .amt{color:#c62828}
  .t-row.net{
    background:#1a237e;color:#fff;
    padding:11px 14px;font-size:16px;font-weight:700;
  }
  .t-row.net .amt{color:#ffd54f;font-size:17px}
  /* ── remarks ── */
  .remarks{
    border-top:1px dashed #aaa;padding:10px 16px;
    font-size:13px;color:#555;background:#fffde7;
  }
  /* ── sign row ── */
  .sign-row{
    display:flex;justify-content:space-between;
    padding:18px 30px 10px;border-top:1px solid #dce0f0;
    font-size:13px;color:#555;
  }
  .sign-box{text-align:center;min-width:130px}
  .sign-line{border-top:1px solid #555;margin-top:28px;padding-top:4px}
  /* ── footer ── */
  .inv-footer{
    border-top:2px solid #1a237e;
    background:#f5f7ff;padding:8px 16px;
    text-align:center;
    font-family:'Segoe UI',Arial,sans-serif;direction:ltr;
    font-size:11px;color:#444;
  }
  .inv-footer strong{color:#1a237e}
  .inv-footer a{color:#c62828;text-decoration:none}
  .inv-footer .pdate{font-size:10px;color:#999;margin-top:2px}
  /* ── status badge ── */
  .status{display:inline-block;padding:2px 12px;border-radius:20px;font-size:12px;font-weight:700}
  .status.green{background:#e8f5e9;color:#1b5e20;border:1px solid #a5d6a7}
  .status.red{background:#ffebee;color:#b71c1c;border:1px solid #ef9a9a}
  .status.blue{background:#e8eaf6;color:#1a237e;border:1px solid #9fa8da}
  @media print{
    body{background:#fff;padding:0}
    .inv{border:none;box-shadow:none;max-width:none}
  }
`;

const openWin = (title, body) => {
  const w = window.open('', '_blank', 'width=860,height=1050');
  w.document.write(`<!DOCTYPE html><html lang="ur" dir="rtl"><head><meta charset="utf-8"><title>${title}</title><style>${INVOICE_CSS}</style></head><body>${body}</body></html>`);
  w.document.close(); w.focus(); setTimeout(() => w.print(), 950);
};

const fmtN = n => (n || 0).toLocaleString('en-PK');
const urDate = d => new Date(d || new Date()).toLocaleDateString('ur-PK', { day: '2-digit', month: 'long', year: 'numeric' });
const enDate = d => new Date(d || new Date()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const hdr = () => `<img class="hdr" src="${window.location.origin}/pdf-header.jpeg" alt="" onerror="this.style.display='none'">`;

const footer = () => `
  <div class="inv-footer">
    <div><strong>Powered by Nexaura Technologies</strong> &nbsp;·&nbsp; <a href="https://www.nexauratechs.com">www.nexauratechs.com</a></div>
    <div class="pdate">Print date: ${enDate()} &nbsp;|&nbsp; پرنٹ تاریخ: ${urDate()}</div>
  </div>`;

const infoCell = (lbl, val) => `<div class="info-cell"><span class="lbl">${lbl}</span><span class="val">${val || '—'}</span></div>`;

const tRow = (lbl, amt, cls = '') => `<div class="t-row ${cls}"><span class="lbl">${lbl}</span><span class="amt">Rs. ${fmtN(amt)}</span></div>`;

export const computeBuyerPrevBalance = (entries, buyerName, currentEntryId) => {
  if (!buyerName?.trim() || !Array.isArray(entries)) return 0;
  const key = buyerName.trim().toLowerCase();
  let total = 0;
  for (const e of entries) {
    if (e.id === currentEntryId) continue;
    const commDiv = e.commDiv || 13.78;
    const logRate = e.logRate || 5;
    for (const b of (e.buyerList || [])) {
      if ((b.name || '').trim().toLowerCase() !== key) continue;
      const bG = (b.crates || 0) * (b.price || 0);
      const bW = b.wari !== undefined ? b.wari : (b.crates || 0) * logRate;
      const bC = b.commission !== undefined ? b.commission : Math.round(bG / commDiv);
      const bN = bG + bC + bW - (b.discount || 0) - (b.advance || 0);
      if (bN > 0) total += bN;
    }
  }
  return total;
};

// ── 1. Individual owner invoice (buyer names hidden) ─────────────────────────
export const printOwnerInvoice = ({ owner, owners, sup, buyers = [], rates = {}, derived, appliedAdvance = 0 }) => {
  const totalCrates = owners.reduce((s, o) => s + (o.crates || 0), 0);
  const share  = totalCrates > 0 ? (owner.crates || 0) / totalCrates : 1;
  const oGross = (owner.crates || 0) * (owner.rate || 0);
  const oLab   = Math.round((derived.labour || 0) * share);
  const oLaga  = Math.round((derived.laga   || 0) * share);
  const oFare  = Math.round((sup.fare || 0) * share);
  const oAdv   = Math.round(appliedAdvance * share);
  const oBal   = oGross - oLab - oLaga - oFare - oAdv;
  const lotRows = buyers.filter(b => (b.crates || 0) > 0).map((b, i) => `
    <tr>
      <td class="name">لاٹ ${i + 1}</td>
      <td>${fmtN(b.crates)}</td>
      <td>Rs. ${fmtN(b.price)}</td>
      <td>Rs. ${fmtN((b.crates || 0) * (b.price || 0))}</td>
    </tr>`).join('');
  openWin(`مالک رسید — ${owner.name}`, `<div class="inv">
    ${hdr()}
    <div class="inv-title">مالک / بیوپاری رسید
      <small>Bilty: ${sup.bilty || '—'} &nbsp;|&nbsp; Vehicle: ${sup.vehicle || '—'} &nbsp;|&nbsp; ${enDate(sup.loadDate)}</small>
    </div>
    <div class="info-grid">
      ${infoCell('مالک کا نام', owner.name)}
      ${infoCell('شہر / مقام', sup.city)}
      ${infoCell('کریٹ (آپ کے)', `${fmtN(owner.crates)} کریٹ — ${Math.round(share * 100)}٪ ٹرک`)}
      ${infoCell('آپ کا ریٹ', `Rs. ${fmtN(owner.rate)} فی کریٹ`)}
    </div>
    ${lotRows ? `
    <div class="sec-head">فروخت کی تفصیل &nbsp;·&nbsp; خریداروں کے نام پوشیدہ ہیں</div>
    <table class="items-tbl">
      <thead><tr><th>#</th><th>کریٹ</th><th>ریٹ (فی کریٹ)</th><th>رقم</th></tr></thead>
      <tbody>${lotRows}
        <tfoot><tr>
          <td class="name" colspan="1"><strong>کل</strong></td>
          <td><strong>${fmtN(buyers.filter(b=>(b.crates||0)>0).reduce((s,b)=>s+(b.crates||0),0))}</strong></td>
          <td>—</td>
          <td><strong>Rs. ${fmtN(oGross)}</strong></td>
        </tr></tfoot>
      </tbody>
    </table>` : ''}
    <div class="sec-head">حساب کتاب</div>
    <div class="totals-wrap">
      <div class="totals-inner">
        ${tRow('مجموعی رقم (آپ کا مال)', oGross)}
        ${tRow('(-) مزدوری', oLab, 'ded')}
        ${tRow('(-) لاگا', oLaga, 'ded')}
        ${oFare ? tRow('(-) ٹرک کرایہ', oFare, 'ded') : ''}
        ${oAdv  ? tRow('(-) پیشگی (خود کار)', oAdv, 'ded') : ''}
        ${tRow('خالص ادائیگی', Math.abs(oBal), 'net')}
      </div>
    </div>
    <div class="sign-row">
      <div class="sign-box"><div class="sign-line">دستخط مالک</div></div>
      <div class="sign-box"><div class="sign-line">مہر / دستخط منڈی</div></div>
    </div>
    ${footer()}
  </div>`);
};

// ── 2. Full supplier invoice (all owners + anonymous lots) ───────────────────
export const printFullSupplierInvoice = ({ sup, owners, derived, buyers = [], appliedAdvance = 0 }) => {
  const { gross, labour, laga, balance } = derived;
  const totalCrates = owners.reduce((s, o) => s + (o.crates || 0), 0);
  const ownerRows = owners.map((o, i) => `
    <tr>
      <td class="name">${i + 1}. ${o.name || '—'}</td>
      <td>${fmtN(o.crates)}</td>
      <td>Rs. ${fmtN(o.rate)}</td>
      <td>Rs. ${fmtN((o.crates || 0) * (o.rate || 0))}</td>
    </tr>`).join('');
  const lotRows = buyers.filter(b => (b.crates || 0) > 0).map((b, i) => `
    <tr>
      <td class="name">لاٹ ${i + 1}</td>
      <td>${fmtN(b.crates)}</td>
      <td>Rs. ${fmtN(b.price)}</td>
      <td>Rs. ${fmtN((b.crates || 0) * (b.price || 0))}</td>
    </tr>`).join('');
  openWin(`بیوپاری رسید — ${sup.vehicle || ''}`, `<div class="inv">
    ${hdr()}
    <div class="inv-title">بیوپاری مکمل رسید
      <small>Bilty: ${sup.bilty || '—'} &nbsp;|&nbsp; Vehicle: ${sup.vehicle || '—'} &nbsp;|&nbsp; ${enDate(sup.loadDate)}</small>
    </div>
    <div class="info-grid">
      ${infoCell('شہر / مقام', sup.city)}
      ${infoCell('فون نمبر', sup.phone)}
      ${infoCell('کل کریٹ', `${fmtN(totalCrates)} کریٹ`)}
      ${infoCell('کل مجموعی رقم', `Rs. ${fmtN(gross)}`)}
    </div>
    <div class="sec-head">مالکان مال کی تفصیل</div>
    <table class="items-tbl">
      <thead><tr><th>مالک کا نام</th><th>کریٹ</th><th>ریٹ (فی کریٹ)</th><th>رقم</th></tr></thead>
      <tbody>${ownerRows}</tbody>
      <tfoot><tr>
        <td class="name"><strong>کل</strong></td>
        <td><strong>${fmtN(totalCrates)}</strong></td>
        <td>—</td>
        <td><strong>Rs. ${fmtN(gross)}</strong></td>
      </tr></tfoot>
    </table>
    ${lotRows ? `
    <div class="sec-head">فروخت کی تفصیل &nbsp;·&nbsp; خریداروں کے نام پوشیدہ ہیں</div>
    <table class="items-tbl">
      <thead><tr><th>#</th><th>کریٹ</th><th>ریٹ (فی کریٹ)</th><th>رقم</th></tr></thead>
      <tbody>${lotRows}</tbody>
    </table>` : ''}
    <div class="sec-head">کٹوتیاں اور خالص ادائیگی</div>
    <div class="totals-wrap">
      <div class="totals-inner">
        ${tRow('مجموعی رقم', gross)}
        ${tRow('(-) مزدوری', labour, 'ded')}
        ${tRow('(-) لاگا', laga, 'ded')}
        ${sup.fare ? tRow('(-) ٹرک کرایہ', sup.fare, 'ded') : ''}
        ${appliedAdvance ? tRow('(-) پیشگی (خود کار)', appliedAdvance, 'ded') : ''}
        ${tRow('خالص ادائیگی', Math.abs(balance), 'net')}
      </div>
    </div>
    ${sup.remarks ? `<div class="remarks"><strong>نوٹ:</strong> ${sup.remarks}</div>` : ''}
    <div class="sign-row">
      <div class="sign-box"><div class="sign-line">دستخط بیوپاری</div></div>
      <div class="sign-box"><div class="sign-line">مہر / دستخط منڈی</div></div>
    </div>
    ${footer()}
  </div>`);
};

// ── 3. Individual buyer invoice ──────────────────────────────────────────────
export const printBuyerInvoice = ({ buyer, sup, rates, entryId = '—', prevBalance = 0 }) => {
  const bGross = (buyer.crates || 0) * (buyer.price || 0);
  const bWari  = (buyer.crates || 0) * (rates.wari || 5);
  const bComm  = Math.round(bGross / (rates.commDiv || 13.78));
  const bThis  = bGross + bComm + bWari - (buyer.discount || 0) - (buyer.advance || 0);
  const bNet   = bThis + (prevBalance || 0);
  const cleared = bNet <= 0;
  const typeLabel = buyer.type === 'Credit' ? 'ادھار' : 'نقد';
  openWin(`خریدار رسید — ${buyer.name}`, `<div class="inv">
    ${hdr()}
    <div class="inv-title">خریدار رسید
      <small>Entry: ${entryId} &nbsp;|&nbsp; Bill: ${buyer.bill || '—'} &nbsp;|&nbsp; ${enDate(buyer.date || sup.loadDate)}</small>
    </div>
    <div class="info-grid">
      ${infoCell('خریدار کا نام', buyer.name)}
      ${infoCell('فون نمبر', buyer.phone)}
      ${infoCell('بل نمبر', buyer.bill)}
      ${infoCell('قسم', `<span class="status ${buyer.type === 'Credit' ? 'red' : 'green'}">${typeLabel}</span>`)}
      ${infoCell('بیوپاری / گاڑی', `${sup.traderName || sup.supplier || '—'} · ${sup.vehicle || '—'}`)}
      ${infoCell('شہر / مقام', sup.city)}
    </div>
    <div class="sec-head">خریداری کی تفصیل</div>
    <table class="items-tbl">
      <thead><tr><th>جنس</th><th>تعداد (کریٹ)</th><th>ریٹ (فی کریٹ)</th><th>رقم</th></tr></thead>
      <tbody>
        <tr><td class="name">مال (${sup.city || ''})</td><td>${fmtN(buyer.crates)}</td><td>Rs. ${fmtN(buyer.price)}</td><td>Rs. ${fmtN(bGross)}</td></tr>
      </tbody>
    </table>
    <div class="sec-head">حساب کتاب</div>
    <div class="totals-wrap">
      <div class="totals-inner">
        ${tRow('مجموعی رقم', bGross)}
        ${buyer.discount ? tRow('(-) رعایت', buyer.discount, 'ded') : ''}
        ${buyer.advance  ? tRow('(-) پیشگی ادا شدہ', buyer.advance, 'ded') : ''}
        ${prevBalance > 0 ? `<div class="t-row" style="color:#c62828"><span class="lbl">(+) پچھلا بقایہ</span><span class="amt" style="color:#c62828">Rs. ${fmtN(prevBalance)}</span></div>` : ''}
        <div class="t-row net" style="${cleared ? 'background:#1b5e20' : ''}">
          <span class="lbl">${cleared ? 'مکمل ادا شدہ ✓' : 'کل واجب الادا'}</span>
          <span class="amt">Rs. ${fmtN(Math.abs(bNet))}</span>
        </div>
      </div>
    </div>
    <div class="sign-row">
      <div class="sign-box"><div class="sign-line">دستخط خریدار</div></div>
      <div class="sign-box"><div class="sign-line">مہر / دستخط منڈی</div></div>
    </div>
    ${footer()}
  </div>`);
};

// ── 4. All buyers summary invoice ────────────────────────────────────────────
export const printAllCustomersInvoice = ({ sup, buyers, rates, derived, entryId = '—' }) => {
  const { custGross, commission, wari, custRemaining, custDiscount, custAdvancePaid } = derived;
  const valid = buyers.filter(b => b.name?.trim());
  const rows = valid.map((b, i) => {
    const bG = (b.crates || 0) * (b.price || 0);
    const bW = (b.crates || 0) * (rates.wari || 5);
    const bC = Math.round(bG / (rates.commDiv || 13.78));
    const bN = bG + bC + bW - (b.discount || 0) - (b.advance || 0);
    return `<tr>
      <td class="name">${i + 1}. ${b.name}</td>
      <td>${fmtN(b.crates)}</td>
      <td>Rs. ${fmtN(b.price)}</td>
      <td>Rs. ${fmtN(bG)}</td>
      <td style="color:#1b5e20">Rs. ${fmtN(bC + bW)}</td>
      <td style="color:#c62828">Rs. ${fmtN((b.discount || 0) + (b.advance || 0))}</td>
      <td><span class="status ${bN <= 0 ? 'green' : 'red'}">Rs. ${fmtN(Math.abs(bN))}${bN <= 0 ? ' ✓' : ''}</span></td>
    </tr>`;
  }).join('');
  openWin(`خریداروں کا خلاصہ — ${entryId}`, `<div class="inv">
    ${hdr()}
    <div class="inv-title">خریداروں کا مکمل خلاصہ
      <small>Entry: ${entryId} &nbsp;|&nbsp; Vehicle: ${sup.vehicle || '—'} (${sup.city || '—'}) &nbsp;|&nbsp; ${enDate(sup.loadDate)}</small>
    </div>
    <div class="info-grid">
      ${infoCell('بلٹی نمبر', sup.bilty)}
      ${infoCell('تاریخ', urDate(sup.loadDate))}
      ${infoCell('کل خریدار', `${valid.length} خریدار`)}
      ${infoCell('کل وصولی', `Rs. ${fmtN(Math.abs(custRemaining || 0))}`)}
    </div>
    <div class="sec-head">خریداروں کی مکمل تفصیل</div>
    <table class="items-tbl">
      <thead><tr>
        <th>خریدار</th><th>کریٹ</th><th>ریٹ</th><th>رقم</th>
        <th>کمیشن+نگواری</th><th>رعایت+پیشگی</th><th>بقایہ</th>
      </tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr>
        <td class="name" colspan="3"><strong>کل</strong></td>
        <td><strong>Rs. ${fmtN(custGross)}</strong></td>
        <td style="color:#1b5e20"><strong>Rs. ${fmtN((commission||0)+(wari||0))}</strong></td>
        <td style="color:#c62828"><strong>Rs. ${fmtN((custDiscount||0)+(custAdvancePaid||0))}</strong></td>
        <td><strong>Rs. ${fmtN(Math.abs(custRemaining||0))}</strong></td>
      </tr></tfoot>
    </table>
    <div class="sec-head">کل خلاصہ</div>
    <div class="totals-wrap">
      <div class="totals-inner">
        ${tRow('مجموعی رقم', custGross)}
        <div class="t-row" style="color:#1b5e20"><span class="lbl">(+) کمیشن + نگواری</span><span class="amt" style="color:#1b5e20">Rs. ${fmtN((commission||0)+(wari||0))}</span></div>
        ${tRow('(-) رعایت + پیشگی', (custDiscount||0)+(custAdvancePaid||0), 'ded')}
        ${tRow('کل وصولی', Math.abs(custRemaining||0), 'net')}
      </div>
    </div>
    <div class="sign-row">
      <div class="sign-box"><div class="sign-line">دستخط ذمہ دار</div></div>
      <div class="sign-box"><div class="sign-line">مہر / دستخط منڈی</div></div>
    </div>
    ${footer()}
  </div>`);
};

export const SectionHead = ({ num, en, ur, icon }) => (
  <div className="row" style={{ marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid var(--glass-border)' }}>
    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,167,38,0.1)', color: 'var(--orange-400)', display: 'grid', placeItems: 'center' }}>
      <Icon name={icon} size={15} />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13, fontWeight: 700 }}>{en}</div>
      <div className="ur small">{ur}</div>
    </div>
    {num && <span className="tiny mono">{num}</span>}
  </div>
);

export const Field = ({ en, ur, req, children, hint }) => (
  <div className="field">
    <div className="field-label">
      <span>{en}{req && <span className="req">*</span>}</span>
      <span className="ur">{ur}</span>
    </div>
    {children}
    {hint && <div className="tiny" style={{ marginTop: 2, color: 'var(--orange-400)' }}>{hint}</div>}
  </div>
);

export const SupplierForm = ({ sup, setSup, owners, setOwners, payments, setPayments, derived, buyers = [], rates = { logRate: 5, commDiv: 13.78 }, entryId = 'DRAFT', appliedAdvance = 0, ownerAdvances = [], cratesRemaining = 0, avgCustRate = 0 }) => {
  const { gross, labour, laga, totalDed, balance } = derived;
  const totalOwnerCrates = owners.reduce((s, o) => s + (o.crates || 0), 0);
  const soldCrates = totalOwnerCrates - cratesRemaining;
  const set = (k, v) => setSup(prev => ({ ...prev, [k]: v }));

  const addOwner = () => setOwners(prev => [...prev, { id: Date.now(), name: '', crates: 0, rate: 0 }]);
  const removeOwner = id => setOwners(prev => prev.filter(o => o.id !== id));
  const updateOwner = (id, k, v) => setOwners(prev => prev.map(o => o.id === id ? { ...o, [k]: v } : o));

  const addPayment = () => setPayments(prev => [...prev, { id: Date.now(), amount: 0, date: TODAY, method: 'Cash' }]);
  const updatePayment = (id, k, v) => setPayments(prev => prev.map(p => p.id === id ? { ...p, [k]: v } : p));

  return (
    <div className="glass" style={{ padding: 24, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--orange-500)' }} />

      <div className="row" style={{ marginBottom: 18 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(245,166,35,0.15)', border: '1px solid rgba(255,167,38,0.3)', display: 'grid', placeItems: 'center', color: 'var(--orange-400)' }}>
          <Icon name="truck" size={18} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="row" style={{ alignItems: 'baseline', gap: 8 }}>
            <h2 className="h2">Supplier (IN)</h2>
            <span className="ur" style={{ fontSize: 16 }}>بیوپاری</span>
          </div>
          <div className="small">Goods coming in — what we owe the trader</div>
        </div>
        <span className="chip active">Side A</span>
      </div>

      <div className="glass-strong mini-summary-grid" style={{ padding: 14, marginBottom: 18 }}>
        <div>
          <div className="tiny">Gross / کل رقم</div>
          <div className="num num-md" style={{ color: 'var(--text-1)' }}>{fmt(gross)}</div>
        </div>
        <div>
          <div className="tiny">Deductions / کٹوتیاں</div>
          <div className="num num-md" style={{ color: 'var(--danger)' }}>−{fmt(totalDed)}</div>
        </div>
        <div>
          <div className="tiny">Net Payable / بقایا</div>
          <div className="num num-md" style={{ color: 'var(--orange-400)' }}>{fmt(balance)}</div>
        </div>
      </div>
      {totalOwnerCrates > 0 && (
        <div style={{ display: 'flex', gap: 16, padding: '8px 14px', marginBottom: 12, background: cratesRemaining < 0 ? 'rgba(248,113,113,0.08)' : cratesRemaining === 0 ? 'rgba(52,211,153,0.08)' : 'rgba(245,166,35,0.08)', border: `1px solid ${cratesRemaining < 0 ? 'rgba(248,113,113,0.3)' : cratesRemaining === 0 ? 'rgba(52,211,153,0.3)' : 'rgba(245,166,35,0.25)'}`, borderRadius: 8, fontSize: 12, flexWrap: 'wrap' }}>
          <span><Icon name="box" size={12} style={{ verticalAlign: 'middle' }} /> In: <strong>{totalOwnerCrates}</strong></span>
          <span>Sold: <strong>{soldCrates}</strong></span>
          <span style={{ color: cratesRemaining < 0 ? 'var(--danger)' : cratesRemaining === 0 ? 'var(--success)' : 'var(--orange-400)', fontWeight: 600 }}>Remaining: {cratesRemaining}</span>
          {avgCustRate > 0 && <span style={{ marginLeft: 'auto' }}>Avg Sale: <strong>Rs. {avgCustRate.toLocaleString()}/cr</strong></span>}
        </div>
      )}
      {appliedAdvance > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', marginBottom: 14, background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.25)', borderRadius: 8, fontSize: 12 }}>
          <Icon name="wallet" size={13} />
          <span style={{ flex: 1 }}>Advance applied from dashboard · <strong>Rs. {appliedAdvance.toLocaleString()}</strong> deducted</span>
          <span className="chip warn" style={{ fontSize: 10 }}>Auto-applied</span>
        </div>
      )}

      <SectionHead num="1–2" en="Trader Identity" ur="بیوپاری کا تعارف" icon="user" />
      <div className="input-row">
        <Field en="Trader Name" ur="بیوپاری نام" req>
          <input className="input" placeholder="e.g. Haji Saleem" value={sup.traderName} onChange={e => set('traderName', e.target.value)} />
        </Field>
        <Field en="City" ur="شہر" req>
          <input className="input" placeholder="e.g. Quetta" value={sup.city} onChange={e => set('city', e.target.value)} />
        </Field>
      </div>

      <div className="spacer-sm" />
      <SectionHead num="3–9" en="Truck Data" ur="ٹرک کی تفصیلات" icon="truck" />
      <div className="input-row">
        <Field en="Phone Number" ur="فون نمبر">
          <input className="input" placeholder="03XX-XXXXXXX" value={sup.phone} onChange={e => set('phone', e.target.value)} />
        </Field>
        <Field en="Bilty Number" ur="بلٹی نمبر">
          <input className="input" placeholder="BLT-123" value={sup.bilty} onChange={e => set('bilty', e.target.value)} />
        </Field>
      </div>
      <div className="spacer-sm" />
      <div className="input-row">
        <Field en="Vehicle Number" ur="گاڑی نمبر" req>
          <input className="input mono" placeholder="LES-1842" value={sup.vehicle} onChange={e => set('vehicle', e.target.value)} />
        </Field>
        <Field en="Loading Date" ur="لوڈنگ تاریخ" req>
          <input className="input" type="date" value={sup.loadDate} onChange={e => set('loadDate', e.target.value)} />
        </Field>
      </div>
      <div className="spacer-sm" />
      <div className="input-row-3">
        <Field en="Truck Fare" ur="ٹرک کرایہ">
          <div className="input-prefix"><span className="pre">Rs.</span><input className="input num" type="number" value={sup.fare || ''} onChange={e => set('fare', +e.target.value || 0)} placeholder="0" /></div>
        </Field>
        <Field en="Labour /crate" ur="مزدوری" hint={`Auto · Total ${fmt(labour)}`}>
          <div className="input-prefix"><span className="pre">Rs.</span><input className="input num" type="number" value={sup.labourRate} onChange={e => set('labourRate', +e.target.value || 0)} /></div>
        </Field>
        <Field en="Laga /crate" ur="لاگا" hint={`Auto · Total ${fmt(laga)}`}>
          <div className="input-prefix"><span className="pre">Rs.</span><input className="input num" type="number" value={sup.lagaRate} onChange={e => set('lagaRate', +e.target.value || 0)} /></div>
        </Field>
      </div>

      <div className="spacer" />
      <SectionHead num="10–13" en="Goods Owners" ur="مالکان / پارٹیز" icon="users" />
      {owners.map((o, i) => (
        <div key={o.id} className="glass-strong" style={{ padding: 14, marginBottom: 10 }}>
          <div className="row between" style={{ marginBottom: 10 }}>
            <strong style={{ fontSize: 12, color: 'var(--orange-400)' }}>Owner {i + 1}</strong>
            <div className="row gap-sm">
              <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }} title="Print owner invoice"
                onClick={() => {
              const lb = buyers.filter(b => b.ownerId === o.id && (b.crates || 0) > 0);
              const sc = lb.reduce((s, b) => s + (b.crates || 0), 0);
              const sv = lb.reduce((s, b) => s + (b.crates || 0) * (b.price || 0), 0);
              const allDerived = owners.map(ow => {
                const l = buyers.filter(b => b.ownerId === ow.id && (b.crates || 0) > 0);
                const ts = l.reduce((s, b) => s + (b.crates || 0), 0);
                const tv = l.reduce((s, b) => s + (b.crates || 0) * (b.price || 0), 0);
                return { ...ow, rate: ts > 0 ? Math.round(tv / ts) : 0 };
              });
              printOwnerInvoice({ owner: { ...o, rate: sc > 0 ? Math.round(sv / sc) : 0 }, owners: allDerived, sup, buyers: lb, rates, derived, appliedAdvance });
            }}>
                <Icon name="print" size={11} />
              </button>
              {owners.length > 1 && (
                <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }} onClick={() => removeOwner(o.id)}><Icon name="trash" size={11} /></button>
              )}
            </div>
          </div>
          <Field en="Owner Name" ur="مالک کا نام" req>
            <input className="input" value={o.name} onChange={e => updateOwner(o.id, 'name', e.target.value)} />
          </Field>
          {(() => {
            const oa = ownerAdvances.find(d => d.isOwner && d.name.toLowerCase() === o.name.trim().toLowerCase());
            return oa ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, padding: '5px 8px', background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.3)', borderRadius: 6, fontSize: 11 }}>
                <Icon name="wallet" size={11} />
                <span>Active advance: <strong>Rs. {oa.total.toLocaleString()}</strong> — will auto-deduct on save</span>
              </div>
            ) : null;
          })()}
          <div className="spacer-sm" />
          <div className="input-row" style={{ marginBottom: 10 }}>
            <Field en="Crates" ur="کریٹ" req>
              <input className="input num" type="number" value={o.crates || ''} onChange={e => updateOwner(o.id, 'crates', +e.target.value || 0)} placeholder="0" />
            </Field>
          </div>
          {(() => {
            const linked = buyers.filter(b => b.ownerId === o.id);
            const soldCr = linked.reduce((s, b) => s + (b.crates || 0), 0);
            const salesVal = linked.reduce((s, b) => s + (b.crates || 0) * (b.price || 0), 0);
            const avgR = soldCr > 0 ? Math.round(salesVal / soldCr) : 0;
            return (
              <>
                <div style={{ display: 'flex', gap: 12, padding: '8px 12px', background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.2)', borderRadius: 8, marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div className="tiny" style={{ color: 'var(--text-4)', marginBottom: 2 }}>Avg Rate /crate · اوسط ریٹ</div>
                    <div className="num" style={{ fontSize: 15, fontWeight: 700, color: avgR > 0 ? 'var(--orange-400)' : 'var(--text-4)' }}>
                      {avgR > 0 ? `Rs. ${avgR.toLocaleString()}` : '—'}
                    </div>
                  </div>
                  <div style={{ width: 1, background: 'rgba(245,166,35,0.2)' }} />
                  <div style={{ flex: 1 }}>
                    <div className="tiny" style={{ color: 'var(--text-4)', marginBottom: 2 }}>Total Sales · کل فروخت</div>
                    <div className="num" style={{ fontSize: 15, fontWeight: 700, color: salesVal > 0 ? 'var(--orange-400)' : 'var(--text-4)' }}>
                      {salesVal > 0 ? `Rs. ${salesVal.toLocaleString()}` : '—'}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 8, padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid var(--glass-border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8, fontWeight: 600 }}>Goods Sold · فروخت شدہ مال</div>
                  <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ color: 'var(--text-4)', borderBottom: '1px solid var(--glass-border)' }}>
                        <th style={{ textAlign: 'left', padding: '4px 6px', fontWeight: 500 }}>Buyer</th>
                        <th style={{ textAlign: 'right', padding: '4px 6px', fontWeight: 500 }}>Crates</th>
                        <th style={{ textAlign: 'right', padding: '4px 6px', fontWeight: 500 }}>Rate /cr</th>
                        <th style={{ textAlign: 'right', padding: '4px 6px', fontWeight: 500 }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {linked.length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ padding: '10px 6px', textAlign: 'center', color: 'var(--text-4)', fontStyle: 'italic' }}>
                            No sales linked yet — select this owner in a customer card
                          </td>
                        </tr>
                      ) : linked.map((b, idx) => (
                        <tr key={b.id} style={{ borderTop: '1px solid var(--glass-border)' }}>
                          <td style={{ padding: '5px 6px', color: 'var(--text-2)' }}>{b.name || `Lot ${idx + 1}`}</td>
                          <td style={{ padding: '5px 6px', textAlign: 'right', fontFamily: 'monospace' }}>{b.crates}</td>
                          <td style={{ padding: '5px 6px', textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-3)' }}>Rs. {(b.price || 0).toLocaleString()}</td>
                          <td style={{ padding: '5px 6px', textAlign: 'right', fontFamily: 'monospace', color: 'var(--orange-400)', fontWeight: 600 }}>Rs. {((b.crates || 0) * (b.price || 0)).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    {linked.length > 0 && (
                      <tfoot>
                        <tr style={{ borderTop: '2px solid var(--glass-border)', background: 'rgba(245,166,35,0.06)' }}>
                          <td style={{ padding: '5px 6px', color: 'var(--text-2)', fontWeight: 700 }}>Total</td>
                          <td style={{ padding: '5px 6px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{soldCr}</td>
                          <td style={{ padding: '5px 6px', textAlign: 'right', color: 'var(--text-3)', fontSize: 10 }}>avg Rs. {avgR.toLocaleString()}</td>
                          <td style={{ padding: '5px 6px', textAlign: 'right', fontFamily: 'monospace', color: 'var(--orange-400)', fontWeight: 700 }}>Rs. {salesVal.toLocaleString()}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </>
            );
          })()}
        </div>
      ))}
      <button className="btn btn-ghost btn-sm" style={{ width: '100%' }} onClick={addOwner}><Icon name="plus" size={12} /> Add Another Owner · مزید شخص</button>
      <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: 8 }}
        onClick={() => {
          const allDerived = owners.map(ow => {
            const l = buyers.filter(b => b.ownerId === ow.id && (b.crates || 0) > 0);
            const ts = l.reduce((s, b) => s + (b.crates || 0), 0);
            const tv = l.reduce((s, b) => s + (b.crates || 0) * (b.price || 0), 0);
            return { ...ow, rate: ts > 0 ? Math.round(tv / ts) : 0 };
          });
          printFullSupplierInvoice({ sup, owners: allDerived, derived, buyers, appliedAdvance });
        }}>
        <Icon name="print" size={12} /> Print Full Supplier Invoice · بیوپاری رسید
      </button>


      <div className="spacer" />
      <SectionHead num="19–22" en="Payment Recording" ur="ادائیگی" icon="money" />
      {payments.map((p, i) => (
        <div key={p.id} style={{ marginBottom: 10 }}>
          <div className="input-row-3">
            <Field en={i === 0 ? 'Payment Amount' : `Payment ${i + 1}`} ur="ادائیگی">
              <div className="input-prefix"><span className="pre">Rs.</span><input className="input num" type="number" value={p.amount || ''} onChange={e => updatePayment(p.id, 'amount', +e.target.value || 0)} placeholder="0" /></div>
            </Field>
            <Field en="Payment Date" ur="تاریخ ادائیگی">
              <input className="input" type="date" value={p.date} onChange={e => updatePayment(p.id, 'date', e.target.value)} />
            </Field>
            <Field en="Method" ur="صورت">
              <select className="select" value={p.method} onChange={e => updatePayment(p.id, 'method', e.target.value)}>
                <option value="Cash">💵 Cash · نقد</option>
                <option value="Credit">📋 Credit · ادھار</option>
                <option value="Bank">🏦 Bank</option>
              </select>
            </Field>
          </div>
        </div>
      ))}
      <button className="btn btn-ghost btn-sm" style={{ width: '100%' }} onClick={addPayment}><Icon name="plus" size={12} /> Add Another Payment</button>

      <div className="spacer" />
      <Field en="Remarks / Notes" ur="نوٹس">
        <textarea className="textarea" placeholder="Optional notes about this entry…" value={sup.remarks} onChange={e => set('remarks', e.target.value)} />
      </Field>
    </div>
  );
};

export const CustomerForm = ({ rates, setRates, buyers, setBuyers, derived, sup = {}, entryId = 'DRAFT', nextBillBase = 1, owners = [] }) => {
  const { entries } = useApp();
  const { custGross, wari, commission, custRemaining } = derived;

  const addBuyer = () => setBuyers(prev => [...prev, {
    id: crypto.randomUUID(), name: '', phone: '', date: TODAY,
    bill: `BL-${String(nextBillBase + prev.length).padStart(3, '0')}`,
    crates: 0, price: 0, discount: 0, advance: 0, type: 'Cash', ownerId: null,
  }]);
  const removeBuyer = id => setBuyers(prev => prev.filter(b => b.id !== id));
  const upd = (id, k, v) => setBuyers(prev => prev.map(b => b.id === id ? { ...b, [k]: v } : b));

  return (
    <div className="glass" style={{ padding: 24, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--navy-400)' }} />

      <div className="row" style={{ marginBottom: 18 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(91,125,224,0.15)', border: '1px solid rgba(91,125,224,0.3)', display: 'grid', placeItems: 'center', color: 'var(--navy-300)' }}>
          <Icon name="users" size={18} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="row" style={{ alignItems: 'baseline', gap: 8 }}>
            <h2 className="h2">Customers (OUT)</h2>
            <span className="ur" style={{ fontSize: 16 }}>خریداران</span>
          </div>
          <div className="small">Goods going out — {buyers.length} buyer{buyers.length !== 1 ? 's' : ''} this truck</div>
        </div>
        <span className="chip info">Side B</span>
      </div>

      <div className="glass-strong mini-summary-grid" style={{ padding: 14, marginBottom: 18 }}>
        <div>
          <div className="tiny">Gross / کل مال</div>
          <div className="num num-md">{fmt(custGross)}</div>
        </div>
        <div>
          <div className="tiny">+ Comm + Wari</div>
          <div className="num num-md" style={{ color: 'var(--success)' }}>+{fmt(commission + wari)}</div>
        </div>
        <div>
          <div className="tiny">Remaining / بقایہ</div>
          <div className="num num-md" style={{ color: 'var(--navy-300)' }}>{fmt(custRemaining)}</div>
        </div>
      </div>

      <SectionHead en="Auction Rate Settings" ur="ریٹ سیٹنگ" icon="settings" />
      <div className="input-row" style={{ marginBottom: 18 }}>
        <Field en="Wari /crate (Rs.)" ur="نگواری">
          <input className="input num" type="number" value={rates.logRate}
            onChange={e => setRates(prev => ({ ...prev, logRate: +e.target.value || 5 }))} />
        </Field>
        <Field en="Commission Divisor" ur="کمیشن تقسیم" hint="÷13.78 (auto)">
          <input className="input num" type="number" value={rates.commDiv}
            onChange={e => setRates(prev => ({ ...prev, commDiv: +e.target.value || 13.78 }))} />
        </Field>
      </div>

      <SectionHead num={buyers.length} en="Buyers / Auction Lots" ur="خریداران / نیلامی" icon="users" />

      {buyers.map((b, i) => {
        const bGross = (b.crates || 0) * (b.price || 0);
        const bWari  = (b.crates || 0) * rates.logRate;
        const bComm  = Math.round(bGross / (rates.commDiv || 13.78));
        const bNet   = bGross + bComm + bWari - (b.discount || 0) - (b.advance || 0);

        return (
          <div key={b.id} className="glass-strong" style={{ padding: 14, marginBottom: 10, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: 3, bottom: 0, background: 'var(--navy-400)', borderRadius: '0 0 0 0' }} />
            <div style={{ paddingLeft: 8 }}>

              <div className="row between" style={{ marginBottom: 10 }}>
                <div className="row gap-sm">
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(91,125,224,0.2)', display: 'grid', placeItems: 'center', color: 'var(--navy-300)', fontSize: 11, fontWeight: 700 }}>{i + 1}</div>
                  <strong style={{ fontSize: 12, color: 'var(--navy-300)' }}>
                    {b.name ? b.name : `Customer ${i + 1}`}
                  </strong>
                  {bNet > 0 && <span className="chip" style={{ fontSize: 10, padding: '2px 7px' }}>{fmt(bNet)} due</span>}
                  {bNet === 0 && bGross > 0 && <span className="chip success" style={{ fontSize: 10, padding: '2px 7px' }}>Cleared</span>}
                </div>
                <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }} title="Print customer invoice"
                  onClick={() => printBuyerInvoice({ buyer: b, sup, rates, entryId, prevBalance: computeBuyerPrevBalance(entries, b.name, entryId) })}>
                  <Icon name="print" size={11} />
                </button>
                {buyers.length > 1 && (
                  <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }} onClick={() => removeBuyer(b.id)}>
                    <Icon name="trash" size={11} />
                  </button>
                )}
              </div>

              {/* Supplier link */}
              <Field en="Supplier / Owner" ur="بیوپاری / مالک" req>
                <select className="select" value={b.ownerId ?? ''} onChange={e => upd(b.id, 'ownerId', e.target.value ? Number(e.target.value) : null)}>
                  <option value="">— Select Supplier —</option>
                  {owners.map((o, idx) => (
                    <option key={o.id} value={o.id}>
                      {o.name || `Owner ${idx + 1}`} ({(o.crates || 0).toLocaleString()} crates)
                    </option>
                  ))}
                </select>
              </Field>
              <div className="spacer-sm" />

              {/* Identity */}
              <div className="input-row" style={{ marginBottom: 10 }}>
                <Field en="Buyer Name" ur="نام خریدار" req>
                  <input className="input" placeholder="e.g. Ahmed Khan" value={b.name}
                    onChange={e => upd(b.id, 'name', e.target.value)} />
                </Field>
                <Field en="Phone" ur="فون نمبر">
                  <input className="input" placeholder="03XX-XXXXXXX" value={b.phone}
                    onChange={e => upd(b.id, 'phone', e.target.value)} />
                </Field>
              </div>

              {/* Date + Bill */}
              <div className="input-row" style={{ marginBottom: 10 }}>
                <Field en="Purchase Date" ur="تاریخ خریداری">
                  <input className="input" type="date" value={b.date}
                    onChange={e => upd(b.id, 'date', e.target.value)} />
                </Field>
                <Field en="Bill Number" ur="بل نمبر">
                  <input className="input mono" placeholder="BL-001" value={b.bill}
                    onChange={e => upd(b.id, 'bill', e.target.value)} />
                </Field>
              </div>

              {/* Crates · Price · Gross */}
              <div className="input-row-3" style={{ marginBottom: 10 }}>
                <Field en="Crates" ur="کریٹ" req>
                  <input className="input num" type="number" placeholder="0" value={b.crates || ''}
                    onChange={e => upd(b.id, 'crates', +e.target.value || 0)} />
                </Field>
                <Field en="Rate /crate" ur="فی کریٹ" req>
                  <div className="input-prefix"><span className="pre">Rs.</span>
                    <input className="input num" type="number" placeholder="0" value={b.price || ''}
                      onChange={e => upd(b.id, 'price', +e.target.value || 0)} />
                  </div>
                </Field>
                <Field en="Gross" ur="کل" hint="Auto">
                  <div className="input-prefix"><span className="pre">Rs.</span>
                    <input className="input num" value={bGross.toLocaleString()} readOnly
                      style={{ color: 'var(--navy-300)', fontWeight: 700 }} />
                  </div>
                </Field>
              </div>

              {/* Wari · Commission · Discount */}
              <div className="input-row-3" style={{ marginBottom: 10 }}>
                <Field en={`Wari (Rs.${rates.logRate}/cr)`} ur="نگواری" hint={`Auto · ${fmt(bWari)}`}>
                  <div className="input-prefix"><span className="pre">Rs.</span>
                    <input className="input num" value={bWari.toLocaleString()} readOnly />
                  </div>
                </Field>
                <Field en={`Comm (÷${rates.commDiv})`} ur="کمیشن" hint={`Auto · ${fmt(bComm)}`}>
                  <div className="input-prefix"><span className="pre">Rs.</span>
                    <input className="input num" value={bComm.toLocaleString()} readOnly />
                  </div>
                </Field>
                <Field en="Discount" ur="رعایت">
                  <div className="input-prefix"><span className="pre">Rs.</span>
                    <input className="input num" type="number" placeholder="0" value={b.discount || ''}
                      onChange={e => upd(b.id, 'discount', +e.target.value || 0)} />
                  </div>
                </Field>
              </div>

              {/* Advance · Type · Net Remaining */}
              <div className="input-row-3">
                <Field en="Advance Paid" ur="نقد ادائیگی">
                  <div className="input-prefix"><span className="pre">Rs.</span>
                    <input className="input num" type="number" placeholder="0" value={b.advance || ''}
                      onChange={e => upd(b.id, 'advance', +e.target.value || 0)} />
                  </div>
                </Field>
                <Field en="Type" ur="ادھار/نقد">
                  <select className="select" value={b.type} onChange={e => upd(b.id, 'type', e.target.value)}>
                    <option value="Cash">💵 Cash · نقد</option>
                    <option value="Credit">📋 Credit · ادھار</option>
                  </select>
                </Field>
                <Field en="Net Remaining" ur="بقایہ">
                  <div className="input-prefix"><span className="pre">Rs.</span>
                    <input className="input num" value={Math.abs(bNet).toLocaleString()} readOnly
                      style={{ color: bNet > 0 ? 'var(--navy-300)' : bNet < 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 700 }} />
                  </div>
                </Field>
              </div>

            </div>
          </div>
        );
      })}

      <button className="btn btn-ghost btn-sm" style={{ width: '100%' }} onClick={addBuyer}>
        <Icon name="plus" size={12} /> Add Another Customer · مزید خریدار
      </button>
      <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: 8 }}
        onClick={() => printAllCustomersInvoice({ sup, buyers, rates, derived, entryId })}>
        <Icon name="print" size={12} /> Print All Customer Invoices · خریداران کا خلاصہ
      </button>
    </div>
  );
};

export const BillRow = ({ label, ur, value, color, bold, negative, positive }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
    padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
  }}>
    <span style={{ fontSize: 12.5, color: bold ? 'var(--text-2)' : 'var(--text-3)', fontWeight: bold ? 600 : 400 }}>
      {label}{ur && <span className="ur" style={{ fontSize: 10.5, marginRight: 6, opacity: 0.65 }}> · {ur}</span>}
    </span>
    <span className="num" style={{
      fontSize: bold ? 14 : 12.5,
      fontWeight: bold ? 700 : 500,
      color: color || (bold ? 'var(--text-1)' : negative ? 'var(--danger)' : positive ? 'var(--success)' : 'var(--text-3)'),
    }}>
      {value}
    </span>
  </div>
);

export const LiveSummary = ({ supDerived, custDerived, sup, appliedAdvance = 0, cratesRemaining = 0, totalSupCrates = 0, avgCustRate = 0 }) => {
  const { gross, labour, laga, balance } = supDerived;
  const { custGross, commission, wari, custRemaining, custDiscount, custAdvancePaid } = custDerived;
  const agencyEarned = laga + labour + commission + wari;

  return (
    <div className="glass-strong" style={{ borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.03)' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Live Bill Summary <span className="ur" style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-3)' }}>بل کا خلاصہ</span></div>
        </div>
        <span className="chip success" style={{ fontSize: 11 }}><span className="live-dot" />Auto-calculated</span>
        {/* Agency earned pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 10 }}>
          <span style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600 }}>Agency Earned · ایجنسی آمدنی</span>
          <span className="num" style={{ fontSize: 15, fontWeight: 700, color: 'var(--success)' }}>{fmt(agencyEarned)}</span>
          <span className="tiny" style={{ color: 'var(--text-4)' }}>laga+labour+comm+wari</span>
        </div>
      </div>

      {/* Crate balance bar */}
      {totalSupCrates > 0 && (
        <div style={{ display: 'flex', gap: 24, padding: '8px 24px', borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)', fontSize: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-3)' }}>Crate Balance:</span>
          <span>In: <strong>{totalSupCrates}</strong></span>
          <span>Sold: <strong>{totalSupCrates - cratesRemaining}</strong></span>
          <span style={{ fontWeight: 700, color: cratesRemaining < 0 ? 'var(--danger)' : cratesRemaining === 0 ? 'var(--success)' : 'var(--orange-400)' }}>
            {cratesRemaining < 0 ? `⚠ Oversold by ${Math.abs(cratesRemaining)}` : cratesRemaining === 0 ? '✓ Fully allocated' : `${cratesRemaining} unallocated`}
          </span>
          {avgCustRate > 0 && <span style={{ marginLeft: 'auto', color: 'var(--text-3)' }}>Avg sale rate: <strong style={{ color: 'var(--text-1)' }}>Rs. {avgCustRate.toLocaleString()}/cr</strong></span>}
        </div>
      )}

      {/* Two-column body */}
      <div className="bill-summary-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>

        {/* Supplier Side A */}
        <div style={{ padding: '20px 24px', borderRight: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(245,166,35,0.15)', border: '1px solid rgba(255,167,38,0.3)', display: 'grid', placeItems: 'center', color: 'var(--orange-400)' }}>
              <Icon name="truck" size={13} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--orange-400)' }}>Supplier · بیوپاری</div>
              <div className="tiny">Side A — Goods In</div>
            </div>
            <span className="chip active" style={{ marginLeft: 'auto', fontSize: 10 }}>Side A</span>
          </div>

          <BillRow label="Truck Gross" ur="کل رقم" value={fmt(gross)} bold />
          <BillRow label="− Labour" ur="مزدوری" value={`−${fmt(labour)}`} negative />
          <BillRow label="− Laga" ur="لاگا" value={`−${fmt(laga)}`} negative />
          <BillRow label="− Truck Fare" ur="ٹرک کرایہ" value={`−${fmt(sup.fare || 0)}`} negative />
          {appliedAdvance > 0 && <BillRow label="− Advance (applied)" ur="بیانہ" value={`−${fmt(appliedAdvance)}`} negative />}

          <div style={{ height: 1, background: 'var(--glass-border-strong)', margin: '10px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Net Payable <span className="ur" style={{ textTransform: 'none' }}>بقایا</span></div>
              <div className="tiny" style={{ marginTop: 2 }}>Amount owed to supplier</div>
            </div>
            <div className="num" style={{ fontSize: 22, fontWeight: 700, color: balance >= 0 ? 'var(--orange-400)' : 'var(--danger)' }}>
              {balance < 0 && '−'}{fmt(Math.abs(balance))}
            </div>
          </div>
        </div>

        {/* Customer Side B */}
        <div style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(91,125,224,0.15)', border: '1px solid rgba(91,125,224,0.3)', display: 'grid', placeItems: 'center', color: 'var(--navy-300)' }}>
              <Icon name="users" size={13} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--navy-300)' }}>Customer · خریدار</div>
              <div className="tiny">Side B — Goods Out</div>
            </div>
            <span className="chip info" style={{ marginLeft: 'auto', fontSize: 10 }}>Side B</span>
          </div>

          <BillRow label="Customer Gross" ur="کل مال" value={fmt(custGross)} bold />
          <BillRow label="+ Commission" ur="کمیشن" value={`+${fmt(commission)}`} positive />
          <BillRow label="+ Wari" ur="نگواری" value={`+${fmt(wari)}`} positive />
          <BillRow label="− Discount" ur="رعایت" value={`−${fmt(custDiscount || 0)}`} negative />
          <BillRow label="− Advance Paid" ur="نقد ادائیگی" value={`−${fmt(custAdvancePaid || 0)}`} negative />

          <div style={{ height: 1, background: 'var(--glass-border-strong)', margin: '10px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Net Receivable <span className="ur" style={{ textTransform: 'none' }}>بقایہ</span></div>
              <div className="tiny" style={{ marginTop: 2 }}>Amount to collect from customer</div>
            </div>
            <div className="num" style={{ fontSize: 22, fontWeight: 700, color: custRemaining >= 0 ? 'var(--navy-300)' : 'var(--danger)' }}>
              {custRemaining < 0 && '−'}{fmt(Math.abs(custRemaining))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const NewEntryPage = () => {
  const { go, entries, setEntries, suppliers, setSuppliers, customers, setCustomers, advances, setAdvances } = useApp();
  const { confirm, dialog: confirmDialog } = useConfirm();

  const [sup, setSup] = useState({
    traderName: '', city: '', phone: '', bilty: '', vehicle: '', loadDate: TODAY,
    fare: 0, labourRate: 10, lagaRate: 20,
    remarks: '',
  });
  const [owners, setOwners] = useState([{ id: 1, name: '', crates: 0, rate: 0 }]);
  const [supPayments, setSupPayments] = useState([{ id: 1, amount: 0, date: TODAY, method: 'Cash' }]);

  const [rates, setRates] = useState({ logRate: 5, commDiv: 13.78 });
  const [buyers, setBuyers] = useState([{
    id: crypto.randomUUID(), name: '', phone: '', date: TODAY, bill: '',
    crates: 0, price: 0, discount: 0, advance: 0, type: 'Cash', ownerId: null,
  }]);

  const totalCrates = owners.reduce((s, o) => s + (o.crates || 0), 0);
  const gross = buyers.reduce((s, b) => s + (b.crates || 0) * (b.price || 0), 0);
  const labour = totalCrates * sup.labourRate;
  const laga = totalCrates * sup.lagaRate;
  const totalDed = labour + laga + (sup.fare || 0);
  const balance = gross - totalDed;
  const supDerived = { gross, labour, laga, totalDed, balance };

  const custGross = buyers.reduce((s, b) => s + (b.crates || 0) * (b.price || 0), 0);
  const wari = buyers.reduce((s, b) => s + (b.crates || 0) * rates.logRate, 0);
  const commission = buyers.reduce((s, b) => s + Math.round((b.crates || 0) * (b.price || 0) / (rates.commDiv || 13.78)), 0);
  const custDiscount = buyers.reduce((s, b) => s + (b.discount || 0), 0);
  const custAdvancePaid = buyers.reduce((s, b) => s + (b.advance || 0), 0);
  const custTotal = custGross + commission + wari - custDiscount;
  const custRemaining = custTotal - custAdvancePaid;
  const custDerived = { custGross, wari, commission, custTotal, custRemaining, custDiscount, custAdvancePaid };

  // Crate balance — supplier in vs customers out
  const totalCusCrates = buyers.reduce((s, b) => s + (b.crates || 0), 0);
  const cratesRemaining = totalCrates - totalCusCrates;
  const avgCustRate = totalCusCrates > 0 ? Math.round(custGross / totalCusCrates) : 0;

  // Next bill number — scan all existing entries for highest BL-xxx
  const nextBillBase = useMemo(() => {
    let max = 0;
    entries.forEach(e => {
      (e.buyerList || []).forEach(b => {
        if (b.bill) {
          const m = b.bill.match(/BL-?(\d+)/i);
          if (m) max = Math.max(max, parseInt(m[1]));
        }
      });
    });
    return max + 1;
  }, [entries]);

  // Draft persistence — save/restore form state in sessionStorage
  const billsInitRef = useRef(false);
  useEffect(() => {
    const draft = sessionStorage.getItem('mandi_new_entry_draft');
    if (draft) {
      try {
        const d = JSON.parse(draft);
        if (d.sup) setSup(d.sup);
        if (d.owners) setOwners(d.owners);
        if (d.supPayments) setSupPayments(d.supPayments);
        if (d.rates) setRates(d.rates);
        if (d.buyers) setBuyers(d.buyers);
      } catch {}
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem('mandi_new_entry_draft', JSON.stringify({ sup, owners, supPayments, rates, buyers }));
  }, [sup, owners, supPayments, rates, buyers]);

  // Auto-assign bill numbers to buyers with empty bills
  useEffect(() => {
    if (billsInitRef.current) return;
    setBuyers(prev => {
      if (prev.every(b => b.bill)) { billsInitRef.current = true; return prev; }
      let offset = 0;
      const next = prev.map(b => {
        if (!b.bill) {
          const bill = `BL-${String(nextBillBase + offset).padStart(3, '0')}`;
          offset++;
          return { ...b, bill };
        }
        return b;
      });
      billsInitRef.current = true;
      return next;
    });
  }, [nextBillBase]);

  // Advance detection — checks trader name AND every individual goods owner
  const advanceDetection = useMemo(() => {
    const results = [];
    const seen = new Set();

    const checkName = (name, isOwner, ownerId = null) => {
      const key = name.trim().toLowerCase();
      if (!key || seen.has(key)) return;
      seen.add(key);
      const matched = advances.filter(a => a.supplier.trim().toLowerCase() === key && (a.remaining || 0) > 0);
      if (matched.length > 0) {
        results.push({ name: name.trim(), advances: matched, total: matched.reduce((s, a) => s + (a.remaining || 0), 0), isOwner, ownerId });
      }
    };

    checkName(sup.traderName, false);
    owners.forEach(o => checkName(o.name, true, o.id));
    return results;
  }, [advances, sup.traderName, owners]);

  const totalActiveAdvance = advanceDetection.reduce((s, d) => s + d.total, 0);

  const nextId = `TRK-${String(entries.length + 1043).padStart(4, '0')}`;

  const getSupCode = () => {
    const existing = suppliers.find(s => s.name.toLowerCase() === sup.traderName.trim().toLowerCase());
    if (existing?.code) return existing.code;
    const max = suppliers.reduce((m, s) => {
      const n = s.code?.match(/S(\d+)/i);
      return n ? Math.max(m, parseInt(n[1])) : m;
    }, 0);
    return `S${String(max + 1).padStart(4, '0')}`;
  };

  let _newCusOffset = 0;
  const getCusCode = (name) => {
    const existing = customers.find(c => c.name.toLowerCase() === name.trim().toLowerCase());
    if (existing?.code) return existing.code;
    const max = customers.reduce((m, c) => {
      const n = c.code?.match(/C(\d+)/i);
      return n ? Math.max(m, parseInt(n[1])) : m;
    }, 0);
    _newCusOffset++;
    return `C${String(max + _newCusOffset).padStart(4, '0')}`;
  };

  const handleSave = () => {
    if (!sup.traderName.trim()) { alert('Trader Name is required.'); return; }
    if (!sup.vehicle.trim()) { alert('Vehicle Number is required.'); return; }

    const entryId = crypto.randomUUID();

    // Advance auto-apply — covers trader + all goods owners
    let appliedAdvance = 0;
    let newAdvancesState = advances;
    if (totalActiveAdvance > 0) {
      const lines = advanceDetection.map(d =>
        `• ${d.isOwner ? 'Owner' : 'Trader'} "${d.name}": Rs. ${d.total.toLocaleString()}`
      ).join('\n');
      const apply = window.confirm(
        `Active advances found:\n${lines}\n\nTotal: Rs. ${totalActiveAdvance.toLocaleString()}\n\nApply all to this entry? Outstanding balances will be reduced.`
      );
      if (apply) {
        appliedAdvance = Math.min(totalActiveAdvance, balance);
        const matchedKeys = new Set(advanceDetection.map(d => d.name.trim().toLowerCase()));
        let remaining = appliedAdvance;
        newAdvancesState = advances.map(a => {
          if (!matchedKeys.has(a.supplier.trim().toLowerCase()) || remaining <= 0) return a;
          const deduct = Math.min(a.remaining || 0, remaining);
          remaining -= deduct;
          return { ...a, used: (a.used || 0) + deduct, remaining: (a.remaining || 0) - deduct, appliedTo: [...(a.appliedTo || []), entryId] };
        });
      }
    }

    const finalBalance = balance - appliedAdvance;
    sessionStorage.removeItem('mandi_new_entry_draft');

    const supCode = getSupCode();
    _newCusOffset = 0;
    const buyerCodes = buyers.filter(b => b.name.trim()).reduce((acc, b) => {
      acc[b.id] = getCusCode(b.name);
      return acc;
    }, {});

    const entry = {
      id: entryId,
      entryNo: nextId,
      date: sup.loadDate || TODAY,
      supplier: sup.traderName.trim(),
      supplierCode: supCode,
      city: sup.city.trim(),
      phone: sup.phone.trim(),
      vehicle: sup.vehicle.trim(),
      bilty: sup.bilty.trim(),
      crates: totalCrates,
      rate: avgCustRate,
      gross,
      fare: sup.fare || 0,
      labour,
      laga,
      advance: appliedAdvance,
      labourRate: sup.labourRate,
      lagaRate: sup.lagaRate,
      logRate: rates.logRate,
      commDiv: rates.commDiv,
      balance: finalBalance,
      commission,
      wari,
      custRemaining,
      remarks: sup.remarks,
      status: (() => {
        const paid = supPayments.filter(p => p.amount > 0).reduce((s, p) => s + p.amount, 0);
        return paid >= finalBalance && finalBalance > 0 ? 'cleared' : paid > 0 ? 'partial' : 'pending';
      })(),
      customers: buyers.filter(b => b.name.trim()).length,
      ownerList: owners.map(o => {
        const lb = buyers.filter(b => b.ownerId === o.id);
        const ts = lb.reduce((s, b) => s + (b.crates || 0), 0);
        const tv = lb.reduce((s, b) => s + (b.crates || 0) * (b.price || 0), 0);
        return { name: o.name, crates: o.crates, rate: ts > 0 ? Math.round(tv / ts) : 0 };
      }),
      buyerList: buyers.map(b => {
        const ownerIdx = b.ownerId != null ? owners.findIndex(o => o.id === b.ownerId) : -1;
        return {
          id: b.id, date: b.date,
          name: b.name, phone: b.phone, crates: b.crates, price: b.price,
          discount: b.discount, advance: b.advance, type: b.type, bill: b.bill,
          ownerId: ownerIdx >= 0 ? ownerIdx + 1 : null,
          code: b.name.trim() ? buyerCodes[b.id] : undefined,
        };
      }),
      payments: supPayments.filter(p => p.amount > 0),
    };

    setEntries(prev => [entry, ...prev]);
    if (appliedAdvance > 0) setAdvances(newAdvancesState);

    setSuppliers(prev => {
      const key = sup.traderName.trim().toLowerCase();
      if (prev.find(s => s.name.toLowerCase() === key)) return prev;
      return [...prev, {
        id: crypto.randomUUID(),
        code: supCode,
        name: sup.traderName.trim(),
        city: sup.city.trim(),
        phone: sup.phone.trim(),
        status: 'active',
      }];
    });

    buyers.filter(b => b.name.trim()).forEach(b => {
      setCustomers(prev => {
        const key = b.name.trim().toLowerCase();
        if (prev.find(c => c.name.toLowerCase() === key)) return prev;
        return [...prev, {
          id: crypto.randomUUID(),
          code: buyerCodes[b.id],
          name: b.name.trim(),
          phone: b.phone.trim(),
          nickname: '',
          address: '',
        }];
      });
    });

    go('all-entries');
  };

  const handleDiscard = async () => {
    const ok = await confirm({
      title: 'Discard Entry',
      message: 'All unsaved data on this form will be lost.',
      confirmLabel: 'Discard',
      danger: false,
      icon: 'trash',
    });
    if (ok) {
      sessionStorage.removeItem('mandi_new_entry_draft');
      go('dashboard');
    }
  };

  return (
    <Page titleEn="New Entry" titleUr="نیا اندراج" sub="Record one truck — supplier in, customers out">
      <div className="row gap-sm" style={{ marginBottom: 16 }}>
        <span className="chip active"><Icon name="bolt" size={11} /> Draft</span>
        <span className="chip">{nextId}</span>
        <span className="chip">{new Date().toLocaleDateString('en-GB')}</span>
        <div style={{ flex: 1 }} />
        <button className="btn btn-ghost btn-sm" onClick={handleDiscard}><Icon name="trash" size={13} /> Discard</button>
        <button className="btn btn-primary btn-sm" onClick={handleSave}><Icon name="check" size={13} /> Save Entry</button>
      </div>

      {totalActiveAdvance > 0 && (
        <div style={{ padding: '12px 18px', marginBottom: 16, background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.35)', borderRadius: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: advanceDetection.length > 1 ? 8 : 0 }}>
            <Icon name="wallet" size={15} />
            <strong style={{ fontSize: 13, flex: 1 }}>Active Advances Found · پیشگی رقم</strong>
            <span className="chip warn" style={{ fontSize: 10 }}>Auto-deduct on save</span>
          </div>
          {advanceDetection.map(d => (
            <div key={d.name} className="small" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, paddingLeft: 24 }}>
              <span className={`chip ${d.isOwner ? '' : 'active'}`} style={{ fontSize: 10 }}>{d.isOwner ? 'Owner' : 'Trader'}</span>
              <strong>{d.name}</strong>
              <span style={{ color: 'var(--text-3)' }}>→</span>
              <span style={{ color: 'var(--orange-400)', fontWeight: 600 }}>Rs. {d.total.toLocaleString()}</span>
            </div>
          ))}
          {advanceDetection.length > 1 && (
            <div className="small" style={{ marginTop: 6, paddingLeft: 24, fontWeight: 600 }}>
              Total: Rs. {totalActiveAdvance.toLocaleString()}
            </div>
          )}
        </div>
      )}

      <div className="entry-form-grid">
        <SupplierForm sup={sup} setSup={setSup} owners={owners} setOwners={setOwners} payments={supPayments} setPayments={setSupPayments} derived={supDerived} buyers={buyers} rates={rates} entryId={nextId} appliedAdvance={0} ownerAdvances={advanceDetection} cratesRemaining={cratesRemaining} avgCustRate={avgCustRate} />
        <CustomerForm rates={rates} setRates={setRates} buyers={buyers} setBuyers={setBuyers} derived={custDerived} sup={sup} entryId={nextId} nextBillBase={nextBillBase} owners={owners} />
      </div>

      <div className="spacer-lg" />
      <LiveSummary supDerived={supDerived} custDerived={custDerived} sup={sup} appliedAdvance={0} cratesRemaining={cratesRemaining} totalSupCrates={totalCrates} avgCustRate={avgCustRate} />
      {confirmDialog}
    </Page>
  );
};
