import { useState } from 'react';
import { coursesOf, Overlay } from '../ui.jsx';

const kindOf = (s, cls, st, tpl) => (tpl && tpl !== 'auto' ? tpl : s.departments.find((d) => d.id === cls.dept)?.child ? 'q' : st.gender === 'Female' ? 'g' : 'b'); // q = Qaeda children, g = girls, b = boys
const TEMPLATES = [['auto', 'Automatic (by gender / Qaeda)'], ['q', 'Qaeda – Kaaba frame (portrait)'], ['g', 'Girls – red & gold'], ['b', 'Boys – teal & gold'], ['green', 'Classic green & gold'], ['blue', 'Royal blue & gold'], ['purple', 'Purple & rose'], ['dark', 'Black & gold']];

function CertView({ db, row, cls, courses, termName, tpl }) {
  const s = db.settings;
  const dept = s.departments.find((d) => d.id === cls.dept);
  const kind = kindOf(s, cls, row.st, tpl);
  const pass = row.avg >= s.pass;
  const chunks = [];
  for (let i = 0; i < courses.length; i += 5) chunks.push(courses.slice(i, i + 5).map((c, j) => [c, row.pc[i + j]]));
  const logo = s.logo ? <img src={s.logo} alt="" /> : <span>LOGO</span>;
  return (
    <div className={'certbox ' + (kind === 'q' ? 'P' : 'L')}>
      <div className={'cert ' + kind}>
        {kind !== 'q' && <div className="fr" />}
        {['g', 'purple'].includes(kind) && <div className="medal">{logo}</div>}
        <div className="cin">
          <div className="cs">{kind === 'q' && s.logo && <img className="qlogo" src={s.logo} alt="" />}{s.school}</div>
          <div className="ct">CERTIFICATE</div>
          <div className="cs">OF COMPLETION (SHAHADA)</div>
          <div className="cs small">This certificate is proudly presented to</div>
          <div className="cn">{row.st.name}</div>
          <div className="cp">{dept?.name} · {cls.name} · {s.year} · {termName}</div>
          <div className="ctab">{chunks.map((ch, i) => (
            <table key={i}><thead><tr><th>Subject</th><th>Result</th></tr></thead>
              <tbody>{ch.map(([c, p]) => <tr key={c}><td>{c}</td><td>{p.toFixed(0)}%</td></tr>)}</tbody></table>
          ))}</div>
          <div className="cp">Average <b>{row.avg.toFixed(1)}%</b> · Rank <b>{row.rank}</b> · <b>{pass ? 'PASSED' : 'NOT PASSED'}</b></div>
        </div>
        {kind !== 'q' && <div className="sg"><span>Teacher</span><span>Director</span></div>}
        {['b', 'green', 'blue', 'dark'].includes(kind) && <div className="seal">{s.logo && <img src={s.logo} alt="" />}</div>}
        {['g', 'purple'].includes(kind) && <div className="seal star">★</div>}
      </div>
    </div>
  );
}

function Certificate({ onClose, ...p }) {
  const portrait = kindOf(p.db.settings, p.cls, p.row.st, p.tpl) === 'q';
  return (
    <Overlay>
      <style>{`@page{size:A4 ${portrait ? 'portrait' : 'landscape'};margin:0}`}</style>
      <div className="wrapc">
        <CertView {...p} />
        <div className="no-print bar"><button className="btn" onClick={() => window.print()}>Print</button> <button className="btn gray" onClick={onClose}>Close</button></div>
      </div>
    </Overlay>
  );
}

const parsePages = (str, max) => {
  if (!str.trim()) return null;
  const set = new Set();
  str.split(',').forEach((p) => {
    const m = p.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (m) for (let i = Math.max(1, +m[1]); i <= Math.min(max, +(m[2] || m[1])); i++) set.add(i);
  });
  return set;
};

// every certificate on its own page, in rank order; choose page numbers to print only some
function Batch({ rows, onClose, ...p }) {
  const [pg, setPg] = useState('');
  const sel = parsePages(pg, rows.length);
  const portrait = rows[0] && kindOf(p.db.settings, p.cls, rows[0].st, p.tpl) === 'q';
  return (
    <Overlay>
      <style>{`@page{size:A4 ${portrait ? 'portrait' : 'landscape'};margin:0}`}</style>
      <div className="wrapc">
        <div className="no-print bar card">
          <b>All certificates by rank</b>{' '}
          <label>Pages to print (e.g. 1-3,5 — empty = all) <input className="sm" style={{ width: 120 }} value={pg} onChange={(e) => setPg(e.target.value)} /></label>{' '}
          <button className="btn" onClick={() => window.print()}>Print</button> <button className="btn gray" onClick={onClose}>Close</button>
        </div>
        {rows.map((r, i) => (
          <div key={r.st.id} className={'cpage ' + (portrait ? 'P' : 'L') + (sel && !sel.has(i + 1) ? ' skip' : '')}>
            <div className="no-print pgl">Page {i + 1} · Rank {r.rank} · {r.st.name}</div>
            <CertView {...p} row={r} />
          </div>
        ))}
      </div>
    </Overlay>
  );
}

