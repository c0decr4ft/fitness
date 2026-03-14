import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { exSrc, getExName, getExSteps, TAGS, DIFF_LABELS } from '../data/exercises';

const BW_PERCENT = { pushups: 0.64, dips: 1.0, pullup: 1.0, chinup: 1.0, legraise: 1.0, mountain: 0.7, burpees: 1.0, twist: 0.5, dead_bug: 0.3, side_plank: 0.5, plank: 0.5, run: 1.0, hip_stretch: 1.0, hamstring_stretch: 1.0 };

function isTimedExercise(e) {
  return /\d+s\b/.test(e.sets) || /\d+min\b/.test(e.sets) || e.sets === '5K';
}
function isDurationInMinutes(e) {
  return /\d+min\b/.test(e.sets) || e.sets === '5K';
}

function checkPR(prs, key, weight, reps) {
  const e1rm = weight * (1 + reps / 30);
  const prev = prs[key];
  if (!prev || e1rm > prev.e1rm) {
    return [{ ...prs, [key]: { weight, reps, e1rm: +e1rm.toFixed(1), ts: Date.now() } }, true];
  }
  return [prs, false];
}

export function ExerciseModal({ exerciseKey, exercise, onClose }) {
  const { S, save } = useApp();
  const [note, setNote] = useState('');
  const isBWInit = exercise.equip === 'Bodyweight' || exercise.equip === 'None';
  const effectiveWtInit = isBWInit ? Math.round((S.profile?.weight || 0) * (BW_PERCENT[exerciseKey] || 1)) : 0;
  const [sets, setSets] = useState(() => {
    const lastLog = (S.log || []).find((l) => l.key === exerciseKey);
    const defWt = isBWInit ? (effectiveWtInit || 60) : (lastLog?.details?.[0]?.wt ?? 60);
    const defRp = lastLog?.details?.[0]?.rp ?? 10;
    return [
      { wt: defWt, rp: defRp, done: false },
      { wt: defWt, rp: defRp, done: false },
      { wt: defWt, rp: defRp, done: false },
    ];
  });

  const isBW = exercise.equip === 'Bodyweight' || exercise.equip === 'None';
  const isTimed = isTimedExercise(exercise);
  const isMinutes = isTimed && isDurationInMinutes(exercise);
  const userWt = S.profile?.weight || 0;
  const bwMult = BW_PERCENT[exerciseKey] || 1.0;
  const effectiveWt = isBW ? Math.round(userWt * bwMult) : 0;

  const steps = getExSteps(exerciseKey);
  const recentLog = (S.log || []).filter((e) => e.key === exerciseKey).slice(0, 5);

  const addSet = () => {
    const last = sets[sets.length - 1];
    setSets([...sets, { wt: last.wt, rp: last.rp, done: false }]);
  };

  const updateSet = (i, field, val) => {
    const next = [...sets];
    next[i] = { ...next[i], [field]: parseFloat(val) || 0 };
    setSets(next);
  };

  const toggleDone = (i) => {
    const next = [...sets];
    next[i] = { ...next[i], done: !next[i].done };
    setSets(next);
  };

  const saveLog = () => {
    let vol = 0;
    let done = 0;
    let maxWt = 0;
    const details = [];
    let isPR = false;
    let newPrs = { ...(S.prs || {}) };

    sets.forEach((s, i) => {
      const d = sets[i].done;
      details.push({ wt: s.wt, rp: s.rp, done: d });
      if (d) {
        if (isTimed) {
          vol += isMinutes ? s.rp * 60 : s.rp;
        } else {
          vol += (isBW ? effectiveWt : s.wt) * s.rp;
        }
        done++;
        if (s.wt > maxWt) maxWt = s.wt;
        if (!isTimed) {
          const wt = isBW ? effectiveWt : s.wt;
          const [nextPrs, prSet] = checkPR(newPrs, exerciseKey, wt, s.rp);
          newPrs = nextPrs;
          if (prSet) isPR = true;
        }
      }
    });

    const logEntry = {
      key: exerciseKey,
      name: exercise.name,
      cat: exercise.cat,
      muscle: exercise.muscle,
      sets: done,
      volume: vol,
      maxWeight: maxWt,
      ts: Date.now(),
      note: note || undefined,
      isPR,
      details,
      isTimed: isTimed || undefined,
      isBW: isBW || undefined,
    };

    const newLog = [logEntry, ...(S.log || [])];
    save({ ...S, log: newLog, prs: newPrs }, { immediateSync: true });
    onClose();
  };

  return (
    <div className="overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="demo-header-overlay">
          <img className="demo-img" src={exSrc(exerciseKey)} alt={exercise.name} />
          <span className={`demo-cat demo-cat-badge plan-tag ${TAGS[exercise.cat]}`}>{exercise.cat}</span>
          <button className="demo-close" onClick={onClose}>✕</button>
        </div>
        <div className="demo-body">
          <div className="demo-title">{getExName(exerciseKey)}</div>
          <div className="demo-muscle">{exercise.muscle}</div>
          <div className="demo-info-row">
            <div className="demo-info-chip">
              <svg viewBox="0 0 24 24"><path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z" fill="currentColor" /></svg>
              {exercise.equip}
            </div>
            <div className="demo-info-chip">
              <svg viewBox="0 0 24 24"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" fill="currentColor" /></svg>
              {DIFF_LABELS[exercise.diff - 1]}
            </div>
            <div className="demo-info-chip">
              <svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" fill="currentColor" /></svg>
              {exercise.sets}
            </div>
          </div>
          <div className="steps-block">
            <h4>How to perform</h4>
            {steps.map((s, i) => (
              <div key={i} className="step-item">
                <div className="step-num">{i + 1}</div>
                <div className="step-txt">{s}</div>
              </div>
            ))}
          </div>
          {recentLog.length > 0 && (
            <div className="ex-history-section">
              <h4>Recent History</h4>
              {recentLog.map((e, i) => {
                const d = new Date(e.ts);
                const volStr = e.isTimed
                  ? e.volume >= 60 ? `${Math.round(e.volume / 60)} min` : `${Math.round(e.volume)}s`
                  : e.volume ? Math.round(e.volume) + 'kg' : '—';
                return (
                  <div key={i} className="ex-hist-row">
                    <span className="ex-hist-date">{d.toLocaleDateString()}</span>
                    <span className="ex-hist-val">{e.sets} sets · {volStr}</span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="demo-note">
            <label>Workout Note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. felt strong today, increase weight next time…"
            />
          </div>
          <button className="demo-log-btn" onClick={() => {}} style={{ marginBottom: 12 }}>
            Log This Exercise
          </button>

          <div className="sets-modal-box" style={{ marginTop: 16, padding: 20 }}>
            <div className="sets-title">{getExName(exerciseKey)}</div>
            <div className="sets-sub">{exercise.muscle} · {exercise.sets}</div>
            {isBW && userWt && (
              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
                ⚡ <strong>Bodyweight exercise</strong> — using your weight ({userWt}kg × {Math.round(bwMult * 100)}% ≈ <strong>{effectiveWt}kg</strong>).
              </div>
            )}
            <table className="sets-table">
              <thead>
                <tr>
                  <th>Set</th>
                  <th>kg</th>
                  <th>{isTimed ? (isMinutes ? 'Minutes' : 'Seconds') : 'Reps'}</th>
                  <th>Done</th>
                </tr>
              </thead>
              <tbody>
                {sets.map((s, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--muted)', fontFamily: 'Space Mono', fontSize: 12 }}>{i + 1}</td>
                    <td>
                      <input
                        className="sets-input"
                        type="number"
                        value={s.wt}
                        onChange={(e) => updateSet(i, 'wt', e.target.value)}
                        readOnly={isBW && userWt}
                        style={isBW && userWt ? { background: 'var(--bg)', opacity: 0.7 } : {}}
                      />
                    </td>
                    <td>
                      <input
                        className="sets-input"
                        type="number"
                        value={s.rp}
                        onChange={(e) => updateSet(i, 'rp', e.target.value)}
                      />
                    </td>
                    <td>
                      <button
                        className={`check-btn ${s.done ? 'done' : ''}`}
                        onClick={() => toggleDone(i)}
                      >
                        ✓
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="add-set-btn" onClick={addSet}>+ Add Set</button>
            <div className="sets-footer" style={{ marginTop: 16 }}>
              <button className="btn-cancel" onClick={onClose}>Cancel</button>
              <button className="btn-log" onClick={saveLog}>Save to Log</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
