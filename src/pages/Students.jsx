import { useState } from 'react';
import { F, find, today, readPhoto, deptOf, cname, userTaken, canSeePhoto, planTarget } from '../ui.jsx';
import IdCards from '../components/IdCards.jsx';
import PhotoField from '../components/PhotoField.jsx';

export default function Students({ db, set, user, head, students, go }) {
  const s = db.settings;
  const blank = () => ({
    name: '', age: '', gender: 'Male', photo: '', classId: s.classes[0]?.id, juz: '', kitabs: '', family: '',
    address: '', phone: '', status: s.statuses[0], discount: 0, school: '', info: '', fp: '', date: today(), puser: '', ppass: '', planGoal: 30, planStart: '', planYears: '', planMonths: '', planDone: '',
  });
  const [mode, setMode] = useState('new');
  const [f, setF] = useState(blank());
  const [q, setQ] = useState('');
  const [ids, setIds] = useState(null);
  const [open, setOpen] = useState({});
  const [cc, setCc] = useState({ sid: '', to: '', reason: '' });
  const on = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const count = (cid, self) => db.students.filter((x) => x.classId === cid && x.id !== self).length;
  const toItems = (list) => list.map((x) => ({
    id: x.id, name: x.name, photo: canSeePhoto(user, x) ? x.photo : '', foot: `Student ID · Academic year ${s.year}`,
    extra: x.puser ? `👪 User: ${x.puser} · Pass: ${x.ppass}` : 'Parent login: not set',
    lines: [deptOf(db, x.classId)?.name, 'Class: ' + cname(db, x.classId), `${x.gender} · Age ${x.age}`, 'Tel: ' + x.phone],
  }));
  const save = (e) => {
    e.preventDefault();
    if (f.puser && userTaken(db, f.puser, f.id)) return window.alert('This parent username is already used. Choose another.');
    if (f.ppass && db.students.some((x) => x.id !== f.id && x.ppass === f.ppass)) return window.alert('This password is used by another student. Choose a different one.');
    if (count(f.classId, f.id) >= +s.maxClass) return window.alert(`This class is full (${s.maxClass} students).`);
    const rec = { ...f, planStart: f.planStart || ((+f.planYears || +f.planMonths) ? f.date : '') };
    if (f.id) set('students', (a) => a.map((x) => (x.id === f.id ? { ...x, ...rec } : x)));
    else set('students', (a) => [...a, { ...rec, id: 'S' + Date.now().toString().slice(-6) }]);
    setF(blank());
  };
  const gen = () => {
    let u, p;
    do { u = 'p' + Math.floor(1000 + Math.random() * 9000); } while (userTaken(db, u, f.id));
    do { p = Math.random().toString(36).slice(2, 8); } while (db.students.some((x) => x.id !== f.id && x.ppass === p));
    setF({ ...f, puser: u, ppass: p });
  };
  const del = (id) => window.confirm('Delete student?') && set('students', (a) => a.filter((x) => x.id !== id));
  const doChange = (e) => {
    e.preventDefault();
    const st = db.students.find((x) => x.id === cc.sid);
    if (!st || !cc.to) return;
    if (!cc.reason.trim()) return window.alert('A reason is required to change class.');
    if (count(cc.to, st.id) >= +s.maxClass) return window.alert('Target class is full.');
    set('students', (a) => a.map((x) => (x.id === st.id ? { ...x, classId: cc.to, history: [...(x.history || []), { date: today(), from: x.classId, to: cc.to, reason: cc.reason.trim() }] } : x)));
    setCc({ sid: '', to: '', reason: '' });
  };
  const log = db.students.flatMap((x) => (x.history || []).map((h) => ({ ...h, name: x.name }))).sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 20);
  return (
    <div>
      <input className="search" placeholder="🔍 Search by name, phone, class, family, ID..." value={q} onChange={(e) => setQ(e.target.value)} />
      {head && (
        <div className="card row">
          <button className={`btn ${mode === 'new' ? '' : 'gray'}`} onClick={() => setMode('new')}>New registration</button>
          <button className={`btn ${mode === 'change' ? 'gold' : 'gray'}`} onClick={() => setMode('change')}>Change class</button>
        </div>
      )}
      {head && mode === 'new' && !q && (
        <form className="card grid" onSubmit={save}>
          <h3 className="full">{f.id ? 'Edit student' : 'New registration'}</h3>
          <div className="full">
            {!canSeePhoto(user, f) && <small className="note">Female student photos can be added only by a female director or ustaza.</small>}
            <PhotoField value={canSeePhoto(user, f) ? f.photo : ''} disabled={!canSeePhoto(user, f)} onChange={(p) => setF({ ...f, photo: p })} />
          </div>
          <F label="Full name"><input required value={f.name} onChange={on('name')} /></F>
          <F label="Age"><input type="number" value={f.age} onChange={on('age')} /></F>
          <F label="Gender"><select value={f.gender} onChange={on('gender')}><option>Male</option><option>Female</option></select></F>
          <F label="Department / Class (max per class)">
            <select disabled={!!f.id} value={f.classId} onChange={on('classId')}>
              {s.departments.map((d) => (
                <optgroup key={d.id} label={d.name}>
                  {s.classes.filter((c) => c.dept === d.id).map((c) => (
                    <option key={c.id} value={c.id} disabled={count(c.id, f.id) >= +s.maxClass}>{c.name} ({count(c.id, f.id)}/{s.maxClass})</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </F>
          <F label="Juz (1-30)"><input type="number" min="0" max="30" value={f.juz} onChange={on('juz')} /></F>
          <F label="Completed kitabs"><input value={f.kitabs} onChange={on('kitabs')} /></F>
          <F label="Family name"><input value={f.family} onChange={on('family')} /></F>
          <F label="Address"><input value={f.address} onChange={on('address')} /></F>
          <F label="Phone"><input value={f.phone} onChange={on('phone')} /></F>
          <F label="Status"><select value={f.status} onChange={on('status')}>{s.statuses.map((l) => <option key={l}>{l}</option>)}</select></F>
          <F label="Monthly fee discount % (poor cover)"><input type="number" min="0" max="100" value={f.discount} onChange={on('discount')} /></F>
          <F label="Academic school name"><input value={f.school} onChange={on('school')} /></F>
          <F label="Registration date (fees start)"><input type="date" value={f.date} onChange={on('date')} /></F>
          <F label="Fingerprint ID (empty = student ID)"><input value={f.fp} onChange={on('fp')} /></F>
          <F label="Parent username (unique)"><input value={f.puser} onChange={on('puser')} /></F>
          <F label="Parent password (unique)"><input value={f.ppass} onChange={on('ppass')} /></F>
          <div className="full"><button type="button" className="btn gray sm" onClick={gen}>Generate parent login</button></div>
          <div className="full"><b>📖 Quran completion plan</b> <small>(leave empty = no plan)</small></div>
          <F label="Plan goal (juz to complete)"><input type="number" min="1" max="30" value={f.planGoal} onChange={on('planGoal')} /></F>
          <F label="Plan start date"><input type="date" value={f.planStart} onChange={on('planStart')} /></F>
          <F label="Plan duration (years)"><input type="number" min="0" value={f.planYears} onChange={on('planYears')} /></F>
          <F label="Plan duration (months)"><input type="number" min="0" max="11" value={f.planMonths} onChange={on('planMonths')} /></F>
          {(+f.planYears || +f.planMonths) ? <div className="full note">Target date: {planTarget({ ...f, planStart: f.planStart || f.date })}</div> : null}
          <F label="Additional info"><textarea value={f.info} onChange={on('info')} /></F>
          <div className="full"><button className="btn">Save</button> {f.id && <button type="button" className="btn gray" onClick={() => setF(blank())}>Cancel</button>}</div>
        </form>
      )}
      {head && mode === 'change' && !q && (
        <div>
          <form className="card grid" onSubmit={doChange}>
            <h3 className="full">Change class</h3>
            <F label="Student">
              <select required value={cc.sid} onChange={(e) => setCc({ ...cc, sid: e.target.value })}>
                <option value="">Select student</option>
                {db.students.map((x) => <option key={x.id} value={x.id}>{x.name} ({x.id}) – {cname(db, x.classId)}</option>)}
              </select>
            </F>
            <F label="New class">
              <select required value={cc.to} onChange={(e) => setCc({ ...cc, to: e.target.value })}>
                <option value="">Select class</option>
                {s.classes.filter((c) => c.id !== db.students.find((x) => x.id === cc.sid)?.classId).map((c) => (
                  <option key={c.id} value={c.id} disabled={count(c.id) >= +s.maxClass}>{deptOf(db, c.id)?.name} - {c.name} ({count(c.id)}/{s.maxClass})</option>
                ))}
              </select>
            </F>
            <F label="Reason for change (required)"><textarea required value={cc.reason} onChange={(e) => setCc({ ...cc, reason: e.target.value })} /></F>
            <div className="full"><button className="btn gold">Change class</button></div>
          </form>
          <div className="card scroll"><h3>Class change history</h3><table>
            <thead><tr><th>Date</th><th>Student</th><th>From</th><th>To</th><th>Reason</th></tr></thead>
            <tbody>{log.map((h, i) => <tr key={i}><td>{h.date}</td><td>{h.name}</td><td>{cname(db, h.from)}</td><td>{cname(db, h.to)}</td><td>{h.reason}</td></tr>)}</tbody></table></div>
        </div>
      )}
      {!head && <p className="note">View only: registered students of your class.</p>}
      {s.departments.map((d) => s.classes.filter((c) => c.dept === d.id).map((c) => {
        const all = students.filter((x) => x.classId === c.id);
        const rows = all.filter((x) => find({ ...x, cls: cname(db, x.classId) }, q));
        if ((q && !rows.length) || (!head && !all.length)) return null;
        const isOpen = q ? true : !!open[c.id];
        return (
          <div className="card" key={c.id}>
            <div className="row clsh" onClick={() => setOpen({ ...open, [c.id]: !open[c.id] })}>
              <h3 style={{ flex: 1, margin: 0 }}>{isOpen ? '▾' : '▸'} {d.name} › {c.name}</h3>
              <b>{all.length}/{s.maxClass}</b>
              {head && isOpen && rows.length > 0 && <button className="btn sm" onClick={(e) => { e.stopPropagation(); setIds(toItems(rows)); }}>Print all IDs</button>}
            </div>
            {isOpen && (
              <div className="scroll"><table>
                <thead><tr><th></th><th>ID</th><th>Name</th><th>Age</th><th>Juz</th><th>Family</th><th>Phone</th><th>Status</th>{head && <th></th>}</tr></thead>
                <tbody>{rows.map((x) => (
                  <tr key={x.id}>
                    <td>{x.photo && canSeePhoto(user, x) && <img className="th" src={x.photo} alt="" />}</td><td>{x.id}</td><td>{x.name}</td><td>{x.age}</td><td>{x.juz}</td><td>{x.family}</td><td>{x.phone}</td><td>{x.status}</td>
                    {head && <td>
                      <button className="btn sm" onClick={() => { setF(x); setMode('new'); window.scrollTo(0, 0); }}>Edit</button>{' '}
                      <button className="btn sm gray" onClick={() => setIds(toItems([x]))}>ID</button>{' '}
                      <button className="btn sm gold" onClick={() => { setCc({ sid: x.id, to: '', reason: '' }); setMode('change'); window.scrollTo(0, 0); }}>Change class</button>{' '}
                      <button className="btn sm" onClick={() => go('fin', x.id)}>💰 Finance</button>{' '}
                      <button className="btn red sm" onClick={() => del(x.id)}>X</button>
                    </td>}
                  </tr>
                ))}</tbody>
              </table></div>
            )}
          </div>
        );
      }))}
      {ids && <IdCards school={s.school} logo={s.logo} width={+s.idWidth || 95} items={ids} onClose={() => setIds(null)} />}
    </div>
  );
}
