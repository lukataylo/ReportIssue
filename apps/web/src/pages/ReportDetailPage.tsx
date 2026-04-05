import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Report,
  getCategoryById,
  getEscalationStatus,
  daysUntilEscalation,
  composeEscalationEmailUrl,
  getWriteToThemUrl,
  getAvailableLetterTypes,
  generateLetter,
  getAuthorityById,
  GeneratedLetter,
  LetterType,
  LetterRecipient,
} from '@fixitlondon/shared';
import { getReportById, updateReport, deleteReport, getProfile } from '../services/storage';

const OMBUDSMAN_RECIPIENT: LetterRecipient = {
  name: 'Local Government and Social Care Ombudsman',
  role: 'Ombudsman',
  organisation: 'LGSCO',
  address: 'PO Box 4771, Coventry CV4 0EH',
};

export default function ReportDetailPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [report, setReport] = useState<Report | null>(null);

  // If we just submitted, show the success state
  const justSubmitted = state?.justSubmitted;

  useEffect(() => {
    if (reportId) {
      const r = getReportById(reportId);
      if (r) setReport(r);
    }
  }, [reportId]);

  if (!report) {
    return <div style={{ textAlign: 'center', padding: 32, color: '#6B7280' }}>Loading...</div>;
  }

  const category = getCategoryById(report.categoryId);
  const escalation = getEscalationStatus(report);
  const [letterModal, setLetterModal] = useState<GeneratedLetter | null>(null);
  const availableLetterTypes = getAvailableLetterTypes(report);

  const getRecipient = (letterType: LetterType): LetterRecipient => {
    if (letterType === 'ombudsman-complaint') return OMBUDSMAN_RECIPIENT;
    if (letterType === 'escalation-councillor') {
      return {
        name: report.councillorName || '[Councillor Name]',
        role: 'Ward Councillor',
        organisation: report.authorityName || 'Local Council',
        email: report.councillorEmail,
      };
    }
    if (letterType === 'escalation-mp') {
      return {
        name: report.mpName || '[MP Name]',
        role: 'Member of Parliament',
        organisation: 'House of Commons',
        email: report.mpEmail,
      };
    }
    const authority = getAuthorityById(report.authorityId);
    return {
      name: authority?.name || report.authorityName,
      role: 'Complaints Department',
      organisation: authority?.name || report.authorityName,
      email: authority?.contactEmail,
    };
  };

  const handleGenerateLetter = (letterType: LetterType) => {
    const profile = getProfile();
    if (!profile) {
      alert('Please set up your profile first (name and postcode) in Settings.');
      return;
    }
    if (!category) return;
    const daysSince = Math.floor((Date.now() - new Date(report.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    const escalationDates = report.escalationHistory
      .filter((e) => e.stage >= 2)
      .map((e) => new Date(e.date).toLocaleDateString('en-GB'));

    const letter = generateLetter(letterType, {
      report,
      category,
      profile,
      recipient: getRecipient(letterType),
      daysSinceSubmission: daysSince,
      previousEscalationDates: escalationDates,
    });
    setLetterModal(letter);
  };

  const handleCopyLetter = () => {
    if (!letterModal) return;
    navigator.clipboard.writeText(letterModal.formattedText).then(
      () => alert('Letter copied to clipboard.'),
      () => alert('Failed to copy.'),
    );
  };

  const handlePrintLetter = () => {
    if (!letterModal) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>${letterModal.subject}</title>
      <style>body{font-family:Georgia,serif;font-size:14px;line-height:1.7;max-width:700px;margin:40px auto;padding:0 20px;white-space:pre-wrap;}</style>
      </head><body>${letterModal.formattedText.replace(/\n/g, '<br>')}</body></html>`);
    w.document.close();
    w.print();
  };

  const handleEmailLetter = () => {
    if (!letterModal) return;
    const email = letterModal.recipient.email || '';
    const subject = encodeURIComponent(letterModal.subject);
    const body = encodeURIComponent(letterModal.formattedText);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_self');
  };

  // Success view after submission
  if (justSubmitted) {
    return (
      <div className="success-container">
        <div className="success-card">
          <div className="success-icon">✅</div>
          <div className="success-title">Report Submitted</div>
          <div className="success-subtitle">
            Your {state.categoryTitle?.toLowerCase()} report has been logged.
          </div>

          {state.reference && (
            <div className="ref-box">
              <div className="ref-label">Reference Number</div>
              <div className="ref-value">{state.reference}</div>
            </div>
          )}

          <div className="service-box">
            <div className="ref-label">Routed to</div>
            <div className="service-value">{state.authorityName}</div>
          </div>

          {state.openedExternal && (
            <p style={{ fontSize: 13, color: '#6B7280', fontStyle: 'italic', marginBottom: 8 }}>
              The {state.authorityName} website/email was opened so you can provide any additional details.
            </p>
          )}

          {state.escalationDays > 0 && (
            <div style={{ background: '#FFFBEB', borderRadius: 10, padding: 12, marginTop: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#92400E', marginBottom: 4 }}>
                Escalation Timeline
              </div>
              <div style={{ fontSize: 13, color: '#78350F', lineHeight: 1.4 }}>
                If not resolved within <strong>{state.escalationDays} working days</strong>,
                you can escalate to your councillor and MP.
              </div>
            </div>
          )}
        </div>

        <Link to="/my-reports" className="btn-primary" style={{ marginTop: 20 }}>
          View My Reports
        </Link>
        <Link to="/" className="btn-secondary" style={{ marginTop: 8 }}>
          Back to Home
        </Link>
      </div>
    );
  }

  // Normal detail view
  const statusStyle = getStatusStyle(report.status);

  const handleEscalate = (stage: 2 | 3 | 4) => {
    if (!confirm(`This will advance the escalation to stage ${stage}. Continue?`)) return;

    const profile = getProfile();
    if (stage === 3) {
      if (report.councillorEmail && profile) {
        const url = composeEscalationEmailUrl(
          report.councillorEmail, report.councillorName || 'Councillor',
          'Councillor', report, category?.title || '', profile
        );
        window.open(url, '_self');
      } else if (report.postcode) {
        window.open(getWriteToThemUrl(report.postcode), '_blank');
      }
    }

    if (stage === 4) {
      if (report.mpEmail && profile) {
        const url = composeEscalationEmailUrl(
          report.mpEmail, report.mpName || 'MP',
          'MP', report, category?.title || '', profile
        );
        window.open(url, '_self');
      } else if (report.postcode) {
        window.open(getWriteToThemUrl(report.postcode), '_blank');
      }
    }

    report.escalationStage = stage;
    report.escalationHistory.push({
      stage, date: new Date().toISOString(),
      action: `Escalated to stage ${stage}`,
    });
    if (stage === 2) report.status = 'awaiting-response';
    if (stage === 3) report.status = 'escalated-councillor';
    if (stage === 4) report.status = 'escalated-mp';
    updateReport(report);
    setReport({ ...report });
  };

  const handleResolve = () => {
    if (!confirm('Mark this report as resolved?')) return;
    report.status = 'resolved';
    report.escalationHistory.push({
      stage: report.escalationStage,
      date: new Date().toISOString(),
      action: 'Marked as resolved',
    });
    updateReport(report);
    setReport({ ...report });
  };

  const handleDelete = () => {
    if (!confirm('Delete this report? This cannot be undone.')) return;
    deleteReport(report.id);
    navigate('/my-reports');
  };

  return (
    <div>
      <Link to="/my-reports" className="back-link">&larr; My Reports</Link>

      <div className="summary-card">
        <div className="summary-header">
          <span className="summary-icon">{category?.icon}</span>
          <div style={{ flex: 1 }}>
            <div className="summary-title">{category?.title}</div>
            <div className="summary-authority">{report.authorityName}</div>
          </div>
          <span className="status-badge" style={{ background: statusStyle.bg, color: statusStyle.fg }}>
            {report.status.replace(/-/g, ' ')}
          </span>
        </div>

        {report.reference && <div className="ref-text">Ref: {report.reference}</div>}
        <div className="description">{report.description}</div>
        {report.location.address && <div className="location-text">{report.location.address}</div>}
        <div className="date-text">
          Submitted {new Date(report.createdAt).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'long', year: 'numeric',
          })}
        </div>
      </div>

      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1F2937', marginBottom: 12 }}>
        Escalation Timeline
      </h3>

      <div className="timeline">
        {escalation.actions.map((action, index) => {
          const isLast = index === escalation.actions.length - 1;
          return (
            <div key={action.stage} className="timeline-item">
              {!isLast && (
                <div className={`timeline-line ${action.completed ? 'timeline-line-active' : 'timeline-line-inactive'}`} />
              )}
              <div className={`timeline-dot ${action.completed ? 'dot-completed' : action.available ? 'dot-available' : 'dot-locked'}`}>
                {action.completed ? '✓' : action.available ? '!' : action.stage}
              </div>
              <div className="timeline-content">
                <div className={`timeline-label ${!action.completed && !action.available ? 'timeline-label-locked' : ''}`}>
                  {action.label}
                </div>
                {action.date && action.stage <= 2 && (
                  <div className="timeline-date">
                    {action.stage === 1
                      ? new Date(action.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                      : action.completed
                        ? 'Escalated'
                        : `${daysUntilEscalation(action.date)} days remaining`}
                  </div>
                )}
                {action.available && report.status !== 'resolved' && (
                  <button className="escalate-btn" onClick={() => handleEscalate(action.stage as 2 | 3 | 4)}>
                    {action.stage === 2 ? 'Escalate' : action.stage === 3 ? 'Email Councillor' : 'Email MP'}
                  </button>
                )}
                {!action.completed && !action.available && (
                  <div className="locked-text">
                    {action.stage === 2 ? 'Waiting for response period to pass' : `Complete stage ${action.stage - 1} first`}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Letter Generator */}
      <div className="letter-section">
        <div className="letter-section-title">Generate Formal Letter</div>
        {availableLetterTypes.map((lt) => (
          <button
            key={lt.type}
            className="letter-card"
            onClick={() => handleGenerateLetter(lt.type)}
          >
            <div className="letter-card-title">{lt.title}</div>
            <div className="letter-card-desc">{lt.description}</div>
          </button>
        ))}
      </div>

      {/* Letter Modal */}
      {letterModal && (
        <div className="letter-modal-overlay" onClick={() => setLetterModal(null)}>
          <div className="letter-modal" onClick={(e) => e.stopPropagation()}>
            <div className="letter-modal-header">
              <div className="letter-modal-title">{letterModal.title}</div>
              <button className="letter-modal-close" onClick={() => setLetterModal(null)}>✕</button>
            </div>
            <div className="letter-modal-body">
              <div className="letter-text">{letterModal.formattedText}</div>
            </div>
            <div className="letter-actions">
              <button className="letter-action-btn letter-action-primary" onClick={handleCopyLetter}>
                Copy to Clipboard
              </button>
              <button className="letter-action-btn" onClick={handlePrintLetter}>
                Print
              </button>
              <button className="letter-action-btn" onClick={handleEmailLetter}>
                Send as Email
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 8 }}>
        {report.status !== 'resolved' && (
          <button className="btn-resolve" onClick={handleResolve}>Mark as Resolved</button>
        )}
        <button className="btn-delete" onClick={handleDelete}>Delete Report</button>
      </div>
    </div>
  );
}

function getStatusStyle(status: string) {
  const map: Record<string, { bg: string; fg: string }> = {
    submitted: { bg: '#DBEAFE', fg: '#1D4ED8' },
    'awaiting-response': { bg: '#FEF3C7', fg: '#B45309' },
    'escalated-councillor': { bg: '#FED7AA', fg: '#C2410C' },
    'escalated-mp': { bg: '#FECACA', fg: '#DC2626' },
    resolved: { bg: '#D1FAE5', fg: '#059669' },
  };
  return map[status] || { bg: '#E5E7EB', fg: '#6B7280' };
}
