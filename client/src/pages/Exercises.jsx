import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { EX, exSrc, getExName, TAGS, DIFF_COLORS, DIFF_LABELS } from '../data/exercises';
import { ExerciseModal } from '../components/ExerciseModal';

const CATS = ['All', 'Favs', 'Push', 'Pull', 'Legs', 'Core', 'Cardio', 'Stretch'];

export function Exercises() {
  const { S, save } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const openKey = searchParams.get('open');

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const favs = S.favs || [];
  const prs = S.prs || {};

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return Object.entries(EX).filter(([key, e]) => {
      if (catFilter === 'Favs' && !favs.includes(key)) return false;
      if (catFilter !== 'All' && catFilter !== 'Favs' && e.cat !== catFilter) return false;
      if (q && !e.name.toLowerCase().includes(q) && !e.muscle.toLowerCase().includes(q) && !e.cat.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, catFilter, favs]);

  const toggleFav = (key, e) => {
    e?.stopPropagation();
    const next = favs.includes(key) ? favs.filter((x) => x !== key) : [...favs, key];
    save({ ...S, favs: next });
  };

  const openModal = (key) => setSearchParams({ open: key });
  const closeModal = () => setSearchParams({});

  return (
    <div className="page active" id="page-exercises">
      <div className="page-header">
        <div className="page-title">Exercises</div>
        <div className="page-sub">Tap any exercise to see the guide, then log your sets</div>
      </div>
      <div className="search-row">
        <input
          className="search-input"
          type="text"
          placeholder="Search exercises…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="ex-count">{filtered.length} exercise{filtered.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="filter-row">
        {CATS.map((cat) => (
          <button
            key={cat}
            className={`filter-btn ${catFilter === cat ? 'active' : ''}`}
            onClick={() => setCatFilter(cat)}
          >
            {cat === 'Favs' ? '★ Favs' : cat}
          </button>
        ))}
      </div>
      <div className="ex-grid">
        {filtered.map(([key, e]) => {
          const pr = prs[key];
          const isFav = favs.includes(key);
          return (
            <div
              key={key}
              className="ex-card"
              onClick={() => openModal(key)}
            >
              <div className="ex-top">
                <img className="ex-img" src={exSrc(key)} alt={e.name} loading="lazy" />
                <button
                  className={`fav-btn ${isFav ? 'faved' : ''}`}
                  onClick={(ev) => toggleFav(key, ev)}
                >
                  {isFav ? '★' : '☆'}
                </button>
                <div className="ex-diff">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`ex-diff-dot ${i < e.diff ? 'lit' : ''}`}
                      style={i < e.diff ? { background: DIFF_COLORS[e.diff - 1] } : {}}
                    />
                  ))}
                </div>
                <div className="ex-equip">{e.equip}</div>
              </div>
              <div className="ex-body">
                <div className="ex-name">{getExName(key)}</div>
                <div className="ex-muscle">{e.muscle}</div>
                <div className="ex-footer">
                  <span className={`plan-tag ${TAGS[e.cat]}`}>{e.cat}</span>
                  {pr ? <span className="ex-pr">PR: {pr.weight}kg</span> : <span className="ex-sets">{e.sets}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {openKey && EX[openKey] && (
        <ExerciseModal
          exerciseKey={openKey}
          exercise={EX[openKey]}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
