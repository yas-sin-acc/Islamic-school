import { useState } from 'react';
import { uid, Csv, coursesOf } from '../ui.jsx';
import PhotoField from '../components/PhotoField.jsx';

export default function Settings({ db, set }) {
  const s = db.settings;
  const [edTerm, setEdTerm] = useState(s.term);
  const up = (k, v) => set('settings', (x) => ({ ...x, [k]: v }));
  const upList = (k, i, patch) => up(k, s[k].map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const addTo = (k, row) => up(k, [...s[k], { id: uid(), ...row }]);
  const delFrom = (k, i) => up(k, s[k].filter((_, j) => j !== i));
  const csv = (v) => v.split(',').map((x) => x.trim()).filter(Boolean);
  const upT = (id, patch) => set('teachers', (a) => a.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const num = (k, label, type = 'number') => (
    <label className="f" key={k}><span>{label}</span><input type={type} value={s[k]} onChange={(e) => up(k, e.target.value)} /></label>
  );
  return (
    <div>
      <div className="card grid"><h3 className="full">School</h3>
        {['school', 'address', 'phone', 'year', 'currency'].map((k) => num(k, k, 'text'))}
        {num('idWidth', 'ID card width (mm, bigger = bigger print)')}
        {num('pass', 'Pass mark %')}{num('maxClass', 'Max students per class')}
        <div className="full"><small>School logo (image)</small></div>
        <PhotoField value={s.logo} onChange={(p) => up('logo', p)} w={300} h={300} fmt="image/png" />
      </div>
      <div className="card"><h3>Directors (name, username, password)</h3>
        {s.directors.map((d, i) => (
          <div className="row" key={d.id}>
            <input value={d.name} onChange={(e) => upList('directors', i, { name: e.target.value })} />
            <select value={d.sex || (d.id === 'df' ? 'Female' : 'Male')} onChange={(e) => upList('directors', i, { sex: e.target.value })}><option>Male</option><option>Female</option></select>
            <input value={d.user} onChange={(e) => upList('directors', i, { user: e.target.value })} />
            <input value={d.pass} onChange={(e) => upList('directors', i, { pass: e.target.value })} />
            {s.directors.length > 1 && <button className="btn red sm" onClick={() => delFrom('directors', i)}>X</button>}
          </div>))}
        <button className="btn" onClick={() => addTo('directors', { name: 'Director', user: 'director' + (s.directors.length + 1), pass: '1234' })}>+ Director</button>
      </div>
      <div className="card grid"><h3 className="full">Statuses (comma separated)</h3>
        <label className="f"><span>Student statuses</span><Csv value={s.statuses} onChange={(v) => up('statuses', v)} /></label>
      </div>
      <div className="card"><h3>Main departments</h3>
        {s.departments.map((d, i) => (
          <div className="row" key={d.id}>
            <input value={d.name} onChange={(e) => upList('departments', i, { name: e.target.value })} />
            <label><input type="checkbox" checked={!!d.child} onChange={(e) => upList('departments', i, { child: e.target.checked })} /> children (Qaeda certificate)</label>
            <button className="btn red sm" onClick={() => delFrom('departments', i)}>X</button>
          </div>))}
        <button className="btn" onClick={() => addTo('departments', { name: 'New department' })}>+ Department</button>
      </div>
      <div className="card"><h3>Terms / semesters</h3>
        {s.terms.map((t, i) => (
          <div className="row" key={t.id}>
            <input value={t.name} onChange={(e) => upList('terms', i, { name: e.target.value })} />
            <button className="btn red sm" onClick={() => delFrom('terms', i)}>X</button>
          </div>))}
        <button className="btn" onClick={() => addTo('terms', { name: 'New term' })}>+ Term</button>
        <div className="row"><b>Current term:</b><select value={s.term} onChange={(e) => up('term', e.target.value)}>{s.terms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
      </div>
      <div className="card"><h3>Classes (name, department, monthly fee, courses)</h3>
        <div className="row"><b>Edit courses for:</b><select value={edTerm} onChange={(e) => setEdTerm(e.target.value)}>{s.terms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
        {s.classes.map((c, i) => (
          <div className="row" key={c.id}>
            <input value={c.name} onChange={(e) => upList('classes', i, { name: e.target.value })} />
            <select value={c.dept} onChange={(e) => upList('classes', i, { dept: e.target.value })}>{s.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
            <input className="sm" type="number" value={c.fee} onChange={(e) => upList('classes', i, { fee: e.target.value })} />
            <Csv key={c.id + edTerm} placeholder="courses, comma separated" value={coursesOf(c, edTerm)} onChange={(v) => upList('classes', i, { tc: { ...c.tc, [edTerm]: v } })} />
            <button className="btn red sm" onClick={() => delFrom('classes', i)}>X</button>
          </div>))}
        <button className="btn" onClick={() => addTo('classes', { name: 'New class', dept: s.departments[0]?.id, fee: 0, courses: ['Quran'] })}>+ Class</button>
      </div>
      <div className="card"><h3>Exam types (name, max mark)</h3>
        {s.exams.map((e, i) => (
          <div className="row" key={e.id}>
            <input value={e.name} onChange={(ev) => upList('exams', i, { name: ev.target.value })} />
            <input className="sm" type="number" value={e.max} onChange={(ev) => upList('exams', i, { max: ev.target.value })} />
            <button className="btn red sm" onClick={() => delFrom('exams', i)}>X</button>
          </div>))}
        <button className="btn" onClick={() => addTo('exams', { name: 'New exam', max: 10 })}>+ Exam</button>
      </div>
      <div className="card"><h3>Rules, points, punishment</h3>
        {s.rules.map((r, i) => (
          <div className="row" key={r.id}>
            <input value={r.rule} onChange={(e) => upList('rules', i, { rule: e.target.value })} />
            <input className="sm" type="number" value={r.points} onChange={(e) => upList('rules', i, { points: e.target.value })} />
            <input value={r.punish} onChange={(e) => upList('rules', i, { punish: e.target.value })} />
            <button className="btn red sm" onClick={() => delFrom('rules', i)}>X</button>
          </div>))}
        <button className="btn" onClick={() => addTo('rules', { rule: 'New rule', points: 1, punish: 'Warning' })}>+ Rule</button>
        <div className="grid" style={{ marginTop: 10 }}>
          {num('foulWarn', 'Notify at points')}{num('foulLimit', 'Foul limit points')}{num('foulAction', 'Action at limit', 'text')}
        </div>
      </div>
      <div className="card grid"><h3 className="full">Attendance time and teacher salary penalty</h3>
        {num('start', 'Class start time', 'time')}{num('grace', 'Grace minutes (late after)')}{num('lateFine', 'Fine per late minute')}{num('workDays', 'Working days / month')}{num('absentLimit', 'Warn when absent more than (days / month)')}{num('lateLimit', 'Late report limit (days / month)')}{num('dersLines', 'Lines per ders (Qaeda)')}{num('rewardText', 'Reward text', 'text')}{num('otRate', 'Overtime pay per hour')}
      </div>
      <div className="card"><button className="btn red" onClick={() => window.confirm('Delete ALL data?') && (localStorage.removeItem('madrasa_db2'), window.location.reload())}>Reset all data</button></div>
    </div>
  );
}
