import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { EX, exSrc, getExName, TAGS } from '../data/exercises';

function calcStreak(log) {
  if (!log?.length) return 0;
  const dates = [...new Set(log.map((e) => new Date(e.ts).toDateString()))]
    .map((s) => new Date(s))
    .sort((a, b) => b - a);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const gap = (a, b) => Math.round((a - b) / 864e5);
  if (gap(now, dates[0]) >= 7) return 0;
  let count = 1;
  for (let i = 1; i < dates.length; i++) {
    if (gap(dates[i - 1], dates[i]) >= 7) break;
    count++;
  }
  return count;
}

export function Dashboard() {
  const navigate = useNavigate();
  const { S } = useApp();
  const log = S.log || [];
  const prs = S.prs || {};
  const profile = S.profile || {};
  const favs = S.favs || [];

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const name = profile.name || 'there';

  const now = new Date();
  const ws = new Date(now);
  ws.setDate(now.getDate() - now.getDay());
  ws.setHours(0, 0, 0, 0);
  const weekLog = log.filter((e) => new Date(e.ts) >= ws);
  const totalVol = log.reduce((a, e) => a + (e.isTimed ? 0 : e.volume || 0), 0);
  const totalSets = log.reduce((a, e) => a + (e.sets || 0), 0);
  const prCount = Object.keys(prs).length;
  const streak = calcStreak(log);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const tod = now.getDay();
  const todayIdx = tod === 0 ? 6 : tod - 1;

  const quickPicks = ['bench', 'squat', 'deadlift', 'pullup', 'ohp', 'plank'].slice(0, 3);

  const avatar = profile.avatar;
  const init = (name || '?').charAt(0).toUpperCase();

  return (
    <div className="page active" id="page-dashboard">
      <div className="dash-header">
        <div className="dash-left">
          <div className="dash-avatar">
            {avatar ? <img src={avatar} alt="" /> : init}
          </div>
          <div>
            <div className="greet">{greet}</div>
            <div className="user-name">{name}'s <span>Training</span></div>
          </div>
        </div>
        <div className="streak-pill">🔥 <span>{streak}</span>-day streak</div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">This Week</div>
          <div className="stat-val"><span>{weekLog.length}</span> <span className="stat-unit">sessions</span></div>
          <div className="stat-delta">{weekLog.length > 0 ? `+${weekLog.length} this week` : 'start logging'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Volume</div>
          <div className="stat-val"><span>{totalVol >= 1000 ? (totalVol / 1000).toFixed(1) + 'k' : Math.round(totalVol)}</span> <span className="stat-unit">kg</span></div>
          <div className="stat-delta">all time</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Sets Logged</div>
          <div className="stat-val"><span>{totalSets}</span> <span className="stat-unit">sets</span></div>
          <div className="stat-delta">all time</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Personal Records</div>
          <div className="stat-val"><span>{prCount}</span> <span className="stat-unit">PRs</span></div>
          <div className="stat-delta">{prCount > 0 ? 'keep pushing' : 'keep pushing'}</div>
        </div>
      </div>

      <div className="week-section">
        <div className="sec-title">This Week</div>
        <div className="week-grid">
          {days.map((d, i) => {
            const off = i - todayIdx;
            const dd = new Date(now);
            dd.setDate(now.getDate() + off);
            const ds = dd.toDateString();
            const dayLogs = log.filter((e) => new Date(e.ts).toDateString() === ds);
            const done = dayLogs.length > 0;
            const isToday = i === todayIdx;
            return (
              <div
                key={d}
                className={`day-cell ${done ? 'done' : ''} ${isToday ? 'today' : ''}`}
              >
                <div className="dlabel">{d}</div>
                <div className="dcheck">{done ? `✓ ${dayLogs.length}` : isToday ? '→' : '·'}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="plan-section">
        <div className="sec-title">Quick Start</div>
        <div className="plan-grid">
          {quickPicks.map((k) => {
            const e = EX[k];
            if (!e) return null;
            return (
              <button
                key={k}
                type="button"
                className="plan-card"
                onClick={() => navigate(`/exercises?open=${k}`)}
                style={{ border: 'none', cursor: 'pointer', textAlign: 'left', font: 'inherit', color: 'inherit' }}
              >
                <img className="plan-img" src={exSrc(k)} alt={e.name} loading="lazy" />
                <div className="plan-body">
                  <div className="plan-name">{getExName(k)}</div>
                  <div className="plan-meta">{e.sets} · {e.muscle.split('·')[0].trim()}</div>
                  <span className={`plan-tag ${TAGS[e.cat] || ''}`}>{e.cat}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
