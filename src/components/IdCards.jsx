import { Overlay } from '../ui.jsx';
// items: [{ id, name, photo, lines: [text...], foot }]   width in mm (set in Settings)
export default function IdCards({ school, logo, items, width = 95, onClose }) {
  return (
    <Overlay>
      <style>{'@page{size:A4 portrait;margin:6mm}'}</style>
      <div className="wrapc">
        <div className="no-print bar"><button className="btn" onClick={() => window.print()}>Print</button> <button className="btn gray" onClick={onClose}>Close</button></div>
        <div className="idwrap" style={{ '--idw': width + 'mm' }}>
          {items.map((x) => (
            <div className="idc" key={x.id}>
              <div className="idh">{logo && <img className="idlogo" src={logo} alt="" />}{school}</div>
              <div className="idb">
                <div className="idp">{x.photo ? <img src={x.photo} alt="" /> : <span>PHOTO</span>}</div>
                <div className="idi"><b>{x.name}</b><div>ID: {x.id}</div>{x.lines.map((l, i) => <div key={i}>{l}</div>)}</div>
              </div>
              {x.extra && <div className="idx">{x.extra}</div>}
              <div className="idf">{x.foot}</div>
            </div>
          ))}
        </div>
      </div>
    </Overlay>
  );
}
