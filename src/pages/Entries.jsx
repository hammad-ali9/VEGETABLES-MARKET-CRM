import { useState, useMemo, Fragment } from 'react';
import { Icon } from '../components/ui/Icon';
import { Page } from '../components/layout/Page';
import { fmt, fmtShort } from '../utils/format';
import { useApp } from '../context/AppContext';
import { SupplierForm, CustomerForm, LiveSummary, computeBuyerPrevBalance } from './NewEntry';
import { useConfirm } from '../components/ui/ConfirmDialog';

const TODAY = new Date().toISOString().split('T')[0];

// ─── Print utilities ────────────────────────────────────────────────────────

const URDU_INV_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Noto Nastaliq Urdu','Jameel Noori Nastaleeq','Traditional Arabic',sans-serif;direction:rtl;background:#f0f0f0;color:#111;padding:20px 16px;font-size:15px;line-height:2;}
  .inv{background:#fff;border:2px solid #1a237e;max-width:780px;margin:0 auto;box-shadow:0 4px 24px rgba(0,0,0,.18);}
  .inv img.hdr{width:100%;display:block;border-bottom:3px solid #c62828}
  .inv-title{background:#1a237e;color:#fff;text-align:center;padding:10px 16px;font-size:19px;font-weight:700;line-height:1.5;border-bottom:3px solid #c62828;}
  .inv-title small{display:block;font-size:12px;font-weight:400;opacity:.85;font-family:'Segoe UI',sans-serif;direction:ltr;margin-top:2px}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;border-bottom:2px solid #1a237e}
  .info-cell{padding:7px 14px;border-left:1px solid #dce0f0}
  .info-cell:nth-child(odd){border-left:none}
  .info-cell .lbl{font-size:11px;color:#666;display:block;margin-bottom:1px}
  .info-cell .val{font-size:15px;font-weight:700;color:#1a237e}
  .sec-head{background:#e8eaf6;color:#1a237e;padding:6px 16px;font-weight:700;font-size:14px;border-top:1px solid #c5cae9;border-bottom:1px solid #c5cae9;}
  .items-tbl{width:100%;border-collapse:collapse}
  .items-tbl th{background:#1a237e;color:#fff;padding:9px 12px;font-size:14px;font-weight:700;border:1px solid #1a237e;text-align:center;}
  .items-tbl td{padding:8px 12px;border:1px solid #d0d4e8;font-size:14px;text-align:center;vertical-align:middle;}
  .items-tbl td.name{text-align:right;font-weight:600}
  .items-tbl tbody tr:nth-child(even){background:#f8f9ff}
  .items-tbl tfoot td{background:#e8eaf6;font-weight:700;border-top:2px solid #1a237e;}
  .totals-wrap{display:flex;justify-content:flex-start;border-top:2px solid #1a237e}
  .totals-inner{width:55%;border-left:2px solid #1a237e}
  .t-row{display:flex;justify-content:space-between;padding:7px 14px;border-bottom:1px solid #e0e4f0;font-size:14px;}
  .t-row .lbl{color:#333}.t-row .amt{font-family:'Courier New',monospace;font-weight:700;color:#111}
  .t-row.ded .lbl{color:#c62828}.t-row.ded .amt{color:#c62828}
  .t-row.net{background:#1a237e;color:#fff;padding:11px 14px;font-size:16px;font-weight:700;}
  .t-row.net .amt{color:#ffd54f;font-size:17px}
  .sign-row{display:flex;justify-content:space-between;padding:18px 30px 10px;border-top:1px solid #dce0f0;font-size:13px;color:#555;}
  .sign-box{text-align:center;min-width:130px}
  .sign-line{border-top:1px solid #555;margin-top:28px;padding-top:4px}
  .inv-footer{border-top:2px solid #1a237e;background:#f5f7ff;padding:8px 16px;text-align:center;font-family:'Segoe UI',Arial,sans-serif;direction:ltr;font-size:11px;color:#444;}
  .inv-footer strong{color:#1a237e}.inv-footer a{color:#c62828;text-decoration:none}
  @media print{body{background:#fff;padding:0}.inv{border:none;box-shadow:none;max-width:none}}
`;

const CUSTOMER_INV_CSS = `
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',Arial,sans-serif;font-size:13px;color:#111;padding:28px;max-width:680px;margin:0 auto}
  .header{text-align:center;border-bottom:2px solid #111;padding-bottom:14px;margin-bottom:18px}
  .header h1{font-size:20px;font-weight:700}.header p{font-size:12px;color:#555;margin-top:4px}
  .meta{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:18px;font-size:12px}
  .meta-block{background:#f7f7f7;padding:10px;border-radius:6px}
  .meta-block strong{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#777;margin-bottom:4px}
  table{width:100%;border-collapse:collapse;margin-bottom:18px}
  th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#777;padding:7px 10px;border-bottom:2px solid #ddd}
  td{padding:7px 10px;border-bottom:1px solid #eee;vertical-align:middle}
  .num{font-family:monospace;font-weight:600}.right{text-align:right}
  .totals{border-top:2px solid #111;padding-top:12px;margin-top:4px}
  .totals .row{display:flex;justify-content:space-between;padding:4px 0;font-size:13px}
  .totals .final{font-size:16px;font-weight:700;border-top:1px solid #ddd;padding-top:8px;margin-top:4px}
  .neg{color:#c00}.pos{color:#060}.badge{display:inline-block;padding:2px 8px;border-radius:100px;font-size:11px;font-weight:600;background:#eee}
  .footer{text-align:center;font-size:11px;color:#999;margin-top:24px;border-top:1px solid #eee;padding-top:12px}
  @media print{body{padding:0}}
`;

const openPrintWindow = (title, body, css = URDU_INV_CSS, lang = 'ur', dir = 'rtl') => {
  const w = window.open('', '_blank', 'width=860,height=1050');
  w.document.write(`<!DOCTYPE html><html lang="${lang}" dir="${dir}"><head><meta charset="utf-8"><title>${title}</title><style>${css}</style></head><body>${body}</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 950);
};

const printSupplierInvoice = (entry) => {
  const fmtN = n => (n || 0).toLocaleString('en-PK');
  const urDate = d => new Date(d || new Date()).toLocaleDateString('ur-PK', { day: '2-digit', month: 'long', year: 'numeric' });
  const enDate = d => new Date(d || new Date()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const ic = (lbl, val) => `<div class="info-cell"><span class="lbl">${lbl}</span><span class="val">${val || '—'}</span></div>`;
  const tRow = (lbl, amt, cls = '') => `<div class="t-row ${cls}"><span class="lbl">${lbl}</span><span class="amt">Rs. ${fmtN(amt)}</span></div>`;
  const hdr = `<img class="hdr" src="${window.location.origin}/pdf-header.jpeg" alt="" onerror="this.style.display='none'">`;
  const footer = `<div class="inv-footer"><div><strong>Powered by Nexaura Technologies</strong> &nbsp;·&nbsp; <a>www.nexauratechs.com</a></div><div style="font-size:10px;color:#999;margin-top:2px">Print: ${enDate()} &nbsp;|&nbsp; پرنٹ: ${urDate()}</div></div>`;

  const ownerList = entry.ownerList || [];
  const buyerList = (entry.buyerList || []).filter(b => b.name?.trim());
  const net = entry.balance !== undefined
    ? entry.balance
    : (entry.gross||0)-(entry.labour||0)-(entry.laga||0)-(entry.fare||0)-(entry.advance||0);

  const totalOwnerCrates = ownerList.reduce((s, o) => s + (o.crates || 0), 0);

  const ownerTableRows = ownerList.map((o, idx) => `
    <tr>
      <td class="name">${idx + 1}. ${o.name || '—'}</td>
      <td>${fmtN(o.crates)}</td>
      <td>Rs. ${fmtN(o.rate)}</td>
      <td>Rs. ${fmtN((o.crates||0)*(o.rate||0))}</td>
    </tr>`).join('');

  const soldSections = ownerList.map((o, idx) => {
    const linked = buyerList.filter(b => b.ownerId === idx + 1);
    if (!linked.length) return '';
    const soldCr  = linked.reduce((s, b) => s + (b.crates || 0), 0);
    const salesVal = linked.reduce((s, b) => s + (b.crates||0)*(b.price||0), 0);
    const avgR    = soldCr > 0 ? Math.round(salesVal / soldCr) : 0;
    const rows    = linked.map((b, i) => `
      <tr>
        <td class="name">${b.name}</td>
        <td>${fmtN(b.crates)}</td>
        <td>Rs. ${fmtN(b.price)}</td>
        <td>Rs. ${fmtN((b.crates||0)*(b.price||0))}</td>
      </tr>`).join('');
    return `
      <div class="sec-head">${o.name || `مالک ${idx+1}`} — فروخت شدہ مال</div>
      <table class="items-tbl">
        <thead><tr><th>خریدار</th><th>کریٹ</th><th>ریٹ (فی کریٹ)</th><th>رقم</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr>
          <td class="name"><strong>کل</strong></td>
          <td><strong>${fmtN(soldCr)}</strong></td>
          <td>اوسط Rs. ${fmtN(avgR)}</td>
          <td><strong>Rs. ${fmtN(salesVal)}</strong></td>
        </tr></tfoot>
      </table>`;
  }).join('');

  openPrintWindow(`بیوپاری رسید — ${entry.supplier || ''}`, `<div class="inv">
    ${hdr}
    <div class="inv-title">بیوپاری رسید
      <small>Entry: ${entry.entryNo || entry.id || '—'} &nbsp;|&nbsp; Vehicle: ${entry.vehicle || '—'} &nbsp;|&nbsp; ${enDate(entry.date)}</small>
    </div>
    <div class="info-grid">
      ${ic('بیوپاری کا نام', entry.supplier)}
      ${ic('شہر / مقام', entry.city)}
      ${ic('فون نمبر', entry.phone)}
      ${ic('بلٹی نمبر', entry.bilty)}
      ${ic('گاڑی نمبر', entry.vehicle)}
      ${ic('تاریخ', urDate(entry.date))}
      ${ic('کل کریٹ', `${fmtN(entry.crates)} کریٹ`)}
      ${ic('کل مجموعی رقم', `Rs. ${fmtN(entry.gross)}`)}
    </div>
    ${ownerTableRows ? `
    <div class="sec-head">مالکان مال کی تفصیل</div>
    <table class="items-tbl">
      <thead><tr><th>مالک کا نام</th><th>کریٹ</th><th>اوسط ریٹ</th><th>رقم</th></tr></thead>
      <tbody>${ownerTableRows}</tbody>
      <tfoot><tr>
        <td class="name"><strong>کل</strong></td>
        <td><strong>${fmtN(totalOwnerCrates)}</strong></td>
        <td>—</td>
        <td><strong>Rs. ${fmtN(entry.gross)}</strong></td>
      </tr></tfoot>
    </table>` : ''}
    ${soldSections}
    <div class="sec-head">کٹوتیاں اور خالص ادائیگی</div>
    <div class="totals-wrap"><div class="totals-inner">
      ${tRow('مجموعی رقم', entry.gross)}
      ${tRow('(-) مزدوری', entry.labour, 'ded')}
      ${tRow('(-) لاگا', entry.laga, 'ded')}
      ${entry.fare  ? tRow('(-) ٹرک کرایہ', entry.fare, 'ded') : ''}
      ${entry.advance ? tRow('(-) پیشگی', entry.advance, 'ded') : ''}
      ${tRow('خالص ادائیگی', Math.abs(net), 'net')}
    </div></div>
    ${entry.remarks ? `<div style="border-top:1px dashed #aaa;padding:10px 16px;font-size:13px;color:#555;background:#fffde7"><strong>نوٹ:</strong> ${entry.remarks}</div>` : ''}
    <div class="sign-row">
      <div class="sign-box"><div class="sign-line">دستخط بیوپاری</div></div>
      <div class="sign-box"><div class="sign-line">مہر / دستخط منڈی</div></div>
    </div>
    ${footer}
  </div>`);
};

const printCustomerInvoice = (entry, buyer, prevBalance = 0) => {
  const bGross = (buyer.crates||0)*(buyer.price||0);
  const bWari  = buyer.wari !== undefined ? buyer.wari : (buyer.crates||0)*5;
  const bComm  = buyer.commission !== undefined ? buyer.commission : Math.round(bGross/13.78);
  const bThis  = bGross + bComm + bWari - (buyer.discount||0) - (buyer.advance||0);
  const bNet   = bThis + (prevBalance || 0);

  openPrintWindow(`Customer Invoice — ${entry.id} — ${buyer.name}`, `
    <div class="header"><h1>Customer Invoice · خریدار رسید</h1>
    <p>Entry: <strong>${entry.id}</strong> &nbsp;|&nbsp; Date: ${new Date(buyer.date||entry.date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</p></div>
    <div class="meta">
      <div class="meta-block"><strong>Buyer · خریدار</strong>${buyer.name}</div>
      <div class="meta-block"><strong>Phone · فون</strong>${buyer.phone||'—'}</div>
      <div class="meta-block"><strong>Bill No.</strong>${buyer.bill||'—'}</div>
      <div class="meta-block"><strong>Type</strong><span class="badge">${buyer.type||'—'}</span></div>
      <div class="meta-block"><strong>Supplier Truck</strong>${entry.supplier} · ${entry.vehicle}</div>
      <div class="meta-block"><strong>Crates</strong>${(buyer.crates||0).toLocaleString()}</div>
    </div>
    <table><thead><tr><th>Item</th><th class="right">Qty</th><th class="right">Rate</th><th class="right">Amount</th></tr></thead>
    <tbody>
      <tr><td>Goods (${entry.city||''})</td><td class="num right">${buyer.crates||0} crates</td><td class="num right">Rs. ${(buyer.price||0).toLocaleString()}/cr</td><td class="num right">Rs. ${bGross.toLocaleString()}</td></tr>
      ${buyer.discount ? `<tr><td>Discount · رعایت</td><td></td><td></td><td class="num right neg">− Rs. ${buyer.discount.toLocaleString()}</td></tr>` : ''}
      ${buyer.advance ? `<tr><td>Advance Paid</td><td></td><td></td><td class="num right neg">− Rs. ${buyer.advance.toLocaleString()}</td></tr>` : ''}
      ${prevBalance > 0 ? `<tr><td>Previous Balance · پچھلا بقایہ</td><td></td><td></td><td class="num right pos">+ Rs. ${prevBalance.toLocaleString()}</td></tr>` : ''}
    </tbody></table>
    <div class="totals"><div class="row final ${bNet<=0?'pos':''}"><span>Total Due · کل واجب الادا</span><span class="num">Rs. ${Math.abs(bNet).toLocaleString()}${bNet<=0?' (Cleared)':''}</span></div></div>
    <div class="footer">Mandi CRM · Printed on ${new Date().toLocaleDateString('en-GB')}</div>`, CUSTOMER_INV_CSS, 'en', 'ltr');
};

// ─── Inline Entry Editor ────────────────────────────────────────────────────

const EntryInlineEditor = ({ entry, onSave, onClose, onDelete }) => {
  const { confirm, dialog: confirmDialog } = useConfirm();
  const { entries } = useApp();
  const [sup, setSup] = useState({
    traderName: entry.supplier || '',
    city:       entry.city || '',
    phone:      entry.phone || '',
    bilty:      entry.bilty || '',
    vehicle:    entry.vehicle || '',
    loadDate:   entry.date || TODAY,
    fare:       entry.fare || 0,
    labourRate: entry.labourRate || (entry.crates > 0 ? Math.round((entry.labour||0) / entry.crates) : 10),
    lagaRate:   entry.lagaRate  || (entry.crates > 0 ? Math.round((entry.laga||0)   / entry.crates) : 10),
    remarks:    entry.remarks || '',
  });

  const appliedAdvance = entry.advance || 0;

  const [owners, setOwners] = useState(
    entry.ownerList?.length > 0
      ? entry.ownerList.map((o, i) => ({ id: i + 1, name: o.name || '', crates: o.crates || 0, rate: o.rate || 0 }))
      : [{ id: 1, name: entry.supplier || '', crates: entry.crates || 0, rate: entry.rate || 0 }]
  );

  const [supPayments, setSupPayments] = useState(
    entry.payments?.length > 0 ? entry.payments : [{ id: 1, amount: 0, date: TODAY, method: 'Cash' }]
  );

  const [rates, setRates] = useState({
    logRate: entry.logRate || 5,
    commDiv: entry.commDiv || 13.78,
  });

  const [buyers, setBuyers] = useState(
    entry.buyerList?.length > 0 && entry.ownerList
      ? entry.buyerList.map((b, i) => ({
          id: i + 1,
          name:     b.name || '',
          phone:    b.phone || '',
          date:     b.date || entry.date || TODAY,
          bill:     b.bill || '',
          crates:   b.crates || 0,
          price:    b.price || 0,
          discount: b.discount || 0,
          advance:  b.advance || 0,
          type:     b.type || 'Cash',
          ownerId:  b.ownerId ?? null,
        }))
      : [{ id: 1, name: '', phone: '', date: entry.date || TODAY, bill: '', crates: 0, price: 0, discount: 0, advance: 0, type: 'Cash', ownerId: null }]
  );

  const [status, setStatus] = useState(entry.status || 'pending');

  // Same derived calcs as NewEntry
  const totalCrates = owners.reduce((s, o) => s + (o.crates||0), 0);
  const gross   = owners.reduce((s, o) => s + (o.crates||0)*(o.rate||0), 0);
  const labour  = totalCrates * sup.labourRate;
  const laga    = totalCrates * sup.lagaRate;
  const totalDed = labour + laga + (sup.fare||0) + appliedAdvance;
  const balance  = gross - totalDed;
  const supDerived = { gross, labour, laga, totalDed, balance };

  const custGross      = buyers.reduce((s, b) => s + (b.crates||0)*(b.price||0), 0);
  const wari           = buyers.reduce((s, b) => s + (b.crates||0)*rates.logRate, 0);
  const commission     = buyers.reduce((s, b) => s + Math.round((b.crates||0)*(b.price||0)/(rates.commDiv||13.78)), 0);
  const custDiscount   = buyers.reduce((s, b) => s + (b.discount||0), 0);
  const custAdvancePaid= buyers.reduce((s, b) => s + (b.advance||0), 0);
  const custTotal      = custGross + commission + wari - custDiscount;
  const custRemaining  = custTotal - custAdvancePaid;
  const custDerived    = { custGross, wari, commission, custTotal, custRemaining, custDiscount, custAdvancePaid };

  const handleSave = () => {
    const updated = {
      ...entry,
      date:     sup.loadDate || entry.date,
      supplier: sup.traderName.trim(),
      city:     sup.city.trim(),
      phone:    sup.phone.trim(),
      vehicle:  sup.vehicle.trim(),
      bilty:    sup.bilty.trim(),
      crates:   totalCrates,
      rate:     owners[0]?.rate || 0,
      gross, fare: sup.fare||0, labour, laga,
      labourRate: sup.labourRate,
      lagaRate:   sup.lagaRate,
      logRate:    rates.logRate,
      commDiv:    rates.commDiv,
      advance: appliedAdvance,
      balance, commission, wari, custRemaining,
      remarks: sup.remarks,
      status: (() => {
        const paid = supPayments.filter(p => p.amount > 0).reduce((s, p) => s + p.amount, 0);
        if (paid >= balance && balance > 0) return 'cleared';
        if (paid > 0) return 'partial';
        return status; // keep manual if no payments recorded
      })(),
      customers: buyers.filter(b => b.name.trim()).length,
      ownerList: owners.map(o => {
        const lb = buyers.filter(b => b.ownerId === o.id);
        const ts = lb.reduce((s, b) => s + (b.crates || 0), 0);
        const tv = lb.reduce((s, b) => s + (b.crates || 0) * (b.price || 0), 0);
        return { name: o.name, crates: o.crates, rate: ts > 0 ? Math.round(tv / ts) : o.rate };
      }),
      buyerList: buyers.map(b => {
        const ownerIdx = b.ownerId != null ? owners.findIndex(o => o.id === b.ownerId) : -1;
        return {
          name: b.name, phone: b.phone, crates: b.crates, price: b.price,
          discount: b.discount, advance: b.advance, type: b.type, bill: b.bill,
          ownerId: ownerIdx >= 0 ? ownerIdx + 1 : b.ownerId,
        };
      }),
      payments: supPayments.filter(p => p.amount > 0),
    };
    onSave(updated);
  };

  return (
    <div style={{ padding: 24, background: 'var(--bg-app-2)', borderTop: '3px solid var(--orange-500)' }}>

      {/* Action bar */}
      <div className="row gap-sm" style={{ marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="row gap-sm">
          <span className="chip active"><Icon name="bolt" size={11} /> {entry.id}</span>
          <span className="small" style={{ color: 'var(--text-3)' }}>Editing</span>
        </div>

        <div className="row gap-sm" style={{ marginLeft: 8, alignItems: 'center' }}>
          <span className="small" style={{ color: 'var(--text-3)' }}>Supplier Payment:</span>
          <select className="select" value={status} onChange={e => setStatus(e.target.value)}
            style={{ padding: '6px 10px', fontSize: 12, borderRadius: 8, width: 'auto' }}>
            <option value="pending">⏳ Pending — not paid yet</option>
            <option value="partial">🔶 Partial — some paid, balance due</option>
            <option value="cleared">✅ Cleared — fully paid</option>
          </select>
          <span className="tiny" style={{ color: 'var(--text-4)' }}>Auto-updates from payments</span>
        </div>

        <div className="row gap-sm" style={{ marginLeft: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => printSupplierInvoice({
            ...entry,
            ownerList: owners.map(o => {
              const lb = buyers.filter(b => b.ownerId === o.id);
              const ts = lb.reduce((s, b) => s + (b.crates || 0), 0);
              const tv = lb.reduce((s, b) => s + (b.crates || 0) * (b.price || 0), 0);
              return { name: o.name, crates: o.crates, rate: ts > 0 ? Math.round(tv / ts) : o.rate };
            }),
            buyerList: buyers.map(b => {
              const ownerIdx = b.ownerId != null ? owners.findIndex(o => o.id === b.ownerId) : -1;
              return { ...b, ownerId: ownerIdx >= 0 ? ownerIdx + 1 : b.ownerId };
            }),
            gross, labour, laga, balance,
            fare: sup.fare || 0, advance: appliedAdvance,
            supplier: sup.traderName, vehicle: sup.vehicle, city: sup.city, remarks: sup.remarks,
          })}>
            <Icon name="print" size={12} /> Supplier Invoice
          </button>
        </div>

        <div style={{ flex: 1 }} />

        <button className="btn btn-danger btn-sm" onClick={async () => {
          const ok = await confirm({
            title: 'Delete Entry',
            message: 'This truck record and all its customer sales will be permanently deleted.',
            detail: `${entry.supplier} · ${entry.vehicle} · ${new Date(entry.date).toLocaleDateString('en-GB')}`,
            confirmLabel: 'Delete Entry',
          });
          if (ok) { onDelete(entry.id); onClose(); }
        }}>
          <Icon name="trash" size={13} />
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary btn-sm" onClick={handleSave}>
          <Icon name="check" size={13} /> Save Changes
        </button>
      </div>

      {/* Same two-column form as New Entry */}
      <div className="entry-form-grid">
        <SupplierForm
          sup={sup} setSup={setSup}
          owners={owners} setOwners={setOwners}
          payments={supPayments} setPayments={setSupPayments}
          derived={supDerived}
          buyers={buyers} rates={rates} entryId={entry.id}
          appliedAdvance={appliedAdvance}
        />
        <CustomerForm
          rates={rates} setRates={setRates}
          buyers={buyers} setBuyers={setBuyers}
          derived={custDerived}
          sup={sup} entryId={entry.id}
          owners={owners}
        />
      </div>

      {/* Customer print buttons */}
      {buyers.filter(b => b.name.trim()).length > 0 && (
        <div className="row gap-sm" style={{ marginTop: 16, flexWrap: 'wrap' }}>
          <span className="small" style={{ color: 'var(--text-3)' }}>Print customer invoices:</span>
          {buyers.filter(b => b.name.trim()).map((b, i) => (
            <button key={i} className="btn btn-ghost btn-sm" onClick={() => printCustomerInvoice(
              { ...entry, supplier: sup.traderName, vehicle: sup.vehicle, city: sup.city },
              { ...b, wari: (b.crates||0)*rates.logRate, commission: Math.round((b.crates||0)*(b.price||0)/(rates.commDiv||13.78)) },
              computeBuyerPrevBalance(entries, b.name, entry.id)
            )}>
              <Icon name="print" size={12} /> {b.name}
            </button>
          ))}
        </div>
      )}

      <div style={{ height: 24 }} />

      {/* Live Bill Summary */}
      <LiveSummary supDerived={supDerived} custDerived={custDerived} sup={sup} appliedAdvance={appliedAdvance} />

      {/* Bottom action bar repeat */}
      <div className="row gap-sm" style={{ marginTop: 20, justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave}>
          <Icon name="check" size={14} /> Save Changes · محفوظ کریں
        </button>
      </div>

      {confirmDialog}
    </div>
  );
};

// ─── All Entries Page ────────────────────────────────────────────────────────

export const AllEntriesPage = () => {
  const { go, entries, setEntries } = useApp();
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchQ, setSearchQ] = useState('');

  const filtered = entries.filter(e => {
    const matchStatus = filter === 'all' || e.status === filter;
    const q = searchQ.toLowerCase();
    const matchSearch = !q ||
      (e.id||'').toLowerCase().includes(q) ||
      (e.supplier||'').toLowerCase().includes(q) ||
      (e.vehicle||'').toLowerCase().includes(q) ||
      (e.bilty||'').toLowerCase().includes(q) ||
      (e.city||'').toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const handleSaveEdit = updated => {
    setEntries(prev => prev.map(e => e.id === updated.id ? updated : e));
    setExpandedId(null);
  };

  const handleDelete = id => {
    setEntries(prev => prev.filter(e => e.id !== id));
    setExpandedId(null);
  };

  const toggleRow = id => setExpandedId(prev => prev === id ? null : id);

  return (
    <Page titleEn="All Entries" titleUr="تمام اندراجات" sub={`${entries.length} total records`}>
      <div className="row gap-sm" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        {['all', 'cleared', 'partial', 'pending'].map(f => (
          <span key={f} className={`filter-pill ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All · کل' : f === 'cleared' ? 'Cleared · کلیئر' : f === 'partial' ? 'Partial · جزوی' : 'Pending · باقی'}
          </span>
        ))}
        <div style={{ flex: 1 }} />
        <div className="tb-search" style={{ width: 260 }}>
          <Icon name="search" size={14} />
          <input placeholder="Bilty, vehicle, name…" value={searchQ} onChange={e => setSearchQ(e.target.value)} />
          {searchQ && <span style={{ cursor: 'pointer', fontSize: 14, opacity: 0.5 }} onClick={() => setSearchQ('')}>✕</span>}
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => go('new-entry')}><Icon name="plus" size={13} /> New Entry</button>
      </div>

      <div className="glass" style={{ padding: 0 }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-3)' }}>
            <Icon name="list" size={28} />
            <div style={{ marginTop: 12, fontSize: 14, color: 'var(--text-2)' }}>
              {entries.length === 0 ? 'No entries yet. Add your first truck entry.' : 'No entries match this filter.'}
            </div>
            {entries.length === 0 && (
              <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={() => go('new-entry')}>
                <Icon name="plus" size={13} /> Add First Entry
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th></th>
                  <th>Bilty <span className="ur">بلٹی</span></th>
                  <th>Date <span className="ur">تاریخ</span></th>
                  <th>Vehicle <span className="ur">گاڑی</span></th>
                  <th>Supplier <span className="ur">بیوپاری</span></th>
                  <th>City <span className="ur">شہر</span></th>
                  <th>Crates <span className="ur">کریٹ</span></th>
                  <th>Gross <span className="ur">کل رقم</span></th>
                  <th>Buyers</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <Fragment key={r.id}>
                    <tr
                      onClick={() => toggleRow(r.id)}
                      style={{
                        background: expandedId === r.id ? 'rgba(245,166,35,0.07)' : '',
                        borderLeft: expandedId === r.id ? '3px solid var(--orange-500)' : '3px solid transparent',
                        cursor: 'pointer',
                      }}
                    >
                      <td style={{ width: 28, paddingRight: 0, color: 'var(--text-4)', fontSize: 11 }}>
                        {expandedId === r.id ? '▲' : '▼'}
                      </td>
                      <td className="mono" style={{ color: 'var(--orange-400)', fontWeight: 600 }}>{r.id}</td>
                      <td>{new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</td>
                      <td className="mono small">{r.vehicle}</td>
                      <td style={{ fontWeight: 600 }}>{r.supplier}</td>
                      <td className="small">{r.city}</td>
                      <td className="num">{r.crates}</td>
                      <td className="num">{fmt(r.gross)}</td>
                      <td className="small" style={{ color: 'var(--text-3)' }}>{r.customers || 0} buyer{r.customers !== 1 ? 's' : ''}</td>
                      <td>
                        <span className={`chip ${r.status === 'cleared' ? 'success' : r.status === 'partial' ? 'warn' : 'danger'}`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>

                    {expandedId === r.id && (
                      <tr>
                        <td colSpan={10} style={{ padding: 0, border: 'none' }}>
                          <EntryInlineEditor
                            entry={r}
                            onSave={handleSaveEdit}
                            onClose={() => setExpandedId(null)}
                            onDelete={handleDelete}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filtered.length > 0 && (
          <div className="row between" style={{ padding: '14px 18px', borderTop: '1px solid var(--glass-border)' }}>
            <span className="small">Showing {filtered.length} of {entries.length}</span>
            {expandedId && <span className="small" style={{ color: 'var(--orange-400)' }}>Editing {expandedId} — click row again to collapse</span>}
          </div>
        )}
      </div>
    </Page>
  );
};

// ─── Ledger Page ─────────────────────────────────────────────────────────────

const KPI = ({ label, ur, v, accent }) => (
  <div className="glass-strong" style={{ padding: 14 }}>
    <div className="row between" style={{ alignItems: 'baseline' }}>
      <span className="small" style={{ fontWeight: 600, color: 'var(--text-2)' }}>{label}</span>
      <span className="ur small">{ur}</span>
    </div>
    <div className="num num-lg" style={{ marginTop: 4, color: accent || 'var(--text-1)' }}>{v}</div>
  </div>
);

export const LedgerPage = () => {
  const { entries } = useApp();
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('supplier');
  const [selected, setSelected] = useState(null);

  // Build combined trader + goods-owner list from all entries
  const allTraders = useMemo(() => {
    const map = {};
    entries.forEach(e => {
      const tName = (e.supplier || '').trim();
      if (tName) {
        const key = tName.toLowerCase();
        if (!map[key]) map[key] = { id: key, name: tName, city: e.city || '', phone: e.phone || '', entries: [], isTruckTrader: true, isGoodsOwner: false };
        if (!map[key].entries.find(en => en.id === e.id)) map[key].entries.push(e);
      }
      (e.ownerList || []).forEach(o => {
        const oName = (o.name || '').trim();
        if (!oName) return;
        const key = oName.toLowerCase();
        if (!map[key]) map[key] = { id: key, name: oName, city: e.city || '', phone: '', entries: [], isTruckTrader: false, isGoodsOwner: true };
        map[key].isGoodsOwner = true;
        if (!map[key].entries.find(en => en.id === e.id)) map[key].entries.push(e);
      });
    });
    return Object.values(map).sort((a, b) => b.entries.length - a.entries.length);
  }, [entries]);

  // Build customer list from buyerList across all entries
  const allCustomers = useMemo(() => {
    const map = {};
    entries.forEach(e => {
      (e.buyerList || []).forEach(b => {
        const bName = (b.name || '').trim();
        if (!bName) return;
        const key = bName.toLowerCase();
        if (!map[key]) map[key] = { id: key, name: bName, phone: b.phone || '', entries: [] };
        else if (b.phone && !map[key].phone) map[key].phone = b.phone;
        if (!map[key].entries.find(en => en.id === e.id)) map[key].entries.push(e);
      });
    });
    return Object.values(map).sort((a, b) => b.entries.length - a.entries.length);
  }, [entries]);

  const list = tab === 'supplier' ? allTraders : allCustomers;
  const filtered = list.filter(s =>
    !q || (s.name || '').toLowerCase().includes(q.toLowerCase())
  );

  const getOwnerSlice = (e) => {
    if (!selected) return null;
    const key = selected.name.toLowerCase();
    return (e.ownerList || []).find(o => (o.name || '').toLowerCase() === key) || null;
  };

  const getBuyerSlice = (e) => {
    if (!selected) return null;
    const key = selected.name.toLowerCase();
    return (e.buyerList || []).find(b => (b.name || '').toLowerCase() === key) || null;
  };

  const selectedEntries = useMemo(() => selected?.entries || [], [selected]);

  // Supplier KPIs — per-owner slice
  const { selGross, selBalance } = useMemo(() => {
    if (tab !== 'supplier') return { selGross: 0, selBalance: 0 };
    let g = 0, b = 0;
    selectedEntries.forEach(e => {
      const slice = getOwnerSlice(e);
      if (slice) {
        const totalCr = (e.ownerList || []).reduce((s, o) => s + (o.crates || 0), 0) || e.crates || 1;
        const share = (slice.crates || 0) / totalCr;
        const oGross = (slice.crates || 0) * (slice.rate || 0);
        const oBal = oGross - Math.round((e.labour || 0) * share) - Math.round((e.laga || 0) * share) - Math.round((e.fare || 0) * share) - Math.round((e.advance || 0) * share);
        g += oGross; b += oBal;
      } else {
        g += e.gross || 0;
        b += e.balance !== undefined ? e.balance : (e.gross || 0) - (e.fare || 0) - (e.labour || 0) - (e.laga || 0);
      }
    });
    return { selGross: g, selBalance: b };
  }, [selectedEntries, selected, tab]);

  // Customer KPIs
  const { custTotalPurchased, custTotalDue } = useMemo(() => {
    if (tab !== 'customer') return { custTotalPurchased: 0, custTotalDue: 0 };
    let purchased = 0, due = 0;
    selectedEntries.forEach(e => {
      const b = getBuyerSlice(e);
      if (!b) return;
      const bGross = (b.crates || 0) * (b.price || 0);
      const bWari  = b.wari  !== undefined ? b.wari  : (b.crates || 0) * (e.logRate || 5);
      const bComm  = b.commission !== undefined ? b.commission : Math.round(bGross / (e.commDiv || 13.78));
      const bNet   = bGross + bComm + bWari - (b.discount || 0) - (b.advance || 0);
      purchased += bGross;
      due += Math.max(0, bNet);
    });
    return { custTotalPurchased: purchased, custTotalDue: due };
  }, [selectedEntries, selected, tab]);

  return (
    <Page titleEn="Ledger Search" titleUr="کھاتہ تلاش" sub="Traders, goods owners, and customers — full history">
      <div className="glass" style={{ padding: 24, marginBottom: 16 }}>
        <div className="row gap-sm" style={{ flexWrap: 'wrap' }}>
          <div className="tabs">
            <div className={`tab ${tab === 'supplier' ? 'active' : ''}`} onClick={() => { setTab('supplier'); setSelected(null); setQ(''); }}>
              Suppliers &amp; Owners · بیوپاری
            </div>
            <div className={`tab ${tab === 'customer' ? 'active' : ''}`} onClick={() => { setTab('customer'); setSelected(null); setQ(''); }}>
              Customers · گاہک
            </div>
          </div>
          <div className="tb-search" style={{ flex: 1, width: 'auto' }}>
            <Icon name="search" size={16} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name or city…" />
            {q && <span style={{ cursor: 'pointer', opacity: 0.5 }} onClick={() => setQ('')}>✕</span>}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }} className="ledger-grid">
        {/* Left list */}
        <div className="glass" style={{ padding: 0, height: 'fit-content' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--glass-border)' }}>
            <strong style={{ fontSize: 12, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {tab === 'supplier' ? 'Suppliers & Owners' : 'Customers'} · {filtered.length}
            </strong>
          </div>
          {filtered.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              {list.length === 0 ? 'Add entries to populate.' : 'No results.'}
            </div>
          ) : (
            filtered.map((s, i) => (
              <div key={s.id}
                style={{ padding: '12px 14px', borderBottom: i < filtered.length - 1 ? '1px solid var(--glass-border)' : 'none', cursor: 'pointer', background: selected?.id === s.id ? 'rgba(245,166,35,0.06)' : 'transparent' }}
                onClick={() => setSelected(s)}
              >
                <div className="row">
                  <div className={`av ${selected?.id === s.id ? 'orange' : ''}`}>{s.name?.[0] || '?'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                    <div className="small">{s.city || '—'}</div>
                  </div>
                </div>
                <div className="row gap-sm" style={{ marginTop: 6, paddingLeft: 40 }}>
                  {tab === 'supplier' && s.isTruckTrader && <span className="chip" style={{ fontSize: 9 }}>Trader</span>}
                  {tab === 'supplier' && s.isGoodsOwner && <span className="chip active" style={{ fontSize: 9 }}>Goods Owner</span>}
                  <span className="tiny" style={{ color: 'var(--text-4)', marginLeft: 'auto' }}>{s.entries?.length || 0} entr{s.entries?.length !== 1 ? 'ies' : 'y'}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right detail */}
        {selected ? (
          <div>
            <div className="glass" style={{ padding: 24, marginBottom: 16 }}>
              <div className="row between" style={{ marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <div className="row">
                  <div className="av orange" style={{ width: 48, height: 48, fontSize: 18 }}>{selected.name?.[0]}</div>
                  <div>
                    <h2 className="h2">{selected.name}</h2>
                    <div className="small">
                      {selected.city || '—'}{selected.phone ? ` · ${selected.phone}` : ''}
                      {' · '}{selectedEntries.length} entr{selectedEntries.length !== 1 ? 'ies' : 'y'}
                    </div>
                    {tab === 'supplier' && (
                      <div className="row gap-sm" style={{ marginTop: 4 }}>
                        {selected.isTruckTrader && <span className="chip" style={{ fontSize: 10 }}>Truck Trader</span>}
                        {selected.isGoodsOwner && <span className="chip active" style={{ fontSize: 10 }}>Goods Owner</span>}
                      </div>
                    )}
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => window.print()}><Icon name="print" size={13} /> Print Ledger</button>
              </div>
              {tab === 'supplier' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                  <KPI label="Total Gross" ur="کل رقم" v={fmtShort(selGross)} />
                  <KPI label="Entries" ur="اندراجات" v={selectedEntries.length} />
                  <KPI label="Net Payable" ur="بقایا" v={fmtShort(Math.abs(selBalance))} accent="var(--orange-400)" />
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                  <KPI label="Total Purchased" ur="کل خریداری" v={fmtShort(custTotalPurchased)} />
                  <KPI label="Purchases" ur="اندراجات" v={selectedEntries.length} />
                  <KPI label="Total Due" ur="بقایہ" v={fmtShort(custTotalDue)} accent={custTotalDue > 0 ? 'var(--danger)' : 'var(--success)'} />
                </div>
              )}
            </div>

            {tab === 'supplier' && (
              <div className="glass" style={{ padding: 0 }}>
                <div className="row between" style={{ padding: '14px 18px', borderBottom: '1px solid var(--glass-border)' }}>
                  <strong>Entry History · ٹرک تاریخ</strong>
                  <span className="small">{selectedEntries.length} entries</span>
                </div>
                {selectedEntries.length === 0 ? (
                  <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>No entries found.</div>
                ) : (
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Bilty</th><th>Date</th><th>Vehicle</th>
                          <th>Crates</th><th>Rate</th><th>Gross</th>
                          <th>Net Payable</th><th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedEntries.map((r, i) => {
                          const slice = getOwnerSlice(r);
                          const totalCr = (r.ownerList || []).reduce((s, o) => s + (o.crates || 0), 0) || r.crates || 1;
                          const share = slice ? (slice.crates || 0) / totalCr : 1;
                          const oGross = slice ? (slice.crates || 0) * (slice.rate || 0) : r.gross;
                          const oBal = slice
                            ? oGross - Math.round((r.labour||0)*share) - Math.round((r.laga||0)*share) - Math.round((r.fare||0)*share) - Math.round((r.advance||0)*share)
                            : (r.balance !== undefined ? r.balance : r.gross - (r.fare||0) - (r.labour||0) - (r.laga||0));
                          return (
                            <tr key={i}>
                              <td className="mono" style={{ color: 'var(--orange-400)', fontWeight: 600 }}>{r.id}</td>
                              <td>{new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}</td>
                              <td className="mono small">{r.vehicle}</td>
                              <td className="num">{slice ? slice.crates : r.crates}</td>
                              <td className="num small">{slice ? `Rs.${slice.rate}/cr` : '—'}</td>
                              <td className="num">{fmt(oGross)}</td>
                              <td className="num" style={{ color: 'var(--success)' }}>{fmt(Math.max(0, oBal))}</td>
                              <td><span className={`chip ${r.status === 'cleared' ? 'success' : r.status === 'partial' ? 'warn' : 'danger'}`}>{r.status}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {tab === 'customer' && (
              <div className="glass" style={{ padding: 0 }}>
                <div className="row between" style={{ padding: '14px 18px', borderBottom: '1px solid var(--glass-border)' }}>
                  <strong>Purchase History · خریداری تاریخ</strong>
                  <span className="small">{selectedEntries.length} entr{selectedEntries.length !== 1 ? 'ies' : 'y'}</span>
                </div>
                {selectedEntries.length === 0 ? (
                  <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>No purchases found.</div>
                ) : (
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Bilty</th><th>Date</th><th>Supplier · Vehicle</th>
                          <th>Crates</th><th>Rate</th><th>Gross</th>
                          <th>Comm+Wari</th><th>Discount</th><th>Net Due</th><th>Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedEntries.map((e, i) => {
                          const b = getBuyerSlice(e);
                          if (!b) return null;
                          const bGross = (b.crates || 0) * (b.price || 0);
                          const bWari  = b.wari !== undefined ? b.wari : (b.crates || 0) * (e.logRate || 5);
                          const bComm  = b.commission !== undefined ? b.commission : Math.round(bGross / (e.commDiv || 13.78));
                          const bNet   = bGross + bComm + bWari - (b.discount || 0) - (b.advance || 0);
                          return (
                            <tr key={i}>
                              <td className="mono" style={{ color: 'var(--orange-400)', fontWeight: 600 }}>{e.id}</td>
                              <td>{new Date(b.date || e.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}</td>
                              <td>
                                <div style={{ fontWeight: 600, fontSize: 12 }}>{e.supplier}</div>
                                <div className="mono tiny">{e.vehicle}</div>
                              </td>
                              <td className="num">{b.crates || 0}</td>
                              <td className="num small">Rs.{(b.price || 0).toLocaleString()}/cr</td>
                              <td className="num">{fmt(bGross)}</td>
                              <td className="num" style={{ color: 'var(--success)' }}>+{fmt(bComm + bWari)}</td>
                              <td className="num" style={{ color: 'var(--text-3)' }}>{b.discount ? `−${fmt(b.discount)}` : '—'}</td>
                              <td className="num" style={{ fontWeight: 700, color: bNet > 0 ? 'var(--danger)' : 'var(--success)' }}>
                                {fmt(Math.abs(bNet))}{bNet <= 0 ? ' ✓' : ''}
                              </td>
                              <td><span className={`chip ${b.type === 'Cash' ? 'success' : 'warn'}`} style={{ fontSize: 10 }}>{b.type || 'Cash'}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="glass" style={{ padding: 48, textAlign: 'center', color: 'var(--text-3)' }}>
            <Icon name="search" size={28} />
            <div style={{ marginTop: 12, fontSize: 14 }}>Select a {tab === 'supplier' ? 'supplier or owner' : 'customer'} to view history</div>
          </div>
        )}
      </div>
    </Page>
  );
};
