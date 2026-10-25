import { useState } from 'react';
import { useToday, cname, planStatus, planMessage, planTarget, curJuz, uid, nowTime } from '../ui.jsx';

export default function QPlans({ db, set, user, students }) {
  const s = db.settings; const now = useToday(); const [cid, setCid] = useState('');
  const inC = (x) => !cid || x.classId === cid;
  const list = students.filter((x) => inC(x) && (planTarget(x) || x.planDone));
  const noPlan = students.filter((x) => inC(x) && !planTarget(x) && !x.planDone);
  const post = (x, text) => set('msgs', (a) => [...a, { id: uid(), date: now, time: nowTime(), by: user.name, owner: user.id, target: 'student', sid: x.id, classId: x.classId, text }]);
  const mark = (x) => {
    set('students', (a) => a.map((y) => (y.id === x.id ? { ...y, planDone: now } : y)));
    const p = planStatus({ ...x, planDone: now }, now);
    post(x, p.k === 'noplan' ? `🏆 ${x.name} completed the Quran. Congratulations!` : p.k === 'early' ? `🏆 ${x.name} completed the Quran plan ${p.days} days early. Great achievement! ${s.rewardText}`
      : p.k === 'ontime' ? `🏆 ${x.name} completed the Quran plan on time. ${s.rewardText}` : `${x.name} completed the Quran plan ${-p.days} days after the plan date.`);
  };
  const notify = (x) => {
    const p = planStatus(x, now);
    post(x, p.k === 'left' ? `📖 ${x.name}: ${p.days} days remain to complete the Quran plan.` : `⚠ ${x.name} has not completed the Quran plan by time (${-p.days} days past the plan date).`);
  };
  return (
    <div>
      <div className="card row">
        <select value={cid} onChange={(e) => setCid(e.target.value)}><option value="">All classes</option>{s.classes.filter((c) => students.some((x) => x.classId === c.id)).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      </div>
      <div className="card scroll"><h3>Quran completion plan</h3><table>
        <thead><tr><th>Student</th><th>Class</th><th>Progress</th><th>Plan start date</th><th>Target date</th><th>Status</th><th></th></tr></thead>
        <tbody>{list.map((x) => {
          const m = planMessage(x, now); const pct = Math.min(100, Math.round(curJuz(db, x) / (+x.planGoal || 30) * 100));
          return (
            <tr key={x.id}><td>{x.name}</td><td>{cname(db, x.classId)}</td>
              <td><div className="pbar"><div style={{ width: pct + '%' }} /></div>{curJuz(db, x)}/{x.planGoal || 30}</td>
              <td>{x.planStart}</td><td>{planTarget(x)}</td>
              <td><span className={'badge ' + m.k}>{m.n != null ? m.n + ' ' : ''}{m.txt}</span>{(m.k === 'early' || m.k === 'ontime') && <div>{s.rewardText}</div>}</td>
              <td>{x.planDone
                ? <button className="btn sm gray" onClick={() => set('students', (a) => a.map((y) => (y.id === x.id ? { ...y, planDone: '' } : y)))}>Reopen</button>
                : <><button className="btn sm gold" onClick={() => mark(x)}>Mark completed</button>{' '}<button className="btn sm" onClick={() => notify(x)}>Send message to parent</button></>}</td></tr>);
        })}</tbody></table>
        {!list.length && <p className="note">No Quran plans yet. Set a plan in the student registration form.</p>}</div>
      {noPlan.length > 0 && (
        <div className="card scroll"><h3>Students without a Quran plan</h3><table><tbody>{noPlan.map((x) => (
          <tr key={x.id}><td>{x.name}</td><td>{cname(db, x.classId)}</td><td><button className="btn sm gold" onClick={() => mark(x)}>Mark completed</button></td></tr>))}</tbody></table></div>
      )}
    </div>
  );
}
