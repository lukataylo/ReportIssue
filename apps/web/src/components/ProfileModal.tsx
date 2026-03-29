import { useState } from 'react';
import { saveProfile } from '../services/storage';

interface Props {
  onComplete: () => void;
}

export default function ProfileModal({ onComplete }: Props) {
  const [name, setName] = useState('');
  const [postcode, setPostcode] = useState('');

  const handleSave = () => {
    if (!name.trim() || !postcode.trim()) return;
    saveProfile({ name: name.trim(), postcode: postcode.trim().toUpperCase() });
    onComplete();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(27,42,74,0.95)', display: 'flex',
      justifyContent: 'center', alignItems: 'center', zIndex: 1000,
      padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: 24,
        maxWidth: 400, width: '100%',
      }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1B2A4A', textAlign: 'center', marginBottom: 8 }}>
          Welcome to Fix It London
        </h2>
        <p style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24, lineHeight: 1.4 }}>
          We need a few details to pre-fill your reports and find your local representatives.
        </p>

        <label className="label" style={{ marginTop: 0 }}>Your name</label>
        <input
          className="input"
          placeholder="e.g. Jane Smith"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label className="label">Your postcode</label>
        <input
          className="input"
          placeholder="e.g. SE1 2QH"
          value={postcode}
          onChange={(e) => setPostcode(e.target.value)}
          style={{ textTransform: 'uppercase' }}
        />

        <button
          className="submit-btn"
          style={{ background: '#3A7BD5', marginTop: 24 }}
          onClick={handleSave}
          disabled={!name.trim() || !postcode.trim()}
        >
          Get Started
        </button>

        <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 12 }}>
          Your details are stored locally in your browser only.
        </p>
      </div>
    </div>
  );
}
