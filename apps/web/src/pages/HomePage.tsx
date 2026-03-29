import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CATEGORIES,
  CATEGORY_GROUPS,
  getAuthorityById,
  findBoroughByName,
} from '@fixitlondon/shared';
import ProfileModal from '../components/ProfileModal';
import { hasProfile } from '../services/storage';

interface DetectedBorough {
  name: string;
  id: string;
}

export default function HomePage() {
  const [borough, setBorough] = useState<DetectedBorough | null>(null);
  const [detecting, setDetecting] = useState(true);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    if (!hasProfile()) {
      setShowProfile(true);
    }

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const res = await fetch(
              `https://api.postcodes.io/postcodes?lon=${pos.coords.longitude}&lat=${pos.coords.latitude}&limit=1`
            );
            const data = await res.json();
            const district = data?.result?.[0]?.admin_district;
            if (district) {
              const b = findBoroughByName(district);
              if (b) setBorough({ name: b.name, id: b.id });
            }
          } catch { /* ignore */ }
          setDetecting(false);
        },
        () => setDetecting(false),
        { timeout: 10000 }
      );
    } else {
      setDetecting(false);
    }
  }, []);

  return (
    <>
      {showProfile && <ProfileModal onComplete={() => setShowProfile(false)} />}

      <div className="borough-banner">
        {detecting ? (
          'Detecting your borough...'
        ) : borough ? (
          <>Reporting in: <span className="borough-name">{borough.name}</span></>
        ) : (
          'Could not detect borough — reports will use FixMyStreet'
        )}
      </div>

      <h1 className="heading">What would you like to report?</h1>

      {CATEGORY_GROUPS.map((group) => {
        const groupCategories = CATEGORIES.filter((c) => c.group === group.id);
        if (groupCategories.length === 0) return null;

        return (
          <div key={group.id} className="section">
            <div className="section-title">{group.title}</div>
            {groupCategories.map((category) => (
              <Link
                key={category.id}
                to={`/report/${category.id}`}
                className="card"
                style={{ borderLeftColor: category.color }}
              >
                <span className="card-icon">{category.icon}</span>
                <div className="card-text">
                  <div className="card-title">{category.title}</div>
                  <div className="card-subtitle">{category.subtitle}</div>
                </div>
                <span
                  className="card-badge"
                  style={{
                    backgroundColor: category.color + '15',
                    color: category.color,
                  }}
                >
                  {category.fixedAuthorityId
                    ? getAuthorityById(category.fixedAuthorityId)?.name || ''
                    : borough ? 'Council' : 'Council'}
                </span>
              </Link>
            ))}
          </div>
        );
      })}
    </>
  );
}
