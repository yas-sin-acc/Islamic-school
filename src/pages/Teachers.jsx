import { useState } from 'react';
import { F, find, today, readPhoto, cname, userTaken } from '../ui.jsx';
import IdCards from '../components/IdCards.jsx';
import PhotoField from '../components/PhotoField.jsx';

export default function Teachers({ db, set }) {
  const s = db.settings;
  const blank = () => ({
    name: '', photo: '', sex: 'Male', age: '', married: 'Single', address: '', phone: '', hafiz: 'No', juz: '',
    kitabs: '', education: '', experience: '', idNo: '', startDate: today(), classId: s.classes[0]?.id,
    username: '', password: '1234', salary: 0, fp: '', info: '', special: '',
    transport: 0, home: 0, years: '', ijazah: '', teachCert: '', subjects: '', prevWork: '', languages: '', reference: '',
  });
  const [f, setF] = useState(blank());
  const [q, setQ] = useState('');
  const [view, setView] = useState(null);
  const [ids, setIds] = useState(null);
  const on = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = (e) => {
    e.preventDefault();
    if (userTaken(db, f.username, f.id)) return window.alert('Username already used.');
    if (f.id) set('teachers', (a) => a.map((x) => (x.id === f.id ? f : x)));
    else set('teachers', (a) => [...a, { ...f, id: 'T' + Date.now().toString().slice(-6) }]);
    setF(blank());
  };
  const del = (id) => window.confirm('Delete teacher?') && set('teachers', (a) => a.filter((x) => x.id !== id));
  const list = db.teachers.filter((t) => find(t, q));
  const items = (l) => l.map((t) => ({ id: t.id, name: t.name, photo: t.photo, foot: `Staff ID · ${s.year}`, lines: [t.sex === 'Female' ? 'Ustaza' : 'Ustaz', 'Class: ' + cname(db, t.classId), 'Tel: ' + t.phone] }));
  const labels = { sex: 'Sex', age: 'Age', married: 'Marital status', address: 'Living area', phone: 'Phone', hafiz: 'Quran hafiz', juz: 'Juz memorized', kitabs: 'Kitabs', education: 'Learning background', experience: 'Experience', years: 'Years of experience', ijazah: 'Ijazah / sanad', teachCert: 'Certificates & training', subjects: 'Subjects', special: 'Specialization', prevWork: 'Previous workplaces', languages: 'Languages', reference: 'Reference', transport: 'Transport allowance', home: 'Home allowance', idNo: 'ID number', startDate: 'Start date', salary: 'Monthly salary', fp: 'Fingerprint ID', info: 'Other info' };
  return (
    <div>
      <form className="card grid" onSubmit={save}>
        <h3 className="full">{f.id ? 'Edit teacher' : 'Teacher registration'}</h3>
        <PhotoField value={f.photo} onChange={(p) => setF({ ...f, photo: p })} />
        <F label="Full name"><input required value={f.name} onChange={on('name')} /></F>
        <F label="Sex"><select value={f.sex} onChange={on('sex')}><option>Male</option><option>Female</option></select></F>
        <F label="Age"><input type="number" value={f.age} onChange={on('age')} /></F>
        <F label="Marital status"><select value={f.married} onChange={on('married')}><option>Single</option><option>Married</option><option>Divorced</option><option>Widowed</option></select></F>
        <F label="Living area / address"><input value={f.address} onChange={on('address')} /></F>
        <F label="Phone"><input value={f.phone} onChange={on('phone')} /></F>
        <F label="Quran hafiz?"><select value={f.hafiz} onChange={on('hafiz')}><option>No</option><option>Yes (full)</option><option>Partial</option></select></F>
        <F label="Juz memorized"><input type="number" min="0" max="30" value={f.juz} onChange={on('juz')} /></F>
        <F label="Kitabs studied"><input value={f.kitabs} onChange={on('kitabs')} /></F>
        <F label="Learning background (schools, mashayikh)"><textarea value={f.education} onChange={on('education')} /></F>
        <F label="Teaching experience"><textarea value={f.experience} onChange={on('experience')} /></F>
        <F label="Years of teaching experience"><input type="number" value={f.years} onChange={on('years')} /></F>
        <F label="Ijazah / sanad (Quran chain, riwaya)"><input value={f.ijazah} onChange={on('ijazah')} /></F>
        <F label="Teaching certificates & training"><textarea value={f.teachCert} onChange={on('teachCert')} /></F>
        <F label="Subjects able to teach"><input value={f.subjects} onChange={on('subjects')} /></F>
        <F label="Specialization (course group)"><input list="coursesList" value={f.special} onChange={on('special')} /></F>
        <datalist id="coursesList">{[...new Set(s.classes.flatMap((c) => c.courses))].map((c) => <option key={c} value={c} />)}</datalist>
        <F label="Previous workplaces"><input value={f.prevWork} onChange={on('prevWork')} /></F>
        <F label="Languages spoken"><input value={f.languages} onChange={on('languages')} /></F>
        <F label="Reference person & phone"><input value={f.reference} onChange={on('reference')} /></F>
        <F label="ID number (national / kebele)"><input value={f.idNo} onChange={on('idNo')} /></F>
        <F label="Start date"><input type="date" value={f.startDate} onChange={on('startDate')} /></F>
        <F label="Class he/she teaches"><select value={f.classId} onChange={on('classId')}>{s.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></F>
        <F label="Monthly salary"><input type="number" value={f.salary} onChange={on('salary')} /></F>
        <F label="Transport allowance"><input type="number" value={f.transport} onChange={on('transport')} /></F>
        <F label="Home allowance"><input type="number" value={f.home} onChange={on('home')} /></F>
        <F label="Login username"><input required value={f.username} onChange={on('username')} /></F>
        <F label="Login password"><input required value={f.password} onChange={on('password')} /></F>
        <F label="Fingerprint ID (empty = teacher ID)"><input value={f.fp} onChange={on('fp')} /></F>
        <F label="Other info"><textarea value={f.info} onChange={on('info')} /></F>
        <div className="full"><button className="btn">Save</button> {f.id && <button type="button" className="btn gray" onClick={() => setF(blank())}>Cancel</button>}</div>
      </form>
      <input className="search" placeholder="🔍 Search teachers..." value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="card scroll"><table>
        <thead><tr><th></th><th>ID</th><th>Name</th><th>Sex</th><th>Age</th><th>Marital</th><th>Hafiz</th><th>Class</th><th>Phone</th><th></th></tr></thead>
        <tbody>{list.map((t) => (
          <tr key={t.id}>
            <td>{t.photo && <img className="th" src={t.photo} alt="" />}</td><td>{t.id}</td>
            <td><a href="#v" onClick={(e) => { e.preventDefault(); setView(t); }}>{t.name}</a></td>
            <td>{t.sex}</td><td>{t.age}</td><td>{t.married}</td><td>{t.hafiz}</td><td>{cname(db, t.classId)}</td><td>{t.phone}</td>
            <td><button className="btn sm" onClick={() => { setF(t); window.scrollTo(0, 0); }}>Edit</button>{' '}
              <button className="btn sm gray" onClick={() => setIds(items([t]))}>ID</button>{' '}
              <button className="btn red sm" onClick={() => del(t.id)}>X</button></td>
          </tr>))}</tbody>
      </table></div>
      {view && (
        <div className="card">
          <div className="row"><h3 style={{ flex: 1 }}>{view.name} – full information</h3><button className="btn gray sm" onClick={() => setView(null)}>Close</button></div>
          <div className="grid">{Object.entries(labels).map(([k, l]) => <div key={k}><small>{l}</small><br /><b>{view[k] || '-'}</b></div>)}</div>
        </div>
      )}
      {ids && <IdCards school={s.school} logo={s.logo} width={+s.idWidth || 95} items={ids} onClose={() => setIds(null)} />}
    </div>
  );
}
