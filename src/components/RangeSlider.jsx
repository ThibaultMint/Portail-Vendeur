import React from "react";
import "./RangeSlider.css"; // ⚠️ crée ce fichier CSS à côté ou dans /components

export default function RangeSlider({ label, min, max, step = 1, values, onChange }) {
  const [minVal, maxVal] = values;

  // Pour calculer la largeur de la piste verte
  const getPercent = (value) => ((value - min) / (max - min)) * 100;

  return (
    <div className="filter-adv-item">
      <label>{label}</label>

      <div className="range-slider">
        {/* Piste grise */}
        <div className="range-slider-track"></div>

        {/* Piste verte entre min et max */}
        <div
          className="range-slider-range"
          style={{
            left: `${getPercent(minVal)}%`,
            right: `${100 - getPercent(maxVal)}%`,
          }}
        ></div>

        {/* Curseur gauche */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={minVal}
          onChange={(e) => onChange([+e.target.value, maxVal])}
        />

        {/* Curseur droit */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={maxVal}
          onChange={(e) => onChange([minVal, +e.target.value])}
        />

        {/* Valeurs affichées */}
        <div className="range-values">
          <span>{minVal}</span> — <span>{maxVal}</span>
        </div>
      </div>
    </div>
  );
}
