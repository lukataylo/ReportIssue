import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import {
  CATEGORIES,
  CATEGORY_GROUPS,
  getCategoryById,
  getAuthorityById,
  getBoroughAuthority,
  findBoroughByName,
  ReportLocation,
  CategoryId,
  Category,
} from '@fixitlondon/shared';
import { submitReport } from '../services/reportService';

export default function NewReportPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [searchParams] = useSearchParams();
  const presetCategoryId = searchParams.get('categoryId');

  const [step, setStep] = useState(state?.photoUri ? 2 : presetCategoryId ? 2 : 1);
  const [photoUri, setPhotoUri] = useState<string | undefined>(state?.photoUri);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<ReportLocation | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(presetCategoryId || undefined);
  const [categorySearch, setCategorySearch] = useState('');
  const [extras, setExtras] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [authorityName, setAuthorityName] = useState('');

  const selectedCategory = selectedCategoryId ? getCategoryById(selectedCategoryId) : null;

  // Auto-detect location
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
          } catch {
            setLocation(coords);
          }
        },
        () => {},
        { timeout: 10000 }
      );
    }
  }, []);

  // Resolve authority
  useEffect(() => {
    if (!selectedCategory) { setAuthorityName(''); return; }
    if (selectedCategory.fixedAuthorityId) {
      setAuthorityName(getAuthorityById(selectedCategory.fixedAuthorityId)?.name || '');
    } else if (location?.boroughId) {
      setAuthorityName(getBoroughAuthority(location.boroughId)?.name || '');
    } else {
      setAuthorityName('');
    }
  }, [selectedCategory, location]);

  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return CATEGORIES;
    const q = categorySearch.toLowerCase();
    return CATEGORIES.filter(
      (c) => c.title.toLowerCase().includes(q) || c.subtitle.toLowerCase().includes(q)
    );
  }, [categorySearch]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoUri(reader.result as string);
        setStep(2);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!description.trim()) { alert('Please describe the issue.'); return; }
    if (!location) { alert('Please enable location services.'); return; }
    if (!selectedCategoryId) { alert('Please select a category.'); return; }

    setSubmitting(true);
    try {
      const result = submitReport({
        categoryId: selectedCategoryId as CategoryId,
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
          categoryTitle: selectedCategory?.title,
          escalationDays: selectedCategory?.escalationDays,
        },
      });
    } catch {
      alert('Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  const stepTitles = ['Upload Photo', 'Describe Issue', 'Select Category', 'Review & Submit'];

  return (
    <div className="form-container">
      <Link to="/" className="back-link">&larr; Back</Link>

      {/* Progress bar */}
      <div className="progress-bar">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className={`progress-step ${s <= step ? 'progress-step-active' : ''}`} />
        ))}
      </div>
      <div className="step-label">{stepTitles[step - 1]}</div>

      {/* Step 1: Photo */}
      {step === 1 && (
        <div className="step-center">
          <div className="step-icon">📷</div>
          <h2 className="step-title">Capture the issue</h2>
          <p className="step-subtitle">A photo helps authorities identify and fix the problem faster</p>
          <label className="submit-btn" style={{ background: '#3A7BD5', cursor: 'pointer', display: 'block', textAlign: 'center' }}>
            Upload Photo
            <input type="file" accept="image/*" capture="environment" onChange={handlePhotoSelect} style={{ display: 'none' }} />
          </label>
          <button className="btn-secondary" style={{ marginTop: 10 }} onClick={() => setStep(2)}>
            Skip — no photo
          </button>
        </div>
      )}

      {/* Step 2: Describe */}
      {step === 2 && (
        <div>
          {photoUri && (
            <div className="photo-thumb-row">
              <img src={photoUri} alt="" className="photo-thumb" />
              <button className="change-photo" onClick={() => { setPhotoUri(undefined); setStep(1); }}>
                Change photo
              </button>
            </div>
          )}

          <div className="label">What's the issue? *</div>
          <textarea
            className="text-area"
            placeholder="e.g. Large pothole on the left side of the road, about 30cm wide..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            autoFocus={!!photoUri}
          />

          <div className="label">Location</div>
          {location ? (
            <div className="location-box">
              <div style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
                {location.address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
              </div>
              {location.postcode && (
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{location.postcode}</div>
              )}
            </div>
          ) : (
            <div className="location-box" style={{ background: '#FEF3C7', color: '#92400E' }}>
              Detecting your location...
            </div>
          )}

          <button
            className="submit-btn"
            style={{ background: '#3A7BD5', marginTop: 24 }}
            onClick={() => setStep(3)}
            disabled={!description.trim()}
          >
            Next: Choose Category
          </button>
        </div>
      )}

      {/* Step 3: Category */}
      {step === 3 && (
        <div>
          <input
            className="input"
            placeholder="Search categories..."
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
            style={{ marginBottom: 12 }}
          />

          {categorySearch.trim() ? (
            filteredCategories.map((cat) => (
              <button
                key={cat.id}
                className={`card ${selectedCategoryId === cat.id ? 'card-selected' : ''}`}
                style={{ borderLeftColor: cat.color, width: '100%', textAlign: 'left' }}
                onClick={() => { setSelectedCategoryId(cat.id); setStep(4); }}
              >
                <span className="card-icon">{cat.icon}</span>
                <div className="card-text">
                  <div className="card-title">{cat.title}</div>
                  <div className="card-subtitle">{cat.subtitle}</div>
                </div>
              </button>
            ))
          ) : (
            CATEGORY_GROUPS.map((group) => {
              const groupCats = CATEGORIES.filter((c) => c.group === group.id);
              if (groupCats.length === 0) return null;
              return (
                <div key={group.id}>
                  <div className="section-title">{group.title}</div>
                  {groupCats.map((cat) => (
                    <button
                      key={cat.id}
                      className={`card ${selectedCategoryId === cat.id ? 'card-selected' : ''}`}
                      style={{ borderLeftColor: cat.color, width: '100%', textAlign: 'left' }}
                      onClick={() => { setSelectedCategoryId(cat.id); setStep(4); }}
                    >
                      <span className="card-icon">{cat.icon}</span>
                      <div className="card-text">
                        <div className="card-title">{cat.title}</div>
                        <div className="card-subtitle">{cat.subtitle}</div>
                      </div>
                    </button>
                  ))}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Step 4: Review */}
      {step === 4 && selectedCategory && (
        <div>
          <div className="review-card">
            {photoUri && <img src={photoUri} alt="" className="review-photo" />}

            <div className="review-row">
              <div className="review-label">Category</div>
              <button className="review-value-btn" onClick={() => setStep(3)}>
                {selectedCategory.icon} {selectedCategory.title}
                <span className="edit-link"> change</span>
              </button>
            </div>

            <div className="review-row">
              <div className="review-label">Description</div>
              <button className="review-value-btn" onClick={() => setStep(2)}>
                {description.length > 80 ? description.slice(0, 80) + '...' : description}
                <span className="edit-link"> edit</span>
              </button>
            </div>

            <div className="review-row">
              <div className="review-label">Location</div>
              <div className="review-value">
                {location?.address || (location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'Not set')}
              </div>
            </div>

            {authorityName && (
              <div className="routing-banner" style={{ backgroundColor: selectedCategory.color + '15', color: selectedCategory.color }}>
                Will be submitted to: {authorityName}
              </div>
            )}
          </div>

          {selectedCategory.extraFields?.map((field) => (
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
            style={{ backgroundColor: selectedCategory.color }}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      )}
    </div>
  );
}
