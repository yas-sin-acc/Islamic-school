import { useEffect, useRef, useState } from 'react';

// image with change / edit (zoom, move, rotate) / remove. Used for photos and the school logo.
export default function PhotoField({ value, onChange, disabled, w = 240, h = 320, fmt = 'image/jpeg' }) {
  const [src, setSrc] = useState(null);
  const [z, setZ] = useState(1); const [x, setX] = useState(0); const [y, setY] = useState(0); const [rot, setRot] = useState(0);
  const cv = useRef(null);
  const open = (d) => { setSrc(d); setZ(1); setX(0); setY(0); setRot(0); };
  const pick = (file) => { const r = new FileReader(); r.onload = () => open(r.result); r.readAsDataURL(file); };
  useEffect(() => {
    if (!src || !cv.current) return;
    const img = new Image();
    img.onload = () => {
      const g = cv.current.getContext('2d');
      if (fmt === 'image/jpeg') { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); } else g.clearRect(0, 0, w, h);
      const sw = rot % 180 ? img.height : img.width; const sh = rot % 180 ? img.width : img.height;
      const sc = Math.max(w / sw, h / sh) * z;
      g.save(); g.translate(w / 2 + x, h / 2 + y); g.rotate((rot * Math.PI) / 180); g.scale(sc, sc);
      g.drawImage(img, -img.width / 2, -img.height / 2); g.restore();
    };
    img.src = src;
  }, [src, z, x, y, rot, w, h, fmt]);
  return (
    <div className="full">
      <div className="row">
        <div className="idp big" style={w === h ? { width: 90, height: 90 } : undefined}>{value ? <img src={value} alt="" /> : <span>PHOTO</span>}</div>
        {!disabled && <>
          <label className="btn sm gray">Choose / change photo<input type="file" accept="image/*" hidden onChange={(e) => e.target.files[0] && pick(e.target.files[0])} /></label>
          {value && <button type="button" className="btn sm" onClick={() => open(value)}>Edit photo</button>}
          {value && <button type="button" className="btn sm red" onClick={() => onChange('')}>Remove photo</button>}
        </>}
      </div>
      {src && (
        <div className="card">
          <canvas ref={cv} width={w} height={h} style={{ width: 150, height: Math.round(150 * h / w), border: '1px solid #999', background: '#eee' }} />
          <div className="grid">
            <label className="f"><span>Zoom</span><input type="range" min="0.3" max="3" step="0.05" value={z} onChange={(e) => setZ(+e.target.value)} /></label>
            <label className="f"><span>Left / right</span><input type="range" min={-w / 2} max={w / 2} value={x} onChange={(e) => setX(+e.target.value)} /></label>
            <label className="f"><span>Up / down</span><input type="range" min={-h / 2} max={h / 2} value={y} onChange={(e) => setY(+e.target.value)} /></label>
          </div>
          <button type="button" className="btn sm gray" onClick={() => setRot((rot + 90) % 360)}>Rotate</button>{' '}
          <button type="button" className="btn sm" onClick={() => { onChange(cv.current.toDataURL(fmt, 0.9)); setSrc(null); }}>Apply</button>{' '}
          <button type="button" className="btn sm gray" onClick={() => setSrc(null)}>Cancel</button>
        </div>
      )}
    </div>
  );
}
