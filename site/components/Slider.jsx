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
    <div>
      <input
        type="number"
        value={val}
        min={min}
        max={max}
        step={step}
        onChange={handleChange}
        style={{ width: '80px', marginRight: '10px' }}
      />
      <input
        type="range"
        value={val}
        min={min}
        max={max}
        step={step}
        onChange={handleChange}
        className="wdzt-menu-slider"
      />
    </div>
  );
}
