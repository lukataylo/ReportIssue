import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { FileText, List, Map as MapIcon } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Layout() {
  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gray-50 shadow-xl overflow-hidden relative border-x border-gray-200">
      {/* Header */}
      <header className="bg-[#1a1a2e] text-white p-4 flex items-center justify-between sticky top-0 z-50">
        <h1 className="text-xl font-bold tracking-tight">ReportSE</h1>
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
          <span className="text-xs font-bold">SE1</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-200 flex justify-around items-center h-16 absolute bottom-0 left-0 right-0 z-50">
        <NavLink 
          to="/report" 
          className={({ isActive }) => cn(
            "flex flex-col items-center justify-center w-full h-full transition-colors",
            isActive ? "text-[#1a1a2e]" : "text-gray-400"
          )}
        >
          <FileText size={24} />
          <span className="text-[10px] mt-1 font-medium">Report</span>
        </NavLink>
        <NavLink 
          to="/my-reports" 
          className={({ isActive }) => cn(
            "flex flex-col items-center justify-center w-full h-full transition-colors",
            isActive ? "text-[#1a1a2e]" : "text-gray-400"
          )}
        >
          <List size={24} />
          <span className="text-[10px] mt-1 font-medium">My Reports</span>
        </NavLink>
        <NavLink 
          to="/map" 
          className={({ isActive }) => cn(
            "flex flex-col items-center justify-center w-full h-full transition-colors",
            isActive ? "text-[#1a1a2e]" : "text-gray-400"
          )}
        >
          <MapIcon size={24} />
          <span className="text-[10px] mt-1 font-medium">Map</span>
        </NavLink>
      </nav>
    </div>
  );
}
