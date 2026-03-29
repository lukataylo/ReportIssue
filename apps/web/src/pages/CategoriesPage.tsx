import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES, CATEGORY_GROUPS } from '@fixitlondon/shared';

export default function CategoriesPage() {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return CATEGORIES.filter(
      (c) => c.title.toLowerCase().includes(q) || c.subtitle.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div>
      <Link to="/" className="back-link">&larr; Back</Link>
      <h1 className="heading">Browse Categories</h1>

      <input
        className="input"
        placeholder="Search categories..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 16 }}
      />

      {filtered ? (
        filtered.map((cat) => (
          <Link
            key={cat.id}
            to={`/report/new?categoryId=${cat.id}`}
            className="card"
            style={{ borderLeftColor: cat.color }}
          >
            <span className="card-icon">{cat.icon}</span>
            <div className="card-text">
              <div className="card-title">{cat.title}</div>
              <div className="card-subtitle">{cat.subtitle}</div>
            </div>
          </Link>
        ))
      ) : (
        CATEGORY_GROUPS.map((group) => {
          const groupCats = CATEGORIES.filter((c) => c.group === group.id);
          if (groupCats.length === 0) return null;
          return (
            <div key={group.id} className="section">
              <div className="section-title">{group.title}</div>
              {groupCats.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/report/new?categoryId=${cat.id}`}
                  className="card"
                  style={{ borderLeftColor: cat.color }}
                >
                  <span className="card-icon">{cat.icon}</span>
                  <div className="card-text">
                    <div className="card-title">{cat.title}</div>
                    <div className="card-subtitle">{cat.subtitle}</div>
                  </div>
                </Link>
              ))}
            </div>
          );
        })
      )}
    </div>
  );
}
