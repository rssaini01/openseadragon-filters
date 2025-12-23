import { h } from 'preact';

export default function FilterItem({ filter, onRemove, children }) {
  return (
    <div className="wdzt-table-layout">
      <div className="wdzt-row-layout">
        <div className="wdzt-cell-layout">
          <button onClick={onRemove} className={"button"}>-</button>
        </div>
        <div className="wdzt-cell-layout filterLabel">&nbsp;{filter.name}</div>
        <div className="wdzt-cell-layout wdzt-full-width">
          {children}
        </div>
      </div>
    </div>
  );
}
