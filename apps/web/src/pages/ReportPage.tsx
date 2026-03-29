import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getCategoryById,
  getAuthorityById,
  getBoroughAuthority,
  findBoroughByName,
  ReportLocation,
} from '@fixitlondon/shared';
import { submitReport } from '../services/reportService';

export default function ReportPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const category = getCategoryById(categoryId || '');

  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<ReportLocation | null>(null);
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [extras, setExtras] = useState<Record<string, string>>({});
  const [authorityName, setAuthorityName] = useState('');

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          try {
            const res = await fetch(
              `https://api.postcodes.io/postcodes?lon=${coords.longitude}&lat=${coords.latitude}&limit=1`
            );
            const data = await res.json();
            const result = data?.result?.[0];
            const borough = result?.admin_district ? findBoroughByName(result.admin_district) : null;
            setLocation({
              ...coords,
              address: [result?.admin_ward, result?.admin_district].filter(Boolean).join(', '),
              postcode: result?.postcode,
              boroughId: borough?.id,
            });
            resolveAuthorityName(borough?.id);
          } catch {
            setLocation(coords);
          }
        },
        () => { /* location denied */ },
        { timeout: 10000 }
      );
    }
  }, []);

  const resolveAuthorityName = (boroughId?: string) => {
    if (!category) return;
    if (category.fixedAuthorityId) {
      setAuthorityName(getAuthorityById(category.fixedAuthorityId)?.name || '');
    } else if (boroughId) {
      setAuthorityName(getBoroughAuthority(boroughId)?.name || '');
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPhotoUri(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!description.trim()) {
      alert('Please describe the issue.');
      return;
    }
    if (!location) {
      alert('Please enable location services or wait for location detection.');
      return;
    }

    setSubmitting(true);
    try {
      const result = submitReport({
        categoryId: categoryId as any,
        description: description.trim(),
        location,
        photoUri,
        extras: Object.keys(extras).length > 0 ? extras : undefined,
      });
      navigate(`/report-detail/${result.report.id}`, {
        state: {
          justSubmitted: true,
          reference: result.report.reference,
          authorityName: result.report.authorityName,
          openedExternal: result.openedExternal,
          categoryTitle: category?.title,
          escalationDays: category?.escalationDays,
        },
      });
    } catch {
      alert('Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!category) {
    return <div style={{ textAlign: 'center', padding: 32 }}>Category not found.</div>;
  }

  return (
    <div className="form-container">
      <Link to="/" className="back-link">&larr; Back</Link>

      <div className="banner" style={{ backgroundColor: category.color + '15', color: category.color }}>
        {authorityName ? `Submitting to: ${authorityName}` : 'Detecting your council...'}
      </div>

      <div className="label">Location</div>
      {location ? (
        <div style={{
          background: '#fff', borderRadius: 10, padding: 12,
          border: '1px solid #E5E7EB', marginBottom: 4,
        }}>
          <div style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
            {location.address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
          </div>
          {location.postcode && (
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{location.postcode}</div>
          )}
        </div>
      ) : (
        <div style={{
          background: '#FEF3C7', borderRadius: 10, padding: 12,
          fontSize: 13, color: '#92400E',
        }}>
          Waiting for location... please allow location access.
        </div>
      )}
      <div className="hint">Location is detected automatically from your browser</div>

      <div className="label">Photo (optional)</div>
      <div className="photo-row">
        <label className="photo-btn">
          Choose Photo
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoSelect}
            style={{ display: 'none' }}
          />
        </label>
      </div>
      {photoUri && (
        <div className="photo-preview">
          <img src={photoUri} alt="Report" />
          <button className="remove-photo" onClick={() => setPhotoUri(undefined)}>
            Remove photo
          </button>
        </div>
      )}

      <div className="label">Description *</div>
      <textarea
        className="text-area"
        placeholder="Describe the issue..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      {category.extraFields?.map((field) => (
        <div key={field.key}>
          <div className="label">{field.label}</div>
          {field.type === 'options' && field.options ? (
            <div className="option-row">
              {field.options.map((opt) => (
                <button
                  key={opt}
                  className={`option-btn ${extras[field.key] === opt ? 'active' : ''}`}
                  onClick={() => setExtras({ ...extras, [field.key]: opt })}
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <input
              className="input"
              placeholder={field.placeholder || ''}
              value={extras[field.key] || ''}
              onChange={(e) => setExtras({ ...extras, [field.key]: e.target.value })}
            />
          )}
        </div>
      ))}

      <button
        className="submit-btn"
        style={{ backgroundColor: category.color }}
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? 'Submitting...' : 'Submit Report'}
      </button>
    </div>
  );
}
