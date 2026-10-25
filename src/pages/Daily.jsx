import { useState } from 'react';
import { nowTime, today, useToday, mins, deptOf, lessonText, Overlay, cname } from '../ui.jsx';
import { SURAS } from '../data/suras.js';

const rng = (n) => Array.from({ length: n }, (_, i) => i + 1);
const LESSON_KEYS = ['ders', 'line', 'juz', 'sura', 'page'];

function LateReport({ db, students, month, onClose }) {
  const s = db.settings; const lim = +s.lateLimit || 3;
  const rows = students.map((st) => ({ st, dates: db.daily.filter((d) => d.sid === st.id && d.att === 'Late' && d.date.startsWith(month)).sort((a, b) => (a.date > b.date ? 1 : -1)) })).filter((r) => r.dates.length >= lim);
  return (
    <Overlay>
      <style>{'@page{size:A4 portrait;margin:12mm}'}</style>
      <div className="wrapc">
        <div className="no-print bar card"><button className="btn" onClick={() => window.print()}>Print / Save as PDF</button> <button className="btn gray" onClick={onClose}>Close</button></div>
        <div className="sheet" style={{ width: 'min(760px,96vw)' }}>
          <div className="shh">{s.logo && <img src={s.logo} alt="" />}<div><h2>{s.school}</h2></div></div>
          <h3>Late report · {month} · {lim}+</h3>
          {s.classes.map((c) => { const r = rows.filter((x) => x.st.classId === c.id); if (!r.length) return null; return (
            <div key={c.id}><h4>{c.name}</h4><table>
              <thead><tr><th>Student</th><th>ID</th><th>Late days</th><th>Late dates</th></tr></thead>
              <tbody>{r.map((x) => <tr key={x.st.id}><td>{x.st.name}</td><td>{x.st.id}</td><td><b>{x.dates.length}</b></td><td style={{ whiteSpace: 'normal' }}>{x.dates.map((d) => d.date.slice(5) + (d.time ? ' ' + d.time : '')).join(' · ')}</td></tr>)}</tbody></table></div>); })}
          {!rows.length && <p className="note">No students.</p>}
        </div>
      </div>
    </Overlay>
  );
}

