'use client';

import React from 'react';
import { SourceInfo } from '@/lib/api';

interface SourceCardProps {
  source: SourceInfo;
  index: number;
}

export default function SourceCard({ source, index }: SourceCardProps) {
  return (
    <div className="bg-navy-700 border border-cyan-500/30 rounded-lg p-4 hover:border-cyan-500/50 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-bold">#{index + 1}</span>
          <h4 className="text-white font-semibold">
            {source.product_name || 'Unknown Product'}
          </h4>
        </div>
        {source.catalogue_section && (
          <span className="bg-cyan-600 text-white text-xs px-2 py-1 rounded">
            Section {source.catalogue_section}
          </span>
        )}
      </div>

      <div className="space-y-1 text-sm">
        {source.page_number && (
          <div className="flex items-center gap-2 text-gray-300">
            <span className="text-cyan-400">📄</span>
            <span>Page {source.page_number}</span>
          </div>
        )}

        {source.part_numbers && source.part_numbers.length > 0 && (
          <div className="flex items-center gap-2 text-gray-300">
            <span className="text-cyan-400">🔩</span>
            <span>L.-Nr.: {source.part_numbers.join(', ')}</span>
          </div>
        )}

        {source.material && (
          <div className="flex items-center gap-2 text-gray-300">
            <span className="text-cyan-400">🏷️</span>
            <span>{source.material}</span>
          </div>
        )}

        {source.standards && source.standards.length > 0 && (
          <div className="flex items-center gap-2 text-gray-300">
            <span className="text-cyan-400">✅</span>
            <span>Standards: {source.standards.join(', ')}</span>
          </div>
        )}

        {source.section_name && (
          <div className="text-gray-400 text-xs mt-2">
            {source.section_name}
          </div>
        )}
      </div>
    </div>
  );
}
