import { useState } from 'react';
import { F, find, today, readPhoto, userTaken } from '../ui.jsx';
import IdCards from '../components/IdCards.jsx';
import PhotoField from '../components/PhotoField.jsx';

// Finance employees: 0, 1, 2 ... any number. They log in and see only Finance + Plans.
export default function Staff({ db, set }) {
  const s = db.settings;
  const blank = () => ({ name: '', photo: '', sex: 'Male', age: '', phone: '', address: '', idNo: '', position: 'Cashier', startDate: today(), salary: 0, username: '', password: '1234', info: '' });
  const [f, setF] = useState(blank());
  const [q, setQ] = useState('');
  const [ids, setIds] = useState(null);
  const on = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = (e) => {
    e.preventDefault();
    if (userTaken(db, f.username, f.id)) return window.alert('Username already used.');
    if (f.id) set('fstaff', (a) => a.map((x) => (x.id === f.id ? f : x)));
    else set('fstaff', (a) => [...a, { ...f, id: 'F' + Date.now().toString().slice(-6) }]);
    setF(blank());
  };
  const del = (id) => window.confirm('Delete finance employee?') && set('fstaff', (a) => a.filter((x) => x.id !== id));
  const list = db.fstaff.filter((t) => find(t, q));
  return (
    <div>
      <form className="card grid" onSubmit={save}>
        <h3 className="full">{f.id ? 'Edit finance employee' : 'Finance employee registration'}</h3>
        <PhotoField value={f.photo} onChange={(p) => setF({ ...f, photo: p })} />
        <F label="Full name"><input required value={f.name} onChange={on('name')} /></F>
        <F label="Sex"><select value={f.sex} onChange={on('sex')}><option>Male</option><option>Female</option></select></F>
        <F label="Age"><input type="number" value={f.age} onChange={on('age')} /></F>
        <F label="Phone"><input value={f.phone} onChange={on('phone')} /></F>
        <F label="Living area / address"><input value={f.address} onChange={on('address')} /></F>
        <F label="ID number"><input value={f.idNo} onChange={on('idNo')} /></F>
        <F label="Position"><input value={f.position} onChange={on('position')} /></F>
        <F label="Start date"><input type="date" value={f.startDate} onChange={on('startDate')} /></F>
        <F label="Monthly salary"><input type="number" value={f.salary} onChange={on('salary')} /></F>
        <F label="Login username"><input required value={f.username} onChange={on('username')} /></F>
        <F label="Login password"><input required value={f.password} onChange={on('password')} /></F>
        <F label="Other info"><textarea value={f.info} onChange={on('info')} /></F>
        <div className="full"><button className="btn">Save</button> {f.id && <button type="button" className="btn gray" onClick={() => setF(blank())}>Cancel</button>}</div>
      </form>
      <input className="search" placeholder="🔍 Search finance staff..." value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="card scroll"><table>
        <thead><tr><th></th><th>ID</th><th>Name</th><th>Position</th><th>Sex</th><th>Age</th><th>Phone</th><th>Salary</th><th></th></tr></thead>
        <tbody>{list.map((t) => (
          <tr key={t.id}><td>{t.photo && <img className="th" src={t.photo} alt="" />}</td><td>{t.id}</td><td>{t.name}</td><td>{t.position}</td><td>{t.sex}</td><td>{t.age}</td><td>{t.phone}</td><td>{t.salary}</td>
            <td><button className="btn sm" onClick={() => { setF(t); window.scrollTo(0, 0); }}>Edit</button>{' '}
              <button className="btn sm gray" onClick={() => setIds([{ id: t.id, name: t.name, photo: t.photo, foot: `Staff ID · ${s.year}`, lines: [t.position, 'Tel: ' + t.phone] }])}>ID</button>{' '}
              <button className="btn red sm" onClick={() => del(t.id)}>X</button></td></tr>))}</tbody>
      </table>{!list.length && <p className="note">No finance employees yet.</p>}</div>
      {ids && <IdCards school={s.school} logo={s.logo} items={ids} width={+s.idWidth || 95} onClose={() => setIds(null)} />}
    </div>
  );
}
