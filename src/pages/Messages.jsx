import { useState } from 'react';
import { F, uid, useToday, nowTime, coursesOf, Overlay } from '../ui.jsx';

const asc = (a, b) => (a.date + a.time > b.date + b.time ? 1 : -1);

function Direct({ db, set, user, head, now }) {
  const me = user.id; const [peer, setPeer] = useState(''); const [txt, setTxt] = useState('');
  const partners = head ? db.teachers : db.settings.directors;
  const th = db.dms.filter((m) => (m.a === me && m.b === peer) || (m.a === peer && m.b === me)).sort(asc);
  const send = (e) => { e.preventDefault(); if (!peer || !txt.trim()) return; set('dms', (a) => [...a, { id: uid(), a: me, aName: user.name, b: peer, text: txt.trim(), date: now, time: nowTime() }]); setTxt(''); };
  return (
    <div className="card">
      <select value={peer} onChange={(e) => setPeer(e.target.value)}><option value="">Select person</option>{partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
      <div className="chat">{th.map((m) => <div key={m.id} className={'bub ' + (m.a === me ? 'me' : '')}><small>{m.aName} · {m.date} {m.time}</small><br />{m.text}</div>)}</div>
      <form className="row" onSubmit={send}><input value={txt} onChange={(e) => setTxt(e.target.value)} /><button className="btn">Send</button></form>
    </div>
  );
}

function Groups({ db, set, user, head, now }) {
  const me = user.id; const mine = db.teachers.find((t) => t.id === me)?.special;
  const groups = head ? [...new Set(db.teachers.map((t) => t.special).filter(Boolean))] : (mine ? [mine] : []);
  const [g, setG] = useState(''); const [txt, setTxt] = useState('');
  const cur = g || groups[0] || '';
  const msgs = db.gmsgs.filter((m) => m.group === cur).sort(asc);
  const send = (e) => { e.preventDefault(); if (!cur || !txt.trim()) return; set('gmsgs', (a) => [...a, { id: uid(), group: cur, from: me, fromName: user.name, text: txt.trim(), date: now, time: nowTime() }]); setTxt(''); };
  return (
    <div className="card">
      {groups.length ? <select value={cur} onChange={(e) => setG(e.target.value)}>{groups.map((x) => <option key={x}>{x}</option>)}</select> : <p className="note">No specialization group yet. Set "Specialization (course group)" in the teacher registration.</p>}
      {cur && <p><small>Members: {db.teachers.filter((t) => t.special === cur).map((t) => t.name).join(', ')}</small></p>}
      <div className="chat">{msgs.map((m) => <div key={m.id} className={'bub ' + (m.from === me ? 'me' : '')}><small>{m.fromName} · {m.date} {m.time}</small><br />{m.text}</div>)}</div>
      {cur && <form className="row" onSubmit={send}><input value={txt} onChange={(e) => setTxt(e.target.value)} /><button className="btn">Send</button></form>}
    </div>
  );
}

function Papers({ db, set, user, head, now }) {
  const s = db.settings; const me = user.id; const mine = db.teachers.find((t) => t.id === me)?.special || '';
  const blank = { title: '', classId: s.classes[0]?.id, course: '', term: s.term, exam: s.exams[0]?.id, text: '', to: s.directors[0]?.id };
  const [f, setF] = useState(blank); const [view, setView] = useState(null); const [rep, setRep] = useState({});
  const cls = s.classes.find((c) => c.id === f.classId); const courses = cls ? coursesOf(cls, f.term) : [];
  const send = (e) => { e.preventDefault(); set('papers', (a) => [...a, { ...f, course: f.course || courses[0] || '', id: uid(), by: me, byName: user.name, group: mine, date: now, status: 'Sent', reply: '' }]); setF({ ...f, title: '', text: '' }); };
  const list = db.papers.filter((p) => head || p.by === me || (mine && p.group === mine)).sort((a, b) => (a.date < b.date ? 1 : -1));
  const review = (p, status) => set('papers', (a) => a.map((x) => (x.id === p.id ? { ...x, status, reply: rep[p.id] ?? x.reply } : x)));
  const cn = (id) => s.classes.find((c) => c.id === id)?.name;
  return (
    <div>
      {!head && (
        <form className="card grid" onSubmit={send}>
          <h3 className="full">Exam questions</h3>
          <F label="Exam paper title"><input required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></F>
          <F label="Class"><select value={f.classId} onChange={(e) => setF({ ...f, classId: e.target.value })}>{s.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></F>
          <F label="Term"><select value={f.term} onChange={(e) => setF({ ...f, term: e.target.value })}>{s.terms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></F>
          <F label="Course"><select value={f.course || courses[0] || ''} onChange={(e) => setF({ ...f, course: e.target.value })}>{courses.map((c) => <option key={c}>{c}</option>)}</select></F>
          <F label="Exam type"><select value={f.exam} onChange={(e) => setF({ ...f, exam: e.target.value })}>{s.exams.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></F>
          <F label="Send to director"><select value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })}>{s.directors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></F>
          <F label="Questions"><textarea rows="6" required value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} /></F>
          <div className="full"><button className="btn gold">Send</button></div>
        </form>
      )}
      <div className="card scroll"><table>
        <thead><tr><th>Date</th><th>Exam paper title</th><th>Class</th><th>Course</th><th>By</th><th>Status</th><th></th></tr></thead>
        <tbody>{list.map((p) => (
          <tr key={p.id}><td>{p.date}</td><td>{p.title}</td><td>{cn(p.classId)}</td><td>{p.course}</td><td>{p.byName}</td><td>{p.status}{p.reply && <div className="note">{p.reply}</div>}</td>
            <td><button className="btn sm gray" onClick={() => setView(p)}>Print</button>
              {head && <><input placeholder="Reply / comment" value={rep[p.id] ?? p.reply ?? ''} onChange={(e) => setRep({ ...rep, [p.id]: e.target.value })} />{' '}
                <button className="btn sm" onClick={() => review(p, 'Approved')}>Approve</button>{' '}<button className="btn sm red" onClick={() => review(p, 'Returned')}>Return</button></>}</td></tr>))}</tbody></table></div>
      {view && (
        <Overlay>
          <style>{'@page{size:A4 portrait;margin:12mm}'}</style>
          <div className="wrapc"><div className="no-print bar card"><button className="btn" onClick={() => window.print()}>Print</button> <button className="btn gray" onClick={() => setView(null)}>Close</button></div>
            <div className="sheet" style={{ width: 'min(700px,96vw)' }}>
              <div className="shh">{s.logo && <img src={s.logo} alt="" />}<div><h2>{s.school}</h2></div></div>
              <h3>{view.title}</h3><p>{cn(view.classId)} · {view.course} · {s.terms.find((t) => t.id === view.term)?.name} · {s.exams.find((x) => x.id === view.exam)?.name}</p>
              <div style={{ whiteSpace: 'pre-wrap' }}>{view.text}</div></div></div>
        </Overlay>
      )}
    </div>
  );
}

export default function Messages(props) {
  const now = useToday(); const [tab, setTab] = useState('dm');
  return (
    <div>
      <div className="card row">
        <button className={`btn ${tab === 'dm' ? '' : 'gray'}`} onClick={() => setTab('dm')}>Direct</button>
        <button className={`btn ${tab === 'gr' ? '' : 'gray'}`} onClick={() => setTab('gr')}>Subject groups</button>
        <button className={`btn ${tab === 'ex' ? '' : 'gray'}`} onClick={() => setTab('ex')}>Exam questions</button>
      </div>
      {tab === 'dm' && <Direct {...props} now={now} />}{tab === 'gr' && <Groups {...props} now={now} />}{tab === 'ex' && <Papers {...props} now={now} />}
    </div>
  );
}
