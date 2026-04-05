import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCategoryById, getEscalationStatus, Report } from '@fixitlondon/shared';
import { getReports } from '../services/storage';

function formatStatus(status: string): string {
  return status.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusStyle(status: string): { bg: string; fg: string } {
  const map: Record<string, { bg: string; fg: string }> = {
    submitted: { bg: '#DBEAFE', fg: '#1D4ED8' },
    'awaiting-response': { bg: '#FEF3C7', fg: '#B45309' },
    'escalated-councillor': { bg: '#FED7AA', fg: '#C2410C' },
    'escalated-mp': { bg: '#FECACA', fg: '#DC2626' },
    resolved: { bg: '#D1FAE5', fg: '#059669' },
  };
  return map[status] || { bg: '#E5E7EB', fg: '#6B7280' };
}

export default function MyReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    setReports(getReports());
  }, []);

  if (reports.length === 0) {
    return (
      <div className="empty">
        <div className="empty-icon">📋</div>
        <div className="empty-title">No reports yet</div>
        <div className="empty-text">
          Reports you submit will appear here with escalation tracking.
        </div>
      </div>
    );
  }

  return (
    <div>
      {reports.map((report) => {
        const category = getCategoryById(report.categoryId);
        const escalation = getEscalationStatus(report);
        const style = statusStyle(report.status);

        return (
          <Link
            key={report.id}
            to={`/report-detail/${report.id}`}
            className="report-card"
            style={{ borderLeftColor: category?.color || '#999' }}
          >
            <div className="report-card-header">
              <div className="report-card-title">
                {category?.icon} {category?.title || report.categoryId}
              </div>
              <span className="status-badge" style={{ background: style.bg, color: style.fg }}>
                {formatStatus(report.status)}
              </span>
            </div>

            <div className="report-card-desc">{report.description}</div>

            <div className="escalation-row">
              {[1, 2, 3, 4].map((stage) => (
                <div
                  key={stage}
                  className={`stage-dot ${
                    stage <= report.escalationStage
                      ? 'stage-dot-active'
                      : escalation.actions[stage - 1]?.available
                        ? 'stage-dot-available'
                        : 'stage-dot-locked'
                  }`}
                />
              ))}
              {escalation.nextActionAvailable && (
                <span className="escalation-badge-text">Action available</span>
              )}
            </div>

            <div className="report-card-footer">
              <span className="report-card-authority">{report.authorityName}</span>
              <span className="report-card-date">
                {new Date(report.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short',
                })}
              </span>
            </div>

            {report.reference && (
              <div className="report-card-ref">Ref: {report.reference}</div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
