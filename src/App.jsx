import { useState, useEffect } from 'react';
import { defaults } from './config.js';
import { Clock, alerts, useToday, planIsNow, dstr, dirSex, absAlerts, absWarned, mins, nowTime, planStatus, daysBetween } from './ui.jsx';
import { setLang } from './i18n.js';
import Students from './pages/Students.jsx';
import Teachers from './pages/Teachers.jsx';
import Staff from './pages/Staff.jsx';
import Plans from './pages/Plans.jsx';
import Daily from './pages/Daily.jsx';
import Exams from './pages/Exams.jsx';
import Discipline from './pages/Discipline.jsx';
import Finance from './pages/Finance.jsx';
import Settings from './pages/Settings.jsx';
import Parent from './pages/Parent.jsx';
import Dashboard from './pages/Dashboard.jsx';
import QPlans from './pages/QPlans.jsx';
import Messages from './pages/Messages.jsx';
import Celebrate from './components/Celebrate.jsx';

const load = () => {
  try {
    const s = JSON.parse(localStorage.getItem('madrasa_db2'));
    if (!(s && s.v === 2)) return defaults;
    const d = { ...defaults, ...s, settings: { ...defaults.settings, ...s.settings } };
    const have = new Set(d.settings.terms.map((t) => t.id)); // make sure Term 3 and Term 4 exist
    d.settings = { ...d.settings, terms: [...d.settings.terms, ...defaults.settings.terms.filter((t) => !have.has(t.id))] };
    return d;
  } catch { return defaults; }
};
const home = (r) => (r === 'head' ? 'students' : r === 'teacher' ? 'plans' : r === 'finance' ? 'fin' : 'parent');