export default function Daily({ db, set, user, head, students }) {
  const s = db.settings;
  const now = useToday();
  const myClasses = head ? s.classes : s.classes.filter((c) => c.id === user.classId);
  const [cid, setCid] = useState(myClasses[0]?.id);
  const [pick, setPick] = useState(null);
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [log, setLog] = useState('');
  const [hid, setHid] = useState('');
  const [tid, setTid] = useState('');
  const [rm, setRm] = useState(now.slice(0, 7));
  const [rep, setRep] = useState(false);
  const date = pick || now; // follows the real day unless a date is picked
  const isQ = !!deptOf(db, cid)?.child; // Qaeda: ders + line. Others: juz + sura + page
  const list = students.filter((x) => x.classId === cid);
  const get = (id) => db.daily.find((d) => d.sid === id && d.date === date) || {};
  // a new day starts from the previous lesson of the same student (teacher can change it)
  const put = (id, patch, day = date) => set('daily', (a) => {
    const i = a.findIndex((d) => d.sid === id && d.date === day);
    if (i < 0) {
      const pv = a.filter((d) => d.sid === id && d.date < day && (d.ders || d.juz || d.sura || d.page)).sort((x, y) => (x.date < y.date ? 1 : -1))[0];
      const carry = {}; if (pv) LESSON_KEYS.forEach((k) => { if (pv[k]) carry[k] = pv[k]; });
      return [...a, { sid: id, date: day, ...carry, ...patch }];
    }
    const b = [...a]; b[i] = { ...b[i], ...patch }; return b;
  });
  const apply = (raw, time, day, force) => {
    const c = raw.trim(); if (!c) return '';
    const late = mins(time) - mins(s.start) > +s.grace;
    const st = db.students.find((x) => x.id === c || x.fp === c);
    if (st) {
      if (!head && st.classId !== user.classId) return `✖ ${st.name} is not in your class`;
      const old = db.daily.find((d) => d.sid === st.id && d.date === day);
      if (old?.time && !force) return `• ${st.name} already scanned at ${old.time}`;
      put(st.id, { time, att: late ? 'Late' : 'Present' }, day);
      return `${late ? '⚠ LATE' : '✔ ON TIME'} ${st.name} ${time}`;
    }
    const th = db.teachers.find((x) => x.id === c || x.fp === c);
    if (th) {
      const old = db.tatt.find((x) => x.tid === th.id && x.date === day);
      if (old?.arrive && !force) return `• Ustaz ${th.name} already scanned at ${old.arrive}`;
      set('tatt', (a) => [...a.filter((x) => !(x.tid === th.id && x.date === day)), { tid: th.id, date: day, status: 'Present', arrive: time }]);
      return `${late ? '⚠ LATE' : '✔ ON TIME'} Ustaz ${th.name} ${time}`;
    }
    return `✖ Unknown ID ${c}`;
  };
  const scan = (e) => { if (e.key === 'Enter') { setMsg(apply(code, nowTime(), today())); setCode(''); } };
  const importLog = () => setMsg(log.split('\n').map((l) => { const [i, t] = l.split(','); return i && t ? apply(i, t.trim(), date, true) : ''; }).filter(Boolean).join(' | '));
  const absentRest = () => list.filter((x) => !get(x.id).att).forEach((x) => put(x.id, { att: 'Absent' }));
  const hist = db.daily.filter((d) => d.sid === hid).sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 15);
  const cnt = (t) => db.daily.filter((d) => d.sid === hid && d.att === t).length;
  const lesson = (x, d) => (isQ ? (
    <>
      <select value={d.ders || ''} onChange={(e) => put(x.id, { ders: e.target.value })}><option value="">Ders</option>{rng(17).map((n) => <option key={n} value={n}>Ders {n}</option>)}</select>{' '}
      <select value={d.line || ''} onChange={(e) => put(x.id, { line: e.target.value })}><option value="">Line</option>{rng(+s.dersLines || 20).map((n) => <option key={n} value={n}>Line {n}</option>)}</select>
    </>
  ) : (
    <>
      <select value={d.juz || ''} onChange={(e) => put(x.id, { juz: e.target.value })}><option value="">Juz</option>{rng(30).map((n) => <option key={n} value={n}>Juz {n}</option>)}</select>{' '}
      <select value={d.sura || ''} onChange={(e) => put(x.id, { sura: e.target.value })}><option value="">Sura</option>{SURAS.map(([en], i) => <option key={i} value={i + 1}>{i + 1}. {en}</option>)}</select>{' '}
      <input className="sm" type="number" min="1" max="604" placeholder="Page" value={d.page || ''} onChange={(e) => put(x.id, { page: e.target.value })} />
    </>
  ));
  return (
    <div>
      <div className="card">
        <h3>Fingerprint scan station</h3>
        <input className="search" autoFocus placeholder="Touch fingerprint device (ID arrives here) or type ID + Enter" value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={scan} />
        {msg && <p className="scanmsg">{msg}</p>}
        <p><small>Class starts {s.start}; late after {s.grace} min. Students and ustazs are both recorded here.</small></p>
        <details><summary>Import device log (ID,HH:MM per line)</summary>
          <textarea className="search" rows="3" value={log} onChange={(e) => setLog(e.target.value)} />
          <button className="btn sm" onClick={importLog}>Import</button></details>
      </div>
      <div className="card row">
        <b>⏱ Teacher automatic check-in</b>
        {user.role === 'teacher'
          ? <span>{user.name}</span>
          : <select value={tid} onChange={(e) => setTid(e.target.value)}><option value="">Select teacher</option>{db.teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>}
        <button className="btn gold" onClick={() => setMsg(apply(user.role === 'teacher' ? user.id : tid, nowTime(), today()))}>⏱ Check in now</button>
      </div>
      <div className="card row">
        <input type="month" value={rm} onChange={(e) => setRm(e.target.value)} />
        <button className="btn gold" onClick={() => setRep(true)}>Late report (PDF)</button>
      </div>
      <div className="card row">
        <select value={cid} onChange={(e) => setCid(e.target.value)}>{myClasses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <input type="date" value={date} onChange={(e) => setPick(e.target.value)} />
        <button className="btn gray" onClick={() => setPick(null)}>Today</button>
        <button className="btn gold" onClick={absentRest}>Mark not-arrived as Absent</button>
      </div>
      <div className="card scroll"><table>
        <thead><tr><th>Student</th><th>Auto</th><th>Arrived</th><th>Status (teacher can correct)</th><th>Feedback</th><th>Feedback text</th><th>Lesson</th><th>Task / homework</th><th>Revision</th><th>Quality</th></tr></thead>
        <tbody>{list.map((x) => { const d = get(x.id); return (
          <tr key={x.id}>
            <td><a href="#h" onClick={(e) => { e.preventDefault(); setHid(x.id); }}>{x.name}</a></td>
            <td><button className="btn sm" onClick={() => put(x.id, { time: nowTime(), att: mins(nowTime()) - mins(s.start) > +s.grace ? 'Late' : 'Present' }, today())}>Now</button></td>
            <td>{d.time || '-'}</td>
            <td><select className={'st ' + (d.att || '')} value={d.att || ''} onChange={(e) => put(x.id, { att: e.target.value })}><option value="">-</option><option>Present</option><option>Late</option><option>Absent</option><option>Excused</option></select></td>
            <td><select value={d.fbType || ''} onChange={(e) => put(x.id, { fbType: e.target.value })}><option value="">-</option><option>Warning</option><option>Caution</option><option>Advice</option><option>Appreciation</option></select></td>
            <td><input value={d.fbText || ''} onChange={(e) => put(x.id, { fbText: e.target.value })} /></td>
            <td>{lesson(x, d)}</td>
            <td><select value={d.task || ''} onChange={(e) => put(x.id, { task: e.target.value })}><option value="">-</option><option>Finished</option><option>Not finished</option></select></td>
            <td><input value={d.rev || ''} onChange={(e) => put(x.id, { rev: e.target.value })} /></td>
            <td><select value={d.grade || ''} onChange={(e) => put(x.id, { grade: e.target.value })}><option value="">-</option><option>Excellent</option><option>Good</option><option>Fair</option><option>Weak</option></select></td>
          </tr>); })}</tbody>
      </table></div>
      {hid && (
        <div className="card">
          <h3>Growth: {db.students.find((x) => x.id === hid)?.name}</h3>
          <p>Present {cnt('Present')} | Late {cnt('Late')} | Absent {cnt('Absent')} | Excused {cnt('Excused')}</p>
          <div className="scroll"><table><thead><tr><th>Date</th><th>Time</th><th>Att.</th><th>Feedback</th><th>Lesson</th><th>Task / homework</th><th>Revision</th><th>Quality</th></tr></thead>
            <tbody>{hist.map((d, i) => <tr key={i}><td>{d.date}</td><td>{d.time}</td><td>{d.att}</td><td>{d.fbType} {d.fbText}</td><td>{lessonText(d)}</td><td>{d.task}</td><td>{d.rev}</td><td>{d.grade}</td></tr>)}</tbody></table></div>
        </div>
      )}
      {rep && <LateReport db={db} students={students} month={rm} onClose={() => setRep(false)} />}
    </div>
  );
}
