import { Routes, Route, Link, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import NewReportPage from './pages/NewReportPage';
import CategoriesPage from './pages/CategoriesPage';
import ReportPage from './pages/ReportPage';
import MyReportsPage from './pages/MyReportsPage';
import ReportDetailPage from './pages/ReportDetailPage';

export default function App() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isReports = location.pathname === '/my-reports';

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <Link to="/" className="header-title">Fix It London</Link>
        </div>
      </header>

      <nav className="tab-bar">
        <Link to="/" className={`tab ${isHome ? 'tab-active' : ''}`}>
          <span className="tab-icon">📷</span> Report
        </Link>
        <Link to="/my-reports" className={`tab ${isReports ? 'tab-active' : ''}`}>
          <span className="tab-icon">📋</span> My Reports
        </Link>
      </nav>

      <main className="main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/report/new" element={<NewReportPage />} />
          <Route path="/report/categories" element={<CategoriesPage />} />
          <Route path="/report/:categoryId" element={<ReportPage />} />
          <Route path="/my-reports" element={<MyReportsPage />} />
          <Route path="/report-detail/:reportId" element={<ReportDetailPage />} />
        </Routes>
      </main>
    </div>
  );
}