function Scene() {
  return (
    <svg className="scene" viewBox="0 0 800 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <path d="M640 40a26 26 0 1 0 22 44a20 20 0 1 1-22-44z" fill="#f6e08b" />
      {[[80, 40], [180, 90], [300, 30], [470, 60], [560, 25], [720, 110], [40, 130]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2" fill="#fff" />)}
      <g fill="#06281c">
        <path d="M300 230A100 100 0 0 1 500 230V260H300Z" /><rect x="396" y="112" width="8" height="22" /><circle cx="400" cy="108" r="6" />
        <path d="M180 250A50 50 0 0 1 280 250V260H180Z" /><path d="M520 250A50 50 0 0 1 620 250V260H520Z" />
        <rect x="120" y="120" width="22" height="140" /><path d="M116 120L131 90L146 120Z" />
        <rect x="660" y="120" width="22" height="140" /><path d="M656 120L671 90L686 120Z" />
        <rect x="0" y="255" width="800" height="45" />
      </g>
      <g fill="#e8c872">{[330, 380, 430].map((x) => <path key={x} d={`M${x} 260v-25a12 12 0 0 1 24 0v25z`} />)}</g>
    </svg>
  );
}

function LangSelect({ lang, onLang }) {
  return <select className="lang" value={lang} onChange={(e) => onLang(e.target.value)}><option value="en">English</option><option value="am">አማርኛ</option><option value="ar">العربية</option></select>;
}

function Login({ db, onLogin, lang, onLang }) {
  const [u, setU] = useState(''); const [p, setP] = useState(''); const [err, setErr] = useState('');
  const go = (e) => {
    e.preventDefault();
    const d = db.settings.directors.find((x) => x.user === u && x.pass === p);
    if (d) return onLogin({ role: 'head', name: d.name, id: d.id, sex: dirSex(d) });
    const t = db.teachers.find((x) => x.username === u && x.password === p);
    if (t) return onLogin({ role: 'teacher', name: t.name, classId: t.classId, id: t.id, sex: t.sex });
    const f = db.fstaff.find((x) => x.username === u && x.password === p);
    if (f) return onLogin({ role: 'finance', name: f.name, id: f.id, sex: f.sex });
    const st = db.students.find((x) => x.puser && x.puser === u && x.ppass === p);
    if (st) return onLogin({ role: 'parent', name: 'Parent of ' + st.name, sid: st.id, id: 'P' + st.id });
    setErr('Wrong username or password');
  };
  return (
    <div className="loginbg">
      <LangSelect lang={lang} onLang={onLang} />
      <Scene />
      <div className="welcome">
        <div className="bis">بسم الله الرحمن الرحيم</div>
        <h1>Welcome · Ahlan wa Sahlan</h1>
        <p>{db.settings.school}</p>
      </div>
      <form className="card login" onSubmit={go}>
        <input placeholder="Username" value={u} onChange={(e) => setU(e.target.value)} />
        <input placeholder="Password" type="password" value={p} onChange={(e) => setP(e.target.value)} />
        {err && <p className="err">{err}</p>}
        <button className="btn">Login</button>
      </form>
    </div>
  );
}

export default function App() {
  const [db, setDb] = useState(load);
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('students');
  const [focus, setFocus] = useState('');
  const [showN, setShowN] = useState(false);
  const [seen, setSeen] = useState(false);
  const now = useToday();
  const [lang, setLangS] = useState(localStorage.getItem('madrasa_lang') || 'en');
  useEffect(() => { localStorage.setItem('madrasa_lang', lang); setLang(lang); }, [lang]);
  useEffect(() => { localStorage.setItem('madrasa_db2', JSON.stringify(db)); }, [db]);
  const set = (k, v) => setDb((d) => ({ ...d, [k]: typeof v === 'function' ? v(d[k]) : v }));
  if (!user) return <Login db={db} lang={lang} onLang={setLangS} onLogin={(u) => { setUser(u); setSeen(false); setPage(home(u.role)); }} />;
  const role = user.role; const head = role === 'head';
  const students = head || role === 'finance' ? db.students : role === 'parent' ? db.students.filter((x) => x.id === user.sid) : db.students.filter((x) => x.classId === user.classId);
  const go = (p, f = '') => { setFocus(f); setPage(p); };
  const ctx = { db, set, user, head, students, go, focus };
  const staff = head || role === 'teacher';
  const al = staff ? alerts(db, students) : [];
  const hot = al.filter((a) => a.pts >= +db.settings.foulLimit);
  const todo = db.plans.filter((p) => p.owner === user.id && !p.done && planIsNow(p, now)).length;
  const in7 = dstr(new Date(Date.now() + 7 * 864e5));
  const rem = role === 'parent' ? [] : db.plans.filter((p) => p.role === 'head' && p.kind !== 'Plan' && p.date >= now && p.date <= in7 && !p.done).sort((a, b) => (a.date > b.date ? 1 : -1));
  const mo = now.slice(0, 7);
  const abNew = staff ? absAlerts(db, students, now).filter((x) => !absWarned(db, x.st.id, mo)) : [];
  const todayRecs = db.daily.filter((d) => d.date === now && students.some((x) => x.id === d.sid));
  const qs = students.map((st) => ({ st, ps: planStatus(st, now) })).filter((x) => x.ps);
  // celebration pop-up: parent 7 days, teacher 3 days, director 1 day after the plan was achieved
  const win = role === 'parent' ? 7 : role === 'teacher' ? 3 : head ? 1 : 0;
  const cel = win ? qs.filter((x) => x.ps.k !== 'left' && x.ps.k !== 'overdue' && daysBetween(x.ps.done, now) <= win).map((x) => ({ id: x.st.id, name: x.st.name, k: x.ps.k })) : [];
  const notes = !staff ? [] : [
    ...abNew.map((x) => ({ a: `⚠ ${x.st.name} · ${x.n}`, b: 'days absent this month', p: 'disc' })),
    ...hot.map((h) => ({ a: `🚨 ${h.st.name} · ${h.pts}`, b: 'points – foul limit reached', p: 'disc' })),
    ...(todayRecs.filter((d) => d.att === 'Absent').length ? [{ a: String(todayRecs.filter((d) => d.att === 'Absent').length), b: 'students absent today', p: 'daily' }] : []),
    ...(todayRecs.filter((d) => d.att === 'Late').length ? [{ a: String(todayRecs.filter((d) => d.att === 'Late').length), b: 'students late today', p: 'daily' }] : []),
    ...(role === 'teacher' && students.length && !todayRecs.length && mins(nowTime()) >= mins(db.settings.start) ? [{ a: '📋', b: 'Attendance not recorded yet today', p: 'daily' }] : []),
    ...qs.filter((x) => x.ps.k === 'overdue').map((x) => ({ a: `⏰ ${x.st.name} · ${-x.ps.days}`, b: 'days past the Quran plan date', p: 'qplans' })),
    ...qs.filter((x) => x.ps.k === 'left' && x.ps.days <= 30).map((x) => ({ a: `📖 ${x.st.name} · ${x.ps.days}`, b: 'days left in Quran plan', p: 'qplans' })),
    ...(todo ? [{ a: String(todo), b: 'plans due now', p: 'plans' }] : []),
    ...rem.map((p) => ({ pre: p.kind, a: `· ${p.title} (${p.date})`, b: '', p: 'plans' })),
  ];
  const plansP = ['Plans' + (todo ? ` (${todo})` : ''), Plans];
  const discP = ['Discipline' + (al.length + abNew.length ? ` (${al.length + abNew.length})` : ''), Discipline];
  const pages = head ? {
    plans: plansP, dash: ['Dashboard', Dashboard], students: ['Registration', Students], teachers: ['Teachers', Teachers], staff: ['Finance staff', Staff],
    qplans: ['Quran plans', QPlans], daily: ['Attendance', Daily], exams: ['Exams & Results', Exams], disc: discP, msgs: ['Message center', Messages],
    fin: ['Finance', Finance], set: ['Settings', Settings],
  } : role === 'teacher' ? { plans: plansP, dash: ['Dashboard', Dashboard], qplans: ['Quran plans', QPlans], daily: ['Attendance', Daily], exams: ['Exams & Results', Exams], disc: discP, msgs: ['Message center', Messages] }
    : role === 'finance' ? { fin: ['Finance', Finance], plans: plansP } : { parent: ['My child', Parent] };
  const P = (pages[page] || Object.values(pages)[0])[1];
  return (
    <div className={'pg pg-' + page}>
      <header className="top no-print">
        <b>{db.settings.logo && <img className="hlogo" src={db.settings.logo} alt="" />}{db.settings.school}</b>
        <small><Clock /></small>
        <LangSelect lang={lang} onLang={setLangS} />
        {staff && (
          <span className="bell"><button className="btn gray" onClick={() => setShowN(!showN)}>🔔 {notes.length}</button>
            {showN && <div className="notif">{notes.length
              ? notes.map((n, i) => <div key={i} onClick={() => { go(n.p); setShowN(false); }}>{n.pre} {n.a} {n.b}</div>)
              : <div>No notifications</div>}</div>}</span>
        )}
        <span>Welcome, {user.name} <button className="btn gray" onClick={() => setUser(null)}>Logout</button></span>
      </header>
      <nav className="nav no-print">
        {Object.entries(pages).map(([k, [n]]) => (
          <button key={k} data-k={k} className={page === k ? 'on' : ''} onClick={() => go(k)}>{n}</button>
        ))}
      </nav>
      {hot.length > 0 && (
        <div className="alert no-print" onClick={() => go('disc')}>
          ⚠ Foul limit reached: {hot.map((h) => h.st.name).join(', ')} — tap to open Discipline
        </div>
      )}
      {rem.length > 0 && (
        <div className="alert blue no-print" onClick={() => go('plans')}>
          📌 Coming up: {rem.slice(0, 3).map((p) => `${p.kind} – ${p.title} (${p.date})`).join(' · ')}
        </div>
      )}
      <main><P {...ctx} /></main>
      {cel.length > 0 && !seen && <Celebrate items={cel} reward={db.settings.rewardText} onClose={() => setSeen(true)} />}
    </div>
  );
}