// class result list (print -> "Save as PDF")
function Sheet({ db, rows, cls, courses, termName, onClose }) {
  const s = db.settings; const dept = s.departments.find((d) => d.id === cls.dept);
  return (
    <Overlay>
      <style>{'@page{size:A4 landscape;margin:10mm}'}</style>
      <div className="wrapc">
        <div className="no-print bar card"><button className="btn" onClick={() => window.print()}>Print / Save as PDF</button> <button className="btn gray" onClick={onClose}>Close</button><br /><small>Tip: choose "Save as PDF" as the printer in the print window.</small></div>
        <div className="sheet">
          <div className="shh">{s.logo && <img src={s.logo} alt="" />}<div><h2>{s.school}</h2><div>{s.address} {s.phone}</div></div></div>
          <h3>Result list · {dept?.name} · {cls.name} · {termName} · {s.year}</h3>
          <table>
            <thead><tr><th>Rank</th><th>ID</th><th>Name</th>{courses.map((c) => <th key={c}>{c}</th>)}<th>Average</th><th>Result</th></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.st.id}><td>{r.rank}</td><td>{r.st.id}</td><td>{r.st.name}</td>{r.pc.map((x, i) => <td key={i}>{x.toFixed(1)}</td>)}<td><b>{r.avg.toFixed(1)}</b></td><td>{r.avg >= s.pass ? 'Pass' : 'Fail'}</td></tr>
            ))}</tbody>
          </table>
          <div className="sg2"><span>Teacher</span><span>Director</span></div>
        </div>
      </div>
    </Overlay>
  );
}

export default function Exams({ db, set, user, head, students }) {
  const s = db.settings;
  const myClasses = head ? s.classes : s.classes.filter((c) => c.id === user.classId);
  const [cid, setCid] = useState(myClasses[0]?.id);
  const [term, setTerm] = useState(s.term || s.terms[0]?.id);
  const [course, setCourse] = useState('');
  const [tab, setTab] = useState('enter');
  const [cert, setCert] = useState(null);
  const [view, setView] = useState(null);
  const [tpl, setTpl] = useState('auto');
  const cls = s.classes.find((c) => c.id === cid);
  if (!cls) return <p>No class.</p>;
  const courses = coursesOf(cls, term);
  const crs = courses.includes(course) ? course : courses[0];
  const termName = s.terms.find((t) => t.id === term)?.name || '';
  const key = (sid, c, e) => `${term}|${sid}|${c}|${e}`;
  const list = students.filter((x) => x.classId === cid);
  const total = s.exams.reduce((a, e) => a + +e.max, 0) || 1;
  const rows = list.map((st) => {
    const pc = courses.map((c) => s.exams.reduce((a, e) => a + (+db.results[key(st.id, c, e.id)] || 0), 0) / total * 100);
    return { st, pc, avg: pc.reduce((a, b) => a + b, 0) / (pc.length || 1) };
  }).sort((a, b) => b.avg - a.avg);
  rows.forEach((r) => { r.rank = rows.findIndex((x) => x.avg === r.avg) + 1; });
  const dn = (c) => s.departments.find((d) => d.id === c.dept)?.name;
  const common = { db, cls, courses, termName, tpl };
  return (
    <div>
      <div className="card row">
        <select value={cid} onChange={(e) => setCid(e.target.value)}>{myClasses.map((c) => <option key={c.id} value={c.id}>{dn(c)} - {c.name}</option>)}</select>
        <select value={term} onChange={(e) => setTerm(e.target.value)}>{s.terms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
        <button className={`btn ${tab === 'enter' ? '' : 'gray'}`} onClick={() => setTab('enter')}>Enter marks</button>
        <button className={`btn ${tab === 'rank' ? '' : 'gray'}`} onClick={() => setTab('rank')}>Average / Rank / Certificate</button>
      </div>
      {tab === 'enter' ? (
        <div className="card scroll">
          {crs ? <select value={crs} onChange={(e) => setCourse(e.target.value)}>{courses.map((c) => <option key={c}>{c}</option>)}</select> : <p>No courses for this term. Add them in Settings.</p>}
          <table>
            <thead><tr><th>Student</th>{s.exams.map((e) => <th key={e.id}>{e.name} /{e.max}</th>)}</tr></thead>
            <tbody>{crs && list.map((st) => (
              <tr key={st.id}><td>{st.name}</td>{s.exams.map((e) => { const k = key(st.id, crs, e.id); return (
                <td key={e.id}><input className="sm" type="number" min="0" max={e.max} value={db.results[k] ?? ''}
                  onChange={(ev) => set('results', (r) => ({ ...r, [k]: ev.target.value }))} /></td>); })}</tr>
            ))}</tbody>
          </table>
        </div>
      ) : (
        <div>
          <div className="card row">
            <select value={tpl} onChange={(e) => setTpl(e.target.value)}>{TEMPLATES.map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select>
            <button className="btn gold" onClick={() => setView('sheet')}>Result list (PDF)</button>
            <button className="btn gold" onClick={() => setView('batch')}>All certificates (by rank)</button>
          </div>
          <div className="card scroll"><table>
            <thead><tr><th>Rank</th><th>Student</th>{courses.map((c) => <th key={c}>{c}</th>)}<th>Average</th><th>Result</th><th></th></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.st.id}><td>{r.rank}</td><td>{r.st.name}</td>{r.pc.map((p, i) => <td key={i}>{p.toFixed(1)}</td>)}
                <td><b>{r.avg.toFixed(1)}</b></td><td>{r.avg >= s.pass ? 'Pass' : 'Fail'}</td>
                <td><button className="btn sm" onClick={() => setCert(r)}>Certificate</button></td></tr>
            ))}</tbody>
          </table></div>
        </div>
      )}
      {cert && <Certificate {...common} row={cert} onClose={() => setCert(null)} />}
      {view === 'batch' && <Batch {...common} rows={rows} onClose={() => setView(null)} />}
      {view === 'sheet' && <Sheet {...common} rows={rows} onClose={() => setView(null)} />}
    </div>
  );
}
