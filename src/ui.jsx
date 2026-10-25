import { useState, useEffect } from 'react';
import { SURAS } from './data/suras.js';
import { createPortal } from 'react-dom';
import { getLang } from './i18n.js';
const pad = (n) => String(n).padStart(2, '0');
export const dstr = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const today = () => dstr(); // real local date
export const nowTime = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
export const uid = () => Math.random().toString(36).slice(2, 8);
export const mins = (t) => { const [h, m] = (t || '0:0').split(':').map(Number); return h * 60 + m; };
export const cname = (db, id) => db.settings.classes.find((c) => c.id === id)?.name || '-';
export const deptOf = (db, classId) => db.settings.departments.find((d) => d.id === db.settings.classes.find((c) => c.id === classId)?.dept);
export const F = ({ label, children }) => (<label className="f"><span>{label}</span>{children}</label>);
export const find = (o, q) => JSON.stringify(Object.values(o)).toLowerCase().includes(q.toLowerCase());
export const monthsBetween = (a, b) => {
  const r = []; let [y, m] = a.split('-').map(Number); const [ey, em] = b.split('-').map(Number);
  while (y < ey || (y === ey && m <= em)) { r.push(`${y}-${pad(m)}`); m++; if (m > 12) { m = 1; y++; } }
  return r;
};
// live clock + a "today" value that follows the real date by itself
const LOC = { en: undefined, am: 'am-ET', ar: 'ar' };
export function Clock() {
  const [n, setN] = useState(new Date());
  useEffect(() => { const i = setInterval(() => setN(new Date()), 1000); return () => clearInterval(i); }, []);
  return <span>{n.toLocaleDateString(LOC[getLang()], { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })} · {n.toLocaleTimeString(LOC[getLang()])}</span>;
}
export function useToday() {
  const [t, setT] = useState(today());
  useEffect(() => { const i = setInterval(() => setT(today()), 15000); return () => clearInterval(i); }, []);
  return t;
}
export const readPhoto = (file, cb, fmt = 'image/jpeg', w = 240) => {
  const r = new FileReader();
  r.onload = () => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = w; c.height = Math.round((img.height * w) / img.width);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); cb(c.toDataURL(fmt, 0.85));
    };
    img.src = r.result;
  };
  r.readAsDataURL(file);
};
export const rule = (db, id) => db.settings.rules.find((r) => r.id === id) || { points: 0 };
export const foulPts = (db, sid) => db.disc.filter((d) => d.sid === sid).reduce((a, d) => a + +rule(db, d.rid).points, 0);
export const alerts = (db, students) =>
  students.map((st) => ({ st, pts: foulPts(db, st.id) })).filter((x) => x.pts >= +db.settings.foulWarn).sort((a, b) => b.pts - a.pts);
// courses can be different for every term/semester (class.tc[termId]); falls back to the default list
export const coursesOf = (cls, term) => (cls.tc && cls.tc[term]) || cls.courses;
// comma-separated text input that keeps what you type (commas and spaces work normally)
export function Csv({ value, onChange, ...p }) {
  const [t, setT] = useState(value.join(', '));
  return <input {...p} value={t} onChange={(e) => { setT(e.target.value); onChange(e.target.value.split(',').map((x) => x.trim()).filter(Boolean)); }} />;
}
export const weekStart = (d) => { const x = new Date(d + 'T00:00'); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return dstr(x); };
export const planIsNow = (p, now) =>
  p.period === 'Daily' ? p.date === now : p.period === 'Weekly' ? weekStart(p.date) === weekStart(now)
  : p.period === 'Monthly' ? p.date.slice(0, 7) === now.slice(0, 7) : p.date.slice(0, 4) === now.slice(0, 4);
// a login username must be unique across directors, teachers, finance staff and parents
export const userTaken = (db, u, except) => !!u && (
  db.settings.directors.some((d) => d.user === u) ||
  db.teachers.some((t) => t.username === u && t.id !== except) ||
  db.fstaff.some((t) => t.username === u && t.id !== except) ||
  db.students.some((x) => x.puser === u && x.id !== except));

// overlays are rendered straight into <body> so printing shows only the overlay
export const Overlay = ({ children }) => createPortal(<div className="overlay">{children}</div>, document.body);
// female student photos: only a female director / ustaza (or the child's own parent) may see or add them
export const dirSex = (d) => d.sex || (d.id === 'df' || /female/i.test(d.name) ? 'Female' : 'Male');
export const canSeePhoto = (user, st) => st.gender !== 'Female' || user.role === 'parent' || ((user.role === 'head' || user.role === 'teacher') && user.sex === 'Female');
// students absent more than the limit (days) in the current month; and whether already warned
export const absAlerts = (db, students, now) => {
  const m = now.slice(0, 7); const lim = +db.settings.absentLimit || 3;
  return students.map((st) => ({ st, n: db.daily.filter((d) => d.sid === st.id && d.att === 'Absent' && d.date.startsWith(m)).length })).filter((x) => x.n > lim);
};
export const absWarned = (db, sid, m) => db.disc.some((d) => d.absKey === `${sid}|${m}`);
// ---- Quran completion plan helpers ----
export const addMonths = (d, n) => { const x = new Date(d + 'T00:00'); x.setMonth(x.getMonth() + n); return dstr(x); };
export const daysBetween = (a, b) => Math.round((new Date(b + 'T00:00') - new Date(a + 'T00:00')) / 864e5);
export const planTarget = (st) => (st.planStart ? addMonths(st.planStart, (+st.planYears || 0) * 12 + (+st.planMonths || 0)) : '');
export const planStatus = (st, now) => {
  const t = planTarget(st);
  if (!t) return st.planDone ? { k: 'noplan', t: '', days: 0, done: st.planDone } : null;
  if (st.planDone) { const d = daysBetween(st.planDone, t); return { k: d > 0 ? 'early' : d === 0 ? 'ontime' : 'late', t, days: d, done: st.planDone }; }
  const left = daysBetween(now, t); return { k: left >= 0 ? 'left' : 'overdue', t, days: left };
};
export const planMessage = (st, now) => {
  const p = planStatus(st, now); if (!p) return null; const n = Math.abs(p.days);
  if (p.k === 'left') return { k: p.k, n, txt: 'days remain to complete the Quran plan' };
  if (p.k === 'overdue') return { k: p.k, n, txt: 'The student has not completed the plan by time – days past the plan date' };
  if (p.k === 'early') return { k: p.k, n, txt: 'days early – great plan achievement! 🏆' };
  if (p.k === 'ontime') return { k: p.k, txt: 'Completed exactly by the plan 🏆' };
  if (p.k === 'noplan') return { k: p.k, txt: 'Completed the Quran – congratulations 🏆' };
  return { k: p.k, n, txt: 'days after the plan date – completed late' };
};
export const curJuz = (db, st) => {
  const r = db.daily.filter((d) => d.sid === st.id && d.juz).sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  return r ? +r.juz : +st.juz || 0;
};
export const lessonText = (d) => (d.ders ? `Ders ${d.ders} · Line ${d.line || '-'}`
  : (d.juz || d.sura || d.page) ? [d.juz && `Juz ${d.juz}`, d.sura && `${d.sura}. ${SURAS[d.sura - 1]?.[0]}`, d.page && `Page ${d.page}`].filter(Boolean).join(' · ') : d.hifz || '');
