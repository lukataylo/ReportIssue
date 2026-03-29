import React, { useState, useEffect } from 'react';
import { reportService } from '../services/reportService';
import { Report, CATEGORIES } from '../types';
import { format } from 'date-fns';
import { Clock, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function MyReportsScreen() {
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    setReports(reportService.getReports());
  }, []);

  if (reports.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
          <Clock size={32} />
        </div>
        <h3 className="text-lg font-bold text-gray-900">No reports yet</h3>
        <p className="text-sm text-gray-500 mt-2">Your submitted reports will appear here.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">My Reports</h2>
      
      {reports.map((report, index) => {
        const category = CATEGORIES.find(c => c.id === report.categoryId);
        return (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-[14px] border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="p-4 flex items-start gap-4">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${category?.color}15`, color: category?.color }}
              >
                {/* Simplified icon display */}
                <span className="font-bold text-xs">{report.reference.split('-')[0]}</span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-gray-900 truncate">{category?.title}</h3>
                  <span className="text-[10px] text-gray-400 font-mono">{report.reference}</span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-1 mb-2">{report.description}</p>
                <div className="flex items-center gap-2">
                  <span className={report.status === 'resolved' ? 'text-green-600' : 'text-blue-600'}>
                    {report.status === 'resolved' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {report.status}
                  </span>
                  <span className="text-[10px] text-gray-300">•</span>
                  <span className="text-[10px] text-gray-400">
                    {format(report.timestamp, 'dd MMM yyyy, HH:mm')}
                  </span>
                </div>
              </div>
              
              <ChevronRight className="text-gray-300 self-center" size={20} />
            </div>

            {/* Status Timeline (Simplified) */}
            <div className="px-4 pb-4 pt-2 border-t border-gray-50 bg-gray-50/50">
              <div className="flex items-center justify-between relative">
                <div className="absolute left-0 right-0 h-0.5 bg-gray-200 top-1/2 -translate-y-1/2 z-0" />
                
                <div className="z-10 bg-white rounded-full p-1 border border-blue-600">
                  <CheckCircle2 size={10} className="text-blue-600" />
                </div>
                <div className={report.status === 'submitted' ? "z-10 bg-gray-200 rounded-full p-1" : "z-10 bg-white rounded-full p-1 border border-blue-600"}>
                  <Clock size={10} className={report.status === 'submitted' ? "text-gray-400" : "text-blue-600"} />
                </div>
                <div className={report.status === 'resolved' ? "z-10 bg-white rounded-full p-1 border border-green-600" : "z-10 bg-gray-200 rounded-full p-1"}>
                  <CheckCircle2 size={10} className={report.status === 'resolved' ? "text-green-600" : "text-gray-400"} />
                </div>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[8px] font-bold text-blue-600">Submitted</span>
                <span className={report.status === 'submitted' ? "text-[8px] font-bold text-gray-400" : "text-[8px] font-bold text-blue-600"}>In Progress</span>
                <span className={report.status === 'resolved' ? "text-[8px] font-bold text-green-600" : "text-[8px] font-bold text-gray-400"}>Resolved</span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
