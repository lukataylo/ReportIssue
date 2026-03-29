import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES } from '../types';
import * as Icons from 'lucide-react';
import { motion } from 'motion/react';

export default function ReportScreen() {
  const navigate = useNavigate();

  return (
    <div className="p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">What's the issue?</h2>
        <p className="text-gray-500 text-sm">Select a category to start your report</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {CATEGORIES.map((category, index) => {
          const IconComponent = (Icons as any)[category.icon];
          return (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigate(`/report/${category.id}`)}
              className="bg-white p-4 rounded-[14px] shadow-sm border border-gray-100 flex flex-col items-start text-left active:scale-95 transition-transform"
            >
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                style={{ backgroundColor: `${category.color}15`, color: category.color }}
              >
                {IconComponent && <IconComponent size={20} />}
              </div>
              <h3 className="font-bold text-gray-900 leading-tight mb-1">{category.title}</h3>
              <p className="text-[10px] text-gray-400 leading-tight">{category.description}</p>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-[14px] border border-blue-100">
        <div className="flex items-center gap-3 mb-2">
          <Icons.Sparkles className="text-blue-600" size={20} />
          <h4 className="font-bold text-blue-900 text-sm">AI Triage (Beta)</h4>
        </div>
        <p className="text-xs text-blue-700 leading-relaxed">
          Not sure which category? Describe the issue or take a photo and our AI will route it for you.
        </p>
        <button className="mt-3 w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-bold">
          Try AI Triage
        </button>
      </div>
    </div>
  );
}
