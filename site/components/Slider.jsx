import { h } from 'preact';
import { useState } from 'preact/hooks';

export default function Slider({ value, min, max, step, onChange }) {
  const [val, setVal] = useState(value);

  const handleChange = (e) => {
    const newVal = Number.parseFloat(e.target.value);
    setVal(newVal);
    onChange(newVal);
  };

  return (
    <div className="slider-container">
      <div className="slider-label">
        <span>Range: {min} - {max}</span>
        <span className="slider-value">{val}</span>
      </div>
      <input
        type="range"
        value={val}
        min={min}
        max={max}
        step={step}
        onChange={handleChange}
        className="slider"
      />
    </div>
  );
}
