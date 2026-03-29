import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { reportService } from '../services/reportService';
import { Report, CATEGORIES } from '../types';
import L from 'leaflet';
import { format } from 'date-fns';

// Custom marker factory
const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });
};

export default function MapScreen() {
  const [reports, setReports] = useState<Report[]>([]);
  const center: [number, number] = [51.4944, -0.0687]; // Bermondsey

  useEffect(() => {
    setReports(reportService.getReports());
  }, []);

  return (
    <div className="h-full w-full relative">
      <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {reports.map(report => {
          const category = CATEGORIES.find(c => c.id === report.categoryId);
          return (
            <Marker 
              key={report.id} 
              position={[report.location.lat, report.location.lng]}
              icon={createCustomIcon(category?.color || '#000')}
            >
              <Popup>
                <div className="p-1">
                  <h4 className="font-bold text-sm m-0">{category?.title}</h4>
                  <p className="text-[10px] text-gray-500 m-0 mb-1">{report.reference}</p>
                  <p className="text-[10px] line-clamp-2 m-0 mb-2">{report.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] font-bold uppercase text-blue-600">{report.status}</span>
                    <span className="text-[8px] text-gray-400">{format(report.timestamp, 'dd MMM')}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Legend Overlay */}
      <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-[14px] shadow-lg z-[1000] border border-gray-200">
        <h5 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">My Reports Map</h5>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-[#E8734A]" />
            <span className="text-[8px] font-bold">Rough Sleeping</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-[#3A7BD5]" />
            <span className="text-[8px] font-bold">Infrastructure</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-[#2BAE66]" />
            <span className="text-[8px] font-bold">Waste</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-[#D4A017]" />
            <span className="text-[8px] font-bold">ASB/Noise</span>
          </div>
        </div>
      </div>
    </div>
  );
}
