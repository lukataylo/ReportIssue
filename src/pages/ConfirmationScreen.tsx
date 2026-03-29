import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Home } from 'lucide-react';
import { motion } from 'motion/react';
import { Report } from '../types';

export default function ConfirmationScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const report = location.state?.report as Report;

  if (!report) {
    return <div className="p-8 text-center">No report data found.</div>;
  }

  return (
    <div className="p-6 flex flex-col items-center text-center min-h-full">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6"
      >
        <CheckCircle2 size={48} />
      </motion.div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">Report Submitted!</h2>
      <p className="text-gray-500 mb-8">Thank you for helping keep Southwark safe and clean.</p>

      <div className="w-full space-y-4 mb-8">
        <div className="bg-white p-4 rounded-[14px] border border-gray-100 text-left shadow-sm">
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Reference Number</p>
          <p className="text-lg font-mono font-bold text-[#1a1a2e]">{report.reference}</p>
        </div>

        <div className="bg-white p-4 rounded-[14px] border border-gray-100 text-left shadow-sm">
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Routed To</p>
          <p className="text-sm font-bold text-gray-900">{report.routingService}</p>
        </div>

        <div className="bg-blue-50 p-4 rounded-[14px] border border-blue-100 text-left">
          <p className="text-[10px] text-blue-400 uppercase font-bold tracking-wider mb-1">What happens next?</p>
          <p className="text-xs text-blue-900 leading-relaxed font-medium">
            {report.explainer}
          </p>
        </div>
      </div>

      <div className="w-full space-y-3">
        <button
          onClick={() => navigate('/my-reports')}
          className="w-full py-4 bg-[#1a1a2e] text-white rounded-[14px] font-bold flex items-center justify-center gap-2"
        >
          View My Reports <ArrowRight size={18} />
        </button>
        <button
          onClick={() => navigate('/report')}
          className="w-full py-4 bg-white text-[#1a1a2e] border border-gray-200 rounded-[14px] font-bold flex items-center justify-center gap-2"
        >
          <Home size={18} /> Back to Home
        </button>
      </div>
    </div>
  );
}
