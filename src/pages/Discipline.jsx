import { useState } from 'react';
import TeacherDisc from './TeacherDisc.jsx';
import { F, useToday, uid, rule, foulPts, alerts, absAlerts, absWarned } from '../ui.jsx';

export default function Discipline({ db, set, user, head, students }) {
  const s = db.settings;
  const now = useToday();
  const [tab, setTab] = useState('students');
  const [f, setF] = useState({ sid: '', rid: s.rules[0]?.id, date: '', note: '' });
  const [note, setNote] = useState('');
  const ids = students.map((x) => x.id);
  const recs = db.disc.filter((d) => ids.includes(d.sid));
  const nm = (id) => db.students.find((x) => x.id === id)?.name;
  const al = alerts(db, students);
  const mo = now.slice(0, 7);
  const ab = absAlerts(db, students, now);
  const warnAbs = (x) => {
    const rid = (s.rules.find((r) => r.id === 'r2') || s.rules[0])?.id;
    set('disc', (a) => [...a, { id: uid(), sid: x.st.id, rid, date: now, note: `Absent ${x.n} days in ${mo}`, absKey: `${x.st.id}|${mo}` }]);
  };
  const add = (e) => {
    e.preventDefault(); if (!f.sid) return;
    const before = foulPts(db, f.sid); const after = before + +rule(db, f.rid).points;
    set('disc', (a) => [...a, { ...f, date: f.date || now, id: uid() }]);
    setNote(after >= +s.foulLimit ? `⚠ ${nm(f.sid)} reached the foul limit (${after} points): ${s.foulAction}`
      : after >= +s.foulWarn ? `Notice: ${nm(f.sid)} now has ${after} points (limit ${s.foulLimit}).` : '');
    setF({ ...f, note: '' });
  };
  const tabs = head && (
    <div className="card row">
      <button className={`btn ${tab === 'students' ? '' : 'gray'}`} onClick={() => setTab('students')}>Students</button>
      <button className={`btn ${tab === 'teachers' ? '' : 'gray'}`} onClick={() => setTab('teachers')}>Teachers' discipline</button>
    </div>
  );
  if (head && tab === 'teachers') return <div>{tabs}<TeacherDisc db={db} set={set} user={user} now={now} /></div>;
  return (
    <div>
      {tabs}
      {(al.length > 0 || note) && (
        <div className="card">
          <h3>🔔 Notifications</h3>
          {note && <p className="alertline hot">{note}</p>}
          {al.map((a) => (
            <p key={a.st.id} className={'alertline ' + (a.pts >= +s.foulLimit ? 'hot' : 'warn')}>
              {a.st.name}: {a.pts} points — {a.pts >= +s.foulLimit ? `LIMIT REACHED → ${s.foulAction}` : `approaching limit (${s.foulLimit})`}
              {head && a.pts >= +s.foulLimit && <> <button className="btn sm gray" onClick={() => window.confirm('Action done? Clear this student\'s foul records.') && set('disc', (d) => d.filter((x) => x.sid !== a.st.id))}>Action done / clear</button></>}
            </p>
          ))}
        </div>
      )}
      {ab.length > 0 && (
        <div className="card">
          <h3>🚫 Absence warnings (absent more than {s.absentLimit} days this month)</h3>
          {ab.map((x) => (
            <p key={x.st.id} className="alertline warn">{x.st.name}: {x.n} days absent{' '}
              {absWarned(db, x.st.id, mo) ? <b>✓ warned</b> : <button className="btn sm gold" onClick={() => warnAbs(x)}>Give warning</button>}</p>
          ))}
        </div>
      )}
      <div className="card"><h3>Rules and punishments</h3>
        <table><thead><tr><th>Rule</th><th>Points</th><th>Punishment</th></tr></thead>
          <tbody>{s.rules.map((r) => <tr key={r.id}><td>{r.rule}</td><td>{r.points}</td><td>{r.punish}</td></tr>)}</tbody></table>
        <p><small>Warning at {s.foulWarn} points, limit at {s.foulLimit} points.</small></p></div>
      <form className="card grid" onSubmit={add}>
        <F label="Student"><select value={f.sid} onChange={(e) => setF({ ...f, sid: e.target.value })}><option value="">Select</option>{students.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></F>
        <F label="Rule broken"><select value={f.rid} onChange={(e) => setF({ ...f, rid: e.target.value })}>{s.rules.map((r) => <option key={r.id} value={r.id}>{r.rule}</option>)}</select></F>
        <F label="Date (empty = today)"><input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></F>
        <F label="Note"><input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></F>
        <div className="full"><button className="btn">Record</button></div>
      </form>
      <div className="card scroll"><h3>Records</h3><table>
        <thead><tr><th>Date</th><th>Student</th><th>Rule</th><th>Punishment</th><th>Total points</th><th>Note</th><th></th></tr></thead>
        <tbody>{recs.map((d) => <tr key={d.id}><td>{d.date}</td><td>{nm(d.sid)}</td><td>{rule(db, d.rid).rule}</td><td>{rule(db, d.rid).punish}</td><td>{foulPts(db, d.sid)}</td><td>{d.note}</td>
          <td><button className="btn red sm" onClick={() => set('disc', (a) => a.filter((x) => x.id !== d.id))}>X</button></td></tr>)}</tbody>
      </table></div>
    </div>
  );
}
