import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ReportScreen from './pages/ReportScreen';
import MyReportsScreen from './pages/MyReportsScreen';
import MapScreen from './pages/MapScreen';
import FormScreen from './pages/FormScreen';
import ConfirmationScreen from './pages/ConfirmationScreen';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/report" replace />} />
          <Route path="report" element={<ReportScreen />} />
          <Route path="report/:categoryId" element={<FormScreen />} />
          <Route path="report/success" element={<ConfirmationScreen />} />
          <Route path="my-reports" element={<MyReportsScreen />} />
          <Route path="map" element={<MapScreen />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
