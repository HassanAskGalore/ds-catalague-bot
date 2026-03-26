'use client';

import React from 'react';
import { FileText, Database, Layers, Hash } from 'lucide-react';
import { SourceInfo } from '@/lib/api';

interface SourceCardProps {
  source: SourceInfo;
  index: number;
}

export default function SourceCard({ source, index }: SourceCardProps) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-moss-blue/40 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
      
      {/* Decorative Index Tag */}
      <div className="absolute top-0 right-0 p-1.5 bg-gray-50 text-[10px] font-bold text-gray-300 rounded-bl-xl group-hover:bg-blue-50 group-hover:text-moss-blue transition-colors uppercase tracking-widest">
        REF-{index + 1}
      </div>

      <div className="flex flex-col h-full">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-moss-blue group-hover:bg-moss-blue group-hover:text-white transition-all">
            <Database size={20} />
          </div>
          <div className="flex-1 min-w-0 pr-6">
            <h4 className="text-moss-dark font-bold text-sm leading-tight truncate">
              {source.product_name || 'Unknown Product'}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              {source.catalogue_section && (
                <span className="text-[10px] font-bold text-moss-red uppercase tracking-wide">
                  Section {source.catalogue_section}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {source.page_number && (
            <div className="flex items-center gap-2.5 text-xs text-gray-500 font-medium">
              <FileText size={14} className="text-gray-400" />
              <span>Page {source.page_number}</span>
            </div>
          )}

          {source.part_numbers && source.part_numbers.length > 0 && (
            <div className="flex items-center gap-2.5 text-xs text-gray-500 font-medium">
              <Hash size={14} className="text-gray-400" />
              <span className="truncate">L.-Nr.: {source.part_numbers[0]} {source.part_numbers.length > 1 && `(+${source.part_numbers.length - 1})`}</span>
            </div>
          )}

          {source.material && (
            <div className="flex items-center gap-2.5 text-xs text-gray-500 font-medium">
              <Layers size={14} className="text-gray-400" />
              <span className="truncate">{source.material}</span>
            </div>
          )}
        </div>

        {source.section_name && (
          <div className="mt-4 pt-3 border-t border-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-tighter truncate opacity-60">
            {source.section_name}
          </div>
        )}
      </div>
    </div>
  );
}
