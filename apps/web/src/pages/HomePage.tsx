import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getCategoryById,
  findBoroughByName,
  Report,
} from '@fixitlondon/shared';
import ProfileModal from '../components/ProfileModal';
import { hasProfile, getReports } from '../services/storage';

export default function HomePage() {
  const navigate = useNavigate();
  const [boroughName, setBoroughName] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [recentReports, setRecentReports] = useState<Report[]>([]);

  useEffect(() => {
    if (!hasProfile()) setShowProfile(true);
    setRecentReports(getReports().slice(0, 3));

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
              if (b) setBoroughName(b.name);
            }
          } catch { /* ignore */ }
        },
        () => {},
        { timeout: 10000 }
      );
    }
  }, []);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        navigate('/report/new', { state: { photoUri: reader.result as string } });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      {showProfile && <ProfileModal onComplete={() => setShowProfile(false)} />}

      {/* Hero section */}
      <div className="hero">
        <h1 className="hero-title">See something?<br />Report it.</h1>
        <p className="hero-subtitle">
          {boroughName ? `Reporting in ${boroughName}` : 'Upload a photo to get started'}
        </p>

        <label className="camera-btn">
          <span className="camera-btn-icon">📷</span>
          <span className="camera-btn-text">Upload Photo & Report</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoSelect}
            style={{ display: 'none' }}
          />
        </label>

        <div className="alt-row">
          <Link to="/report/new" className="alt-btn">Skip Photo</Link>
          <Link to="/report/categories" className="alt-btn">Browse Categories</Link>
        </div>
      </div>

      {/* Recent reports */}
      {recentReports.length > 0 && (
        <div className="recent-section">
          <div className="recent-header">
            <span className="recent-title">Recent Reports</span>
            <Link to="/my-reports" className="see-all">See all</Link>
          </div>
          <div className="recent-row">
            {recentReports.map((report) => {
              const cat = getCategoryById(report.categoryId);
              return (
                <Link key={report.id} to={`/report-detail/${report.id}`} className="recent-card">
                  {report.photoUri ? (
                    <img src={report.photoUri} alt="" className="recent-photo" />
                  ) : (
                    <div className="recent-photo recent-photo-placeholder">
                      <span style={{ fontSize: 24 }}>{cat?.icon || '📢'}</span>
                    </div>
                  )}
                  <div className="recent-card-title">{cat?.title || 'Report'}</div>
                  <div className="recent-card-status">{report.status.replace(/-/g, ' ')}</div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
