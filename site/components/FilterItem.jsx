import { h } from 'preact';

export default function FilterItem({ filter, onRemove, children }) {
  return (
    <div className="filter-item">
      <div className="filter-item-header">
        <span className="drag-handle">☰</span>
        <span className="filter-name">{filter.name}</span>
        <button onClick={onRemove} className="remove-btn">×</button>
      </div>
      {children && (
        <div className="filter-control">
          {children}
        </div>
      )}
    </div>
  );
}
