import { useState } from 'react';
import { useToday, cname, deptOf, lessonText, planStatus, planMessage, curJuz, planTarget } from '../ui.jsx';

export default function Parent({ db, user }) {
  const s = db.settings;
  const now = useToday();
  const st = db.students.find((x) => x.id === user.sid);
  const [from, setFrom] = useState(now.slice(0, 8) + '01');
  const [to, setTo] = useState('');
  if (!st) return <p>Student not found.</p>;
  const end = to || now;
  const inR = (d) => d.date >= from && d.date <= end;
  const desc = (a, b) => (a.date < b.date ? 1 : -1);
  const att = db.daily.filter((d) => d.sid === st.id && inR(d)).sort(desc);
  const cnt = (t) => att.filter((d) => d.att === t).length;
  const disc = db.disc.filter((d) => d.sid === st.id && inR(d)).sort(desc);
  const rl = (id) => s.rules.find((r) => r.id === id) || {};
  const quran = att.filter((d) => lessonText(d) || d.rev);
  const pm = planMessage(st, now); const ps = planStatus(st, now);
  const pct = Math.min(100, Math.round(curJuz(db, st) / (+st.planGoal || 30) * 100));
  const events = db.plans.filter((p) => p.public && (!p.classId || p.classId === st.classId) && p.date >= from).sort((a, b) => (a.date > b.date ? 1 : -1));
  const msgs = db.msgs.filter((m) => m.target === 'school' || (m.target === 'class' && m.classId === st.classId) || (m.target === 'student' && m.sid === st.id)).sort(desc);
  return (
    <div>
      <div className="card row">
        {st.photo && <img className="th" style={{ width: 70, height: 90 }} src={st.photo} alt="" />}
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0 }}>{st.name}</h2>
          <div>ID {st.id} · {deptOf(db, st.classId)?.name} › {cname(db, st.classId)} · {st.gender}, age {st.age}</div>
          <div>Quran level: Juz {st.juz || '-'} · Kitabs: {st.kitabs || '-'}</div>
          <div>School: {st.school || '-'} · Address: {st.address || '-'}</div>
        </div>
      </div>
      {ps && (
        <div className="card">
          <h3>📖 Quran completion plan</h3>
          <div>{st.planStart} → {planTarget(st)} · Juz {curJuz(db, st)}/{st.planGoal || 30}</div>
          <div className="pbar"><div style={{ width: pct + '%' }} /></div>
          <p className={'badge ' + pm.k}>{pm.n != null ? pm.n + ' ' : ''}{pm.txt}</p>
          {(pm.k === 'early' || pm.k === 'ontime') && <p>{s.rewardText}</p>}
        </div>
      )}
      <div className="card row">
        <label>From <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label>To <input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
        <button className="btn gray sm" onClick={() => setTo('')}>Today</button>
      </div>
      <div className="card scroll"><h3>Attendance</h3>
        <p>Present {cnt('Present')} · Late {cnt('Late')} · Absent {cnt('Absent')} · Excused {cnt('Excused')}</p>
        <table><thead><tr><th>Date</th><th>Arrived</th><th>Status</th><th>Teacher feedback</th></tr></thead>
          <tbody>{att.filter((d) => d.att || d.fbType).map((d, i) => <tr key={i}><td>{d.date}</td><td>{d.time || '-'}</td><td><span className={'st ' + d.att}>{d.att}</span></td><td>{d.fbType} {d.fbText}</td></tr>)}</tbody></table></div>
      <div className="card scroll"><h3>Quran lessons (hifz / revision)</h3>
        <table><thead><tr><th>Date</th><th>Lesson</th><th>Revision</th><th>Quality</th></tr></thead>
          <tbody>{quran.map((d, i) => <tr key={i}><td>{d.date}</td><td>{lessonText(d)}</td><td>{d.rev}</td><td>{d.grade}</td></tr>)}</tbody></table></div>
      <div className="card scroll"><h3>Discipline</h3>
        <table><thead><tr><th>Date</th><th>Rule</th><th>Action</th><th>Note</th></tr></thead>
          <tbody>{disc.map((d) => <tr key={d.id}><td>{d.date}</td><td>{rl(d.rid).rule}</td><td>{rl(d.rid).punish}</td><td>{d.note}</td></tr>)}</tbody></table>
        {!disc.length && <p className="note">No discipline records in this period.</p>}</div>
      <div className="card scroll"><h3>Exam dates, meetings and events</h3>
        <table><thead><tr><th>Date</th><th>Type</th><th>Title</th><th>Details</th></tr></thead>
          <tbody>{events.map((p) => <tr key={p.id}><td>{p.date}</td><td>{p.kind}</td><td>{p.title}</td><td>{p.details}</td></tr>)}</tbody></table></div>
      <div className="card"><h3>Messages</h3>
        {msgs.map((m) => <p key={m.id} className="alertline warn"><small>{m.date} {m.time} · {m.by}</small><br />{m.text}</p>)}
        {!msgs.length && <p className="note">No messages.</p>}</div>
    </div>
  );
}
