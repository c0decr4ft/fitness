import { useState } from 'react';
import { useApp } from '../context/AppContext';

export function SetupScreen() {
  const { S, save } = useApp();
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [goal, setGoal] = useState('Build Muscle');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const profile = {
      name: name.trim(),
      weight: parseFloat(weight) || null,
      height: parseFloat(height) || null,
      age: parseFloat(age) || null,
      goal: goal,
    };
    save({
      ...S,
      profile,
      log: S.log || [],
      hrLog: S.hrLog || [],
      prs: S.prs || {},
    });
  };

  return (
    <div id="setup-screen" style={{ position: 'fixed', inset: 0, background: 'var(--bg)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="setup-box">
        <div className="setup-logo">FORGE</div>
        <div className="setup-tagline">Enter your details once. Everything saves automatically to this device.</div>
        <form onSubmit={handleSubmit}>
          <label className="field-label">Your Name</label>
          <input
            className="field-input"
            type="text"
            placeholder="e.g. Alex"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="off"
          />
          <div className="two-col">
            <div>
              <label className="field-label">Weight (kg)</label>
              <input className="field-input" id="setup-weight" type="number" placeholder="75" value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>
            <div>
              <label className="field-label">Height (cm)</label>
              <input className="field-input" id="setup-height" type="number" placeholder="178" value={height} onChange={(e) => setHeight(e.target.value)} />
            </div>
          </div>
          <div className="two-col">
            <div>
              <label className="field-label">Age</label>
              <input className="field-input" type="number" placeholder="25" value={age} onChange={(e) => setAge(e.target.value)} />
            </div>
            <div>
              <label className="field-label">Training Goal</label>
              <select className="field-input" value={goal} onChange={(e) => setGoal(e.target.value)}>
                <option value="Build Muscle">Build Muscle</option>
                <option value="Lose Fat">Lose Fat</option>
                <option value="Improve Endurance">Improve Endurance</option>
                <option value="Stay Active">Stay Active</option>
              </select>
            </div>
          </div>
          <button className="setup-btn" type="submit">Start Training</button>
        </form>
      </div>
    </div>
  );
}
