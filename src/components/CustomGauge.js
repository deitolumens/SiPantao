import React from 'react';
import './CustomGauge.css';

const CustomGauge = ({ value, min = 20, max = 40, size = 200 }) => {
  const percentage = (value - min) / (max - min);
  const rotation = percentage * 180;
  
  return (
    <div className="gauge-container" style={{ width: size, height: size / 2 }}>
      <div className="gauge-background"></div>
      <div 
        className="gauge-value" 
        style={{ transform: `rotate(${rotation}deg)` }}
      ></div>
      <div className="gauge-center"></div>
      <div className="gauge-label">
        {value.toFixed(1)}°C
      </div>
      <div className="gauge-min">{min}°C</div>
      <div className="gauge-max">{max}°C</div>
    </div>
  );
};

export default CustomGauge;
