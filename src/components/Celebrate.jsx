import { Overlay } from '../ui.jsx';
const COL = ['#e74c3c', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6', '#e67e22', '#1abc9c'];

// balloons + confetti pop-up for students who achieved their Quran plan
export default function Celebrate({ items, reward, onClose }) {
  return (
    <Overlay>
      <div className="party">
        {Array.from({ length: 16 }, (_, i) => <span key={i} className="balloon" style={{ left: ((i * 7 + 3) % 94) + '%', background: COL[i % 7], animationDelay: (i % 7) * 0.45 + 's', animationDuration: 5 + (i % 4) + 's' }} />)}
        {Array.from({ length: 60 }, (_, i) => <i key={i} className="conf" style={{ left: ((i * 13) % 100) + '%', background: COL[i % 7], animationDelay: (i % 12) * 0.25 + 's', animationDuration: 3 + (i % 3) + 's' }} />)}
      </div>
      <div className="pbox">
        <div className="bigemoji">🏆🎈🎉🥇</div>
        <h2>Congratulations!</h2>
        {items.map((x) => <p key={x.id}>🎉 <b>{x.name}</b> {x.k === 'early' ? 'achieved the Quran plan early – great achievement!' : x.k === 'ontime' ? 'achieved the Quran plan on time!' : 'completed the Quran – congratulations!'}</p>)}
        {items.some((x) => x.k === 'early' || x.k === 'ontime') && <p>{reward}</p>}
        <button className="btn" onClick={onClose}>Close</button>
      </div>
    </Overlay>
  );
}
