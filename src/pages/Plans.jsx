import { useState } from 'react';
import { F, useToday, uid, planIsNow, nowTime, cname, Overlay } from '../ui.jsx';

const KINDS = ['Plan', 'Exam', 'Meeting', 'Reminder', 'Holiday'];

export default function Plans({ db, set, user, head, students }) {
  const s = db.settings;
  const now = useToday();
  const me = user.id; const role = user.role;
  const canPost = head || role === 'teacher';
  const [per, setPer] = useState('Daily');
  const [rep, setRep] = useState(false);
  const [who, setWho] = useState(head ? 'school' : 'mine');
  const [f, setF] = useState({ period: 'Daily', kind: 'Plan', date: '', title: '', details: '', pub: false, classId: '', by: user.name });
  const [m, setM] = useState({ target: head ? 'school' : 'class', sid: '', classId: s.classes[0]?.id, text: '' });
  const add = (e) => {
    e.preventDefault();
    set('plans', (a) => [...a, { id: uid(), period: f.period, kind: f.kind, date: f.date || now, title: f.title, details: f.details, public: f.pub, classId: head ? f.classId : (user.classId || ''), owner: me, role, ownerName: head ? f.by : user.name, done: false }]);
    setF({ ...f, title: '', details: '' }); setPer(f.period);
  };
  const send = (e) => {
    e.preventDefault();
    if (!m.text.trim()) return;
    if (m.target === 'student' && !m.sid) return window.alert('Select a student.');
    set('msgs', (a) => [...a, { id: uid(), date: now, time: nowTime(), by: user.name, owner: me, target: m.target, classId: head ? m.classId : user.classId, sid: m.sid, text: m.text.trim() }]);
    setM({ ...m, text: '' });
  };
  const list = db.plans.filter((p) => p.period === per && (who === 'mine' ? p.owner === me : who === 'school' ? p.role === 'head' : p.role === 'teacher'))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const label = (p) => (p.period === 'Monthly' ? p.date.slice(0, 7) : p.period === 'Yearly' ? p.date.slice(0, 4) : p.period === 'Weekly' ? 'Week of ' + p.date : p.date);
  const myMsgs = db.msgs.filter((x) => head || x.owner === me).sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1)).slice(0, 10);
  return (
    <div>
      <form className="card grid" onSubmit={add}>
        <h3 className="full">New plan / reminder</h3>
        <F label="Plan type"><select value={f.period} onChange={(e) => setF({ ...f, period: e.target.value })}><option>Daily</option><option>Weekly</option><option>Monthly</option><option>Yearly</option></select></F>
        <F label="Kind"><select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>{KINDS.map((k) => <option key={k}>{k}</option>)}</select></F>
        <F label="Date (empty = today)"><input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></F>
        <F label="Title"><input required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></F>
        <F label="Details / goals"><textarea value={f.details} onChange={(e) => setF({ ...f, details: e.target.value })} /></F>
        {head && <F label="Director (who owns this plan)"><select value={f.by} onChange={(e) => setF({ ...f, by: e.target.value })}>{s.directors.map((d) => <option key={d.id}>{d.name}</option>)}</select></F>}
        {head && <F label="For"><select value={f.classId} onChange={(e) => setF({ ...f, classId: e.target.value })}><option value="">Whole school</option>{s.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></F>}
        {canPost && <label className="f"><span>Parents</span><label><input type="checkbox" checked={f.pub} onChange={(e) => setF({ ...f, pub: e.target.checked })} /> Show to parents</label></label>}
        <div className="full"><button className="btn">Add</button></div>
      </form>
      {canPost && (
        <form className="card grid" onSubmit={send}>
          <h3 className="full">📨 Message to parents</h3>
          <F label="Send to"><select value={m.target} onChange={(e) => setM({ ...m, target: e.target.value })}>{head && <option value="school">Whole school</option>}<option value="class">A class</option><option value="student">One student</option></select></F>
          {head && m.target === 'class' && <F label="Class"><select value={m.classId} onChange={(e) => setM({ ...m, classId: e.target.value })}>{s.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></F>}
          {m.target === 'student' && <F label="Student"><select value={m.sid} onChange={(e) => setM({ ...m, sid: e.target.value })}><option value="">Select</option>{(head ? db.students : students).map((x) => <option key={x.id} value={x.id}>{x.name} ({cname(db, x.classId)})</option>)}</select></F>}
          <F label="Message"><textarea value={m.text} onChange={(e) => setM({ ...m, text: e.target.value })} /></F>
          <div className="full"><button className="btn gold">Send</button></div>
          {myMsgs.map((x) => <p key={x.id} className="full alertline warn"><small>{x.date} {x.time} · {x.by} → {x.target === 'school' ? 'whole school' : x.target === 'class' ? cname(db, x.classId) : db.students.find((y) => y.id === x.sid)?.name}</small><br />{x.text} <button type="button" className="btn red sm" onClick={() => set('msgs', (a) => a.filter((y) => y.id !== x.id))}>X</button></p>)}
        </form>
      )}
      <div className="card row">
        {['Daily', 'Weekly', 'Monthly', 'Yearly'].map((p) => <button key={p} className={`btn ${per === p ? '' : 'gray'}`} onClick={() => setPer(p)}>{p}</button>)}
        <select value={who} onChange={(e) => setWho(e.target.value)}>
          <option value="mine">My plans</option><option value="school">School plans (directors)</option>{head && <option value="teachers">Teachers' plans</option>}
        </select>
        <button className="btn gold" onClick={() => setRep(true)}>🖨 Print all plans</button>
      </div>
      <div className="card scroll"><table>
        <thead><tr><th>Done</th><th>When</th><th>Kind</th><th>Plan</th><th>Details</th><th>By</th><th>For</th><th></th></tr></thead>
        <tbody>{list.map((p) => (
          <tr key={p.id} className={planIsNow(p, now) ? 'nowrow' : ''}>
            <td><input type="checkbox" checked={p.done} disabled={p.owner !== me && !head} onChange={() => set('plans', (a) => a.map((x) => (x.id === p.id ? { ...x, done: !x.done } : x)))} /></td>
            <td>{label(p)}{planIsNow(p, now) && ' ← now'}</td><td>{p.kind}</td><td style={{ textDecoration: p.done ? 'line-through' : '' }}>{p.title}</td><td>{p.details}</td>
            <td><b>{p.ownerName}</b>{p.role === 'head' && ' (Director)'}</td><td>{p.classId ? cname(db, p.classId) : 'School'}{p.public && ' 👪'}</td>
            <td>{(p.owner === me || head) && <button className="btn red sm" onClick={() => set('plans', (a) => a.filter((x) => x.id !== p.id))}>X</button>}</td>
          </tr>))}</tbody>
      </table></div>
      {rep && (
        <Overlay>
          <style>{'@page{size:A4 landscape;margin:10mm}'}</style>
          <div className="wrapc">
            <div className="no-print bar card"><button className="btn" onClick={() => window.print()}>Print / Save as PDF</button> <button className="btn gray" onClick={() => setRep(false)}>Close</button></div>
            <div className="sheet">
              <div className="shh">{s.logo && <img src={s.logo} alt="" />}<div><h2>{s.school}</h2><div>{now}</div></div></div>
              <h3>Plans report</h3>
              {['Daily', 'Weekly', 'Monthly', 'Yearly'].map((p) => {
                const rows = db.plans.filter((x) => x.period === p && (who === 'mine' ? x.owner === me : who === 'school' ? x.role === 'head' : x.role === 'teacher')).sort((a, b) => (a.date > b.date ? 1 : -1));
                return rows.length ? (
                  <div key={p}><h4>{p}</h4><table>
                    <thead><tr><th>When</th><th>Kind</th><th>Plan</th><th>Details</th><th>By</th><th>For</th><th>Done</th></tr></thead>
                    <tbody>{rows.map((x) => <tr key={x.id}><td>{label(x)}</td><td>{x.kind}</td><td>{x.title}</td><td style={{ whiteSpace: 'normal' }}>{x.details}</td><td>{x.ownerName}</td><td>{x.classId ? cname(db, x.classId) : 'School'}</td><td>{x.done ? '✔' : ''}</td></tr>)}</tbody></table></div>
                ) : null;
              })}
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
}
