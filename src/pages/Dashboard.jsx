import { useToday, monthsBetween, cname, coursesOf, planStatus } from '../ui.jsx';

function Bars({ data, names, colors = ['#0f6b45', '#d4a838', '#c0392b'], h = 130 }) {
  const max = Math.max(1, ...data.flatMap((d) => d.v)); const k = names.length;
  const gw = k * 14 + 18; const w = Math.max(320, data.length * gw + 10);
  return (
    <div className="scroll">
      <svg viewBox={`0 0 ${w} ${h + 40}`} style={{ width: '100%', minWidth: Math.min(w, 700) }}>
        {data.map((d, i) => (
          <g key={i} transform={`translate(${10 + i * gw},0)`}>
            {d.v.map((v, j) => { const bh = (v / max) * h; return (
              <g key={j}><rect x={j * 14} y={h - bh + 14} width="12" height={bh} rx="2" fill={colors[j % 3]} />
                <text x={j * 14 + 6} y={h - bh + 11} fontSize="8" textAnchor="middle">{Math.round(v)}</text></g>); })}
            <text x={k * 7} y={h + 28} fontSize="8" textAnchor="middle">{String(d.l).slice(0, 11)}</text>
          </g>))}
      </svg>
      {k > 1 && <div className="legend">{names.map((n, j) => <span key={n}><i style={{ background: colors[j % 3] }} />{n}</span>)}</div>}
    </div>
  );
}

export default function Dashboard({ db, user, head, students }) {
  const s = db.settings; const now = useToday(); const cur = now.slice(0, 7);
  const six = monthsBetween(...(() => { const d = new Date(); d.setMonth(d.getMonth() - 5); return [d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'), cur]; })());
  const classes = head ? s.classes : s.classes.filter((c) => c.id === user.classId);
  const due = (x) => (+s.classes.find((c) => c.id === x.classId)?.fee || 0) * (1 - (+x.discount || 0) / 100);
  const fees = six.map((m) => ({ l: m.slice(2), v: [students.filter((x) => (x.date || now).slice(0, 7) <= m).reduce((a, x) => a + due(x), 0), db.pay.filter((p) => p.month === m && students.some((x) => x.id === p.sid)).reduce((a, p) => a + +p.amount, 0)] }));
  const sal = db.teachers.reduce((a, t) => a + +t.salary + (+t.transport || 0) + (+t.home || 0), 0) + db.fstaff.reduce((a, f) => a + +f.salary, 0);
  const inex = six.map((m) => ({ l: m.slice(2), v: [
    db.pay.filter((p) => (p.date || '').slice(0, 7) === m).reduce((a, p) => a + +p.amount, 0) + db.fin.filter((x) => x.type === 'income' && x.date.slice(0, 7) === m).reduce((a, x) => a + +x.amount, 0),
    db.fin.filter((x) => x.type === 'expense' && x.date.slice(0, 7) === m).reduce((a, x) => a + +x.amount, 0) + sal] }));
  const ids = students.map((x) => x.id);
  const dates = [...new Set(db.daily.filter((d) => ids.includes(d.sid)).map((d) => d.date))].sort().slice(-7);
  const att = dates.map((dt) => ({ l: dt.slice(5), v: ['Present', 'Late', 'Absent'].map((t) => db.daily.filter((d) => d.date === dt && d.att === t && ids.includes(d.sid)).length) }));
  const mine = db.plans.filter((p) => head || p.owner === user.id);
  const plans = ['Daily', 'Weekly', 'Monthly', 'Yearly'].map((p) => ({ l: p, v: [mine.filter((x) => x.period === p).length, mine.filter((x) => x.period === p && x.done).length] }));
  const ps = students.map((x) => planStatus(x, now)).filter(Boolean);
  const qp = [['Achieved', ps.filter((p) => p.k === 'early' || p.k === 'ontime' || p.k === 'noplan').length], ['Late completion', ps.filter((p) => p.k === 'late').length], ['In progress', ps.filter((p) => p.k === 'left').length], ['Overdue', ps.filter((p) => p.k === 'overdue').length]].map(([l, v]) => ({ l, v: [v] }));
  const total = s.exams.reduce((a, e) => a + +e.max, 0) || 1;
  const avg = classes.map((c) => {
    const st = students.filter((x) => x.classId === c.id); const cs = coursesOf(c, s.term);
    const per = st.map((x) => cs.reduce((a, co) => a + s.exams.reduce((b, e) => b + (+db.results[`${s.term}|${x.id}|${co}|${e.id}`] || 0), 0) / total * 100, 0) / (cs.length || 1));
    return { l: c.name, v: [per.length ? per.reduce((a, b) => a + b, 0) / per.length : 0] };
  });
  const collected = db.pay.filter((p) => p.month === cur && ids.includes(p.sid)).reduce((a, p) => a + +p.amount, 0);
  return (
    <div>
      <div className="kpis">
        <div><small>Total students</small><b>{students.length}</b></div>
        <div><small>Classes</small><b>{classes.length}</b></div>
        {head && <div><small>Teachers</small><b>{db.teachers.length}</b></div>}
        {head && <div><small>Collected this month</small><b className="pos">{Math.round(collected)}</b></div>}
        <div><small>Quran plans achieved</small><b>{qp[0].v[0]}</b></div>
      </div>
      <div className="card"><h3>Students per class</h3><Bars names={['Students']} data={classes.map((c) => ({ l: c.name, v: [students.filter((x) => x.classId === c.id).length] }))} /></div>
      <div className="card"><h3>Gender</h3><Bars names={['Students']} data={['Male', 'Female'].map((g) => ({ l: g, v: [students.filter((x) => x.gender === g).length] }))} h={80} /></div>
      {head && <div className="card"><h3>Fees: expected vs collected (last 6 months)</h3><Bars names={['Expected', 'Collected']} data={fees} /></div>}
      {head && <div className="card"><h3>Income vs expenses (last 6 months, approx.)</h3><Bars names={['Income', 'Expenses']} data={inex} colors={['#0f6b45', '#c0392b']} /></div>}
      <div className="card"><h3>Attendance (last 7 recorded days)</h3><Bars names={['Present', 'Late', 'Absent']} data={att} colors={['#2e9d5f', '#e0a800', '#c0392b']} /></div>
      <div className="card"><h3>Plan achievements</h3><Bars names={['Total', 'Done']} data={plans} /></div>
      <div className="card"><h3>Quran plan results</h3><Bars names={['Students']} data={qp} /></div>
      <div className="card"><h3>Average result per class (current term)</h3><Bars names={['Average']} data={avg} /></div>
    </div>
  );
}
