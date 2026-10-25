import { useState } from 'react';
import { F, cname, find, mins, useToday, nowTime, today, monthsBetween, uid, Overlay } from '../ui.jsx';

function Receipt({ db, r, by, onClose }) {
  const s = db.settings; const x = db.students.find((y) => y.id === r.sid) || {};
  return (
    <Overlay>
      <style>{'@page{size:A5 portrait;margin:6mm}'}</style>
      <div className="wrapc">
        <div className="rcpt">
          <h3>{s.school}</h3><p>{s.address} {s.phone}</p><h2>PAYMENT RECEIPT</h2><hr />
          <p>No: {r.no}</p><p>Date: {r.date} {r.time}</p>
          <p>Student: {x.name} ({x.id})</p><p>Class: {cname(db, x.classId)}</p>
          <p>Month paid: {r.month}</p><p><b>Amount: {r.amount} {s.currency}</b></p><hr />
          <p>Received by: {by}</p><p>Signature: ____________</p>
        </div>
        <div className="no-print bar"><button className="btn" onClick={() => window.print()}>Print receipt</button> <button className="btn gray" onClick={onClose}>Close</button></div>
      </div>
    </Overlay>
  );
}

const EXP = ['Rent', 'Electricity / Water', 'Supplies', 'Maintenance', 'Transport', 'Other'];
const INC = ['Donation', 'Zakat / Sadaqa', 'Event', 'Other'];

