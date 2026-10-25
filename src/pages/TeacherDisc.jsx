import { useState } from 'react';
import { F, uid, mins } from '../ui.jsx';

// director-only: teachers' attendance discipline, warnings and other records
export default function TeacherDisc({ db, set, user, now }) {
  const s = db.settings; const [m, setM] = useState(now.slice(0, 7));
  const blank = { tid: '', type: 'Warning', date: '', text: '' }; const [f, setF] = useState(blank);
  const tn = (id) => db.teachers.find((t) => t.id === id)?.name;
  const stats = db.teachers.map((t) => {
    const e = db.tatt.filter((x) => x.tid === t.id && x.date.startsWith(m));
    const late = e.filter((x) => x.status === 'Present' && mins(x.arrive) - mins(s.start) > +s.grace);
    return { t, late: late.length, lm: late.reduce((a, x) => a + mins(x.arrive) - mins(s.start) - +s.grace, 0), abs: e.filter((x) => x.status === 'Absent').length };
  });
  const attFb = db.tatt.filter((x) => x.date.startsWith(m) && x.fbType).map((x) => ({ id: 'a' + x.tid + x.date, date: x.date, tid: x.tid, type: x.fbType, text: x.fbText, src: 'Attendance' }));
  const man = db.tdisc.filter((x) => x.date.startsWith(m)).map((x) => ({ ...x, src: 'Manual' }));
  const all = [...attFb, ...man].sort((a, b) => (a.date < b.date ? 1 : -1));
  const save = (e) => {
    e.preventDefault(); if (!f.tid) return;
    const rec = { ...f, date: f.date || now };
    if (f.id) set('tdisc', (a) => a.map((x) => (x.id === f.id ? rec : x))); else set('tdisc', (a) => [...a, { ...rec, id: uid(), by: user.name }]);
    setF(blank);
  };
  return (
    <div>
      <div className="card row"><input type="month" value={m} onChange={(e) => setM(e.target.value)} /></div>
      <div className="card scroll"><h3>Teachers' discipline</h3><table>
        <thead><tr><th>Teacher</th><th>Late days</th><th>Late min</th><th>Absent days</th></tr></thead>
        <tbody>{stats.map((r) => <tr key={r.t.id}><td>{r.t.name}</td><td>{r.late}</td><td>{r.lm}</td><td>{r.abs}</td></tr>)}</tbody></table></div>
      <form className="card grid" onSubmit={save}>
        <h3 className="full">{f.id ? 'Edit record' : 'Add record'}</h3>
        <F label="Teacher"><select value={f.tid} onChange={(e) => setF({ ...f, tid: e.target.value })}><option value="">Select</option>{db.teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></F>
        <F label="Type"><select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}><option>Warning</option><option>Caution</option><option>Appreciation</option><option>Other</option></select></F>
        <F label="Date (empty = today)"><input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></F>
        <F label="Note"><input value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} /></F>
        <div className="full"><button className="btn">Save</button> {f.id && <button type="button" className="btn gray" onClick={() => setF(blank)}>Cancel</button>}</div>
      </form>
      <div className="card scroll"><h3>Records</h3><table>
        <thead><tr><th>Date</th><th>Teacher</th><th>Type</th><th>Note</th><th>Source</th><th></th></tr></thead>
        <tbody>{all.map((r) => (
          <tr key={r.id}><td>{r.date}</td><td>{tn(r.tid)}</td><td>{r.type}</td><td>{r.text}</td><td>{r.src}</td>
            <td>{r.src === 'Manual' && <><button className="btn sm" onClick={() => setF(r)}>Edit</button>{' '}<button className="btn red sm" onClick={() => set('tdisc', (a) => a.filter((x) => x.id !== r.id))}>X</button></>}</td></tr>))}</tbody></table></div>
    </div>
  );
}