export default function Finance({ db, set, user, head, focus }) {
  const s = db.settings;
  const now = useToday();
  const cur = now.slice(0, 7);
  const [tab, setTab] = useState(focus ? 'fee' : 'sum');
  const [pick, setPick] = useState(null);
  const month = pick || cur; // follows the real month
  const year = month.slice(0, 4);
  const [q, setQ] = useState(focus || '');
  const [rc, setRc] = useState(null);
  const [minM, setMinM] = useState(1);
  const [clsF, setClsF] = useState('');
  const [monF, setMonF] = useState('');
  const [sel, setSel] = useState({});
  const [t, setT] = useState({ tid: '', date: '', status: 'Present', arrive: s.start, fbType: '', fbText: '' });
  const [tx, setTx] = useState({ type: 'expense', cat: EXP[0], amount: '', date: '', note: '' });
  const up = (k, v) => set('settings', (x) => ({ ...x, [k]: v }));
  const yMonths = monthsBetween(year + '-01', year + '-12').filter((m) => m <= cur);
  const last12 = monthsBetween(...(() => { const d = new Date(); d.setMonth(d.getMonth() - 11); return [d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'), cur]; })()).reverse();
  const due = (x) => Math.round((+s.classes.find((c) => c.id === x.classId)?.fee || 0) * (1 - (+x.discount || 0) / 100));
  const startM = (x) => (x.date || today()).slice(0, 7);
  const paidRec = (x, m = month) => db.pay.find((p) => p.sid === x.id && p.month === m);
  const pay = (x, m) => {
    const rec = { sid: x.id, month: m, amount: due(x), date: today(), time: nowTime(), no: 'R' + Date.now().toString().slice(-7) };
    set('pay', (a) => [...a, rec]); setRc(rec);
  };
  const unpay = (x) => set('pay', (a) => a.filter((p) => !(p.sid === x.id && p.month === month)));
  const unpaid = (x) => monthsBetween(startM(x), cur).filter((m) => !paidRec(x, m));
  const act = (m) => db.students.filter((x) => startM(x) <= m);
  const expM = (m) => act(m).reduce((a, x) => a + due(x), 0);
  const colM = (m) => db.pay.filter((p) => p.month === m).reduce((a, p) => a + +p.amount, 0);
  const pr = (th, m = month) => (db.payroll || {})[`${th.id}|${m}`] || {};
  const salary = (th, m = month) => {
    const e = db.tatt.filter((x) => x.tid === th.id && x.date.startsWith(m));
    const absent = e.filter((x) => x.status === 'Absent').length;
    const late = e.filter((x) => x.status === 'Present').reduce((a, x) => a + Math.max(0, mins(x.arrive) - mins(s.start) - +s.grace), 0);
    const ded = absent * (+th.salary / +s.workDays) + late * +s.lateFine;
    const p = pr(th, m);
    const transport = +th.transport || 0, home = +th.home || 0, bonus = +p.bonus || 0, otH = +p.ot || 0, ot = Math.round(otH * (+s.otRate || 0));
    const gross = +th.salary + transport + home + bonus + ot;
    return { absent, late, ded: Math.round(ded), transport, home, bonus, otH, ot, gross, net: Math.max(0, Math.round(gross - ded)) };
  };
  const setPr = (th, patch) => set('payroll', (o) => ({ ...o, [`${th.id}|${month}`]: { ...(o[`${th.id}|${month}`] || {}), ...patch } }));
  const addAtt = (e) => {
    e.preventDefault(); if (!t.tid) return;
    const rec = { ...t, date: t.date || now };
    set('tatt', (a) => [...a.filter((x) => !(x.tid === rec.tid && x.date === rec.date)), rec]);
  };
  const addTx = (e) => {
    e.preventDefault(); if (!+tx.amount) return;
    set('fin', (a) => [...a, { ...tx, id: uid(), date: tx.date || now }]); setTx({ ...tx, amount: '', note: '' });
  };
  // profit / loss for a list of months
  const pl = (ms) => {
    const inM = (d) => ms.includes((d || '').slice(0, 7));
    const sum = (arr) => arr.reduce((a, x) => a + +x.amount, 0);
    const fees = sum(db.pay.filter((p) => inM(p.date)));
    const inc = sum(db.fin.filter((x) => x.type === 'income' && inM(x.date)));
    const exp = sum(db.fin.filter((x) => x.type === 'expense' && inM(x.date)));
    const sal = ms.reduce((a, m) => a + db.teachers.reduce((b, th) => b + salary(th, m).net, 0) + db.fstaff.reduce((b, f) => b + +f.salary, 0), 0);
    const income = fees + inc; const outgo = exp + sal; const profit = income - outgo;
    const tax = !s.voluntary && profit > 0 ? profit * (+s.taxRate || 0) / 100 : 0;
    return { fees, inc, exp, sal, income, outgo, profit, tax, net: profit - tax };
  };
  const list = db.students.filter((x) => find({ ...x, cls: cname(db, x.classId) }, q));
  const sumPaid = list.filter((x) => paidRec(x)).reduce((a, x) => a + due(x), 0);
  const ur = list.filter((x) => !clsF || x.classId === clsF).map((x) => ({ x, um: unpaid(x) }))
    .filter((r) => r.um.length >= minM && (!monF || r.um.includes(monF))).sort((a, b) => b.um.length - a.um.length);
  const tn = (id) => db.teachers.find((x) => x.id === id)?.name;
  const R = (n) => Math.round(n).toLocaleString();
  const eM = expM(month), cM = colM(month), eY = yMonths.reduce((a, m) => a + expM(m), 0), cY = yMonths.reduce((a, m) => a + colM(m), 0);
  const pm = pl([month]), py = pl(yMonths);
  const tabs = [['sum', 'Summary'], ['fee', 'Student fees'], ['unp', 'Unpaid'], ...(head ? [['sal', 'Teacher salary'], ['pl', 'Profit / Loss']] : [])];
  const cl = (n) => (n < 0 ? 'neg' : 'pos');
  return (
    <div>
      <div className="card row">
        {tabs.map(([k, n]) => <button key={k} className={`btn ${tab === k ? '' : 'gray'}`} onClick={() => setTab(k)}>{n}</button>)}
        {tab !== 'unp' && <input type="month" value={month} onChange={(e) => setPick(e.target.value)} />}
      </div>
      {tab === 'sum' && (
        <div>
          <div className="kpis">
            <div><small>Expected {month}</small><b>{R(eM)}</b></div>
            <div><small>Collected</small><b className="pos">{R(cM)}</b></div>
            <div><small>Not collected</small><b className="neg">{R(eM - cM)}</b></div>
            <div><small>Collection rate</small><b>{eM ? Math.round(cM / eM * 100) : 0}%</b></div>
          </div>
          <div className="kpis">
            <div><small>Expected {year} (to now)</small><b>{R(eY)}</b></div>
            <div><small>Collected {year}</small><b className="pos">{R(cY)}</b></div>
            <div><small>Not collected {year}</small><b className="neg">{R(eY - cY)}</b></div>
            <div><small>Paid / unpaid students ({month})</small><b>{act(month).filter((x) => paidRec(x)).length} / {act(month).filter((x) => !paidRec(x)).length}</b></div>
          </div>
          <div className="card scroll"><h3>By class ({month})</h3><table>
            <thead><tr><th>Class</th><th>Students</th><th>Expected</th><th>Collected</th><th>Not collected</th><th>Rate</th></tr></thead>
            <tbody>{s.classes.map((c) => {
              const st = act(month).filter((x) => x.classId === c.id); const e = st.reduce((a, x) => a + due(x), 0);
              const col = st.reduce((a, x) => a + (paidRec(x) ? +paidRec(x).amount : 0), 0);
              return <tr key={c.id}><td>{c.name}</td><td>{st.length}</td><td>{R(e)}</td><td>{R(col)}</td><td>{R(e - col)}</td><td>{e ? Math.round(col / e * 100) : 0}%</td></tr>;
            })}</tbody></table></div>
        </div>
      )}
      {tab === 'fee' && (
        <div className="card scroll">
          <input className="search" placeholder="Search by name, phone, class, family, ID..." value={q} onChange={(e) => setQ(e.target.value)} />
          <p>Collected this month (listed): <b>{R(sumPaid)} {s.currency}</b></p>
          <table><thead><tr><th>ID</th><th>Name</th><th>Class</th><th>Phone</th><th>Status</th><th>Fee</th><th>Paid</th></tr></thead>
            <tbody>{list.map((x) => (
              <tr key={x.id}><td>{x.id}</td><td>{x.name}</td><td>{cname(db, x.classId)}</td><td>{x.phone}</td><td>{x.status} {x.discount > 0 && `(-${x.discount}%)`}</td><td>{due(x)}</td>
                <td>{paidRec(x)
                  ? <><button className="btn sm" onClick={() => setRc(paidRec(x))}>Receipt</button> <button className="btn gray sm" onClick={() => unpay(x)}>Undo</button></>
                  : <button className="btn gold sm" onClick={() => pay(x, month)}>Receive + receipt</button>}</td></tr>
            ))}</tbody></table>
        </div>
      )}
      {tab === 'unp' && (
        <div className="card scroll">
          <div className="row">
            <input placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} />
            <select value={clsF} onChange={(e) => setClsF(e.target.value)}><option value="">All classes</option>{s.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            <select value={monF} onChange={(e) => setMonF(e.target.value)}><option value="">All months</option>{last12.map((m) => <option key={m}>{m}</option>)}</select>
            <label>At least <input className="sm" type="number" min="1" value={minM} onChange={(e) => setMinM(+e.target.value || 1)} /> months unpaid</label>
          </div>
          <p>{ur.length} students · owed <b>{R(ur.reduce((a, r) => a + r.um.length * due(r.x), 0))} {s.currency}</b></p>
          <table><thead><tr><th>Unpaid months</th><th>Student</th><th>Class</th><th>Phone</th><th>Owed</th><th>Pay month</th></tr></thead>
            <tbody>{ur.map(({ x, um }) => (
              <tr key={x.id}><td><b>{um.length}</b></td><td>{x.name}</td><td>{cname(db, x.classId)}</td><td>{x.phone}</td><td>{um.length * due(x)} {s.currency}</td>
                <td><select value={sel[x.id] && um.includes(sel[x.id]) ? sel[x.id] : um[0]} onChange={(e) => setSel({ ...sel, [x.id]: e.target.value })}>{um.map((m) => <option key={m}>{m}</option>)}</select>{' '}
                  <button className="btn sm gold" onClick={() => pay(x, sel[x.id] && um.includes(sel[x.id]) ? sel[x.id] : um[0])}>Pay + receipt</button></td></tr>
            ))}</tbody></table>
        </div>
      )}
      {tab === 'sal' && (
        <div>
          <form className="card grid" onSubmit={addAtt}>
            <F label="Teacher"><select value={t.tid} onChange={(e) => setT({ ...t, tid: e.target.value })}><option value="">Select</option>{db.teachers.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></F>
            <F label="Date (empty = today)"><input type="date" value={t.date} onChange={(e) => setT({ ...t, date: e.target.value })} /></F>
            <F label="Status (correction)"><select value={t.status} onChange={(e) => setT({ ...t, status: e.target.value })}><option>Present</option><option>Absent</option></select></F>
            <F label={`Arrival (class starts ${s.start})`}><input type="time" value={t.arrive} onChange={(e) => setT({ ...t, arrive: e.target.value })} /></F>
            <F label="Feedback"><select value={t.fbType} onChange={(e) => setT({ ...t, fbType: e.target.value })}><option value="">-</option><option>Warning</option><option>Caution</option><option>Appreciation</option></select></F>
            <F label="Feedback text"><input value={t.fbText} onChange={(e) => setT({ ...t, fbText: e.target.value })} /></F>
            <div className="full"><button className="btn">Save / correct attendance</button> <small>Ustaz fingerprint scans arrive from the Attendance page.</small></div>
          </form>
          <div className="card scroll"><table>
            <thead><tr><th>Teacher</th><th>Base</th><th>Transport</th><th>Home</th><th>Bonus</th><th>Overtime hours</th><th>Overtime pay</th><th>Absent days</th><th>Late min</th><th>Deduction</th><th>Net salary</th></tr></thead>
            <tbody>{db.teachers.map((th) => { const r = salary(th); return (
              <tr key={th.id}><td>{th.name}</td><td>{th.salary}</td><td>{r.transport}</td><td>{r.home}</td>
                <td><input className="sm" type="number" value={pr(th).bonus ?? ''} onChange={(e) => setPr(th, { bonus: e.target.value })} /></td>
                <td><input className="sm" type="number" value={pr(th).ot ?? ''} onChange={(e) => setPr(th, { ot: e.target.value })} /></td>
                <td>{r.ot}</td><td>{r.absent}</td><td>{r.late}</td><td>{r.ded}</td><td><b>{r.net} {s.currency}</b></td></tr>); })}
              {db.fstaff.map((f) => <tr key={f.id}><td>{f.name} (finance)</td><td>{f.salary}</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>0</td><td><b>{f.salary} {s.currency}</b></td></tr>)}</tbody>
          </table></div>
          <div className="card scroll"><h3>Teacher attendance log ({month})</h3><table>
            <thead><tr><th>Date</th><th>Teacher</th><th>Status</th><th>Arrived</th><th>Feedback</th></tr></thead>
            <tbody>{db.tatt.filter((x) => x.date.startsWith(month)).sort((a, b) => (a.date < b.date ? 1 : -1)).map((x, i) => (
              <tr key={i}><td>{x.date}</td><td>{tn(x.tid)}</td><td>{x.status}</td><td>{x.arrive}</td><td>{x.fbType} {x.fbText}</td></tr>))}</tbody></table></div>
        </div>
      )}
      {tab === 'pl' && (
        <div>
          <div className="card row">
            <label>Organization type:{' '}
              <select value={s.voluntary ? 'yes' : 'no'} onChange={(e) => up('voluntary', e.target.value === 'yes')}>
                <option value="yes">Voluntary / non-profit (tax exempt)</option><option value="no">Not voluntary (taxed)</option>
              </select></label>
            {!s.voluntary && <label>Profit tax % <input className="sm" type="number" value={s.taxRate} onChange={(e) => up('taxRate', e.target.value)} /></label>}
          </div>
          <div className="card scroll"><table>
            <thead><tr><th></th><th>{month}</th><th>Year {year}</th></tr></thead>
            <tbody>
              {[['Student fees collected', 'fees'], ['Other income (donations...)', 'inc'], ['Total income', 'income'], ['Expenses', 'exp'], ['Salaries (teachers + finance staff)', 'sal'], ['Total expenses', 'outgo']].map(([l, k]) => <tr key={k}><td>{l}</td><td>{R(pm[k])}</td><td>{R(py[k])}</td></tr>)}
              <tr><td><b>PROFIT / LOSS</b></td><td className={cl(pm.profit)}><b>{R(pm.profit)}</b></td><td className={cl(py.profit)}><b>{R(py.profit)}</b></td></tr>
              <tr><td>Tax {s.voluntary ? '(exempt – voluntary organization)' : `(${s.taxRate}%)`}</td><td>{R(pm.tax)}</td><td>{R(py.tax)}</td></tr>
              <tr><td><b>Net after tax</b></td><td className={cl(pm.net)}><b>{R(pm.net)} {s.currency}</b></td><td className={cl(py.net)}><b>{R(py.net)} {s.currency}</b></td></tr>
            </tbody></table>
            <p><small>Fees are counted on the day received. Salaries use attendance deductions for the month. The yearly column covers January to now.</small></p></div>
          <form className="card grid" onSubmit={addTx}>
            <h3 className="full">Add income / expense</h3>
            <F label="Type"><select value={tx.type} onChange={(e) => setTx({ ...tx, type: e.target.value, cat: (e.target.value === 'income' ? INC : EXP)[0] })}><option value="expense">Expense</option><option value="income">Other income</option></select></F>
            <F label="Category"><select value={tx.cat} onChange={(e) => setTx({ ...tx, cat: e.target.value })}>{(tx.type === 'income' ? INC : EXP).map((c) => <option key={c}>{c}</option>)}</select></F>
            <F label="Amount"><input type="number" min="0" required value={tx.amount} onChange={(e) => setTx({ ...tx, amount: e.target.value })} /></F>
            <F label="Date (empty = today)"><input type="date" value={tx.date} onChange={(e) => setTx({ ...tx, date: e.target.value })} /></F>
            <F label="Note"><input value={tx.note} onChange={(e) => setTx({ ...tx, note: e.target.value })} /></F>
            <div className="full"><button className="btn">Add</button></div>
          </form>
          <div className="card scroll"><h3>Transactions ({month})</h3><table>
            <thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Amount</th><th>Note</th><th></th></tr></thead>
            <tbody>{db.fin.filter((x) => x.date.startsWith(month)).sort((a, b) => (a.date < b.date ? 1 : -1)).map((x) => (
              <tr key={x.id}><td>{x.date}</td><td>{x.type}</td><td>{x.cat}</td><td>{x.amount}</td><td>{x.note}</td><td><button className="btn red sm" onClick={() => set('fin', (a) => a.filter((y) => y.id !== x.id))}>X</button></td></tr>))}</tbody></table></div>
        </div>
      )}
      {rc && <Receipt db={db} r={rc} by={user.name} onClose={() => setRc(null)} />}
    </div>
  );
}
