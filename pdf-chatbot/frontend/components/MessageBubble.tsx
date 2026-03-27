'use client';

import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface TableData {
  part_number?: string | null;
  product_name?: string | null;
  material?: string | null;
  conductor_diameter?: string | null;
  dimensions?: string | null;
  breaking_load_kN?: number | null;
  short_circuit_kA?: number | null;
  weight_kg?: number | null;
  page?: number | null;
}

interface MessageBubbleProps {
  message: string;
  isUser: boolean;
  timestamp?: Date;
  format?: 'text' | 'table';
  tableData?: TableData[];
}

export default function MessageBubble({ 
  message, 
  isUser, 
  timestamp,
  format = 'text',
  tableData 
}: MessageBubbleProps) {
  
  const [isPlaying, setIsPlaying] = useState(false);
  const toggleTTS = () => setIsPlaying(!isPlaying);

  const formatMessage = (text: string) => {
    let formatted = text;
    
    // Remove all emojis (using surrogate pairs)
    formatted = formatted.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '');
    formatted = formatted.replace(/[\u2600-\u26FF]/g, '');
    formatted = formatted.replace(/[\u2700-\u27BF]/g, '');
    
    // Convert newlines to <br/> FIRST
    formatted = formatted.replace(/\n/g, '<br/>');
    
    // Format markdown bold (must come before italic)
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-moss-dark">$1</strong>');
    
    // Format markdown italic
    formatted = formatted.replace(/\*(.+?)\*(?!\*)/g, '<em>$1</em>');
    
    // Format headers
    formatted = formatted.replace(/^###\s+(.+?)(<br\/>|$)/gm, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>');
    formatted = formatted.replace(/^##\s+(.+?)(<br\/>|$)/gm, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>');
    formatted = formatted.replace(/^#\s+(.+?)(<br\/>|$)/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>');
    
    // Format numbered lists - handle "1. **Title:** Description" pattern
    formatted = formatted.replace(/(\d+)\.\s+\*\*(.+?)\*\*:\s*(.+?)(<br\/>|$)/g, 
      '<div class="my-3 pl-2"><span class="font-bold text-moss-blue">$1. $2:</span> $3</div>');
    
    // Format simple numbered lists "1. Text"
    formatted = formatted.replace(/^(\d+)\.\s+(.+?)(<br\/>|$)/gm, 
      '<div class="my-2 pl-2"><span class="font-bold text-moss-blue">$1.</span> $2</div>');
    
    // Format bullet points
    formatted = formatted.replace(/^[•\-]\s+(.+?)(<br\/>|$)/gm, '<li class="ml-4 my-1">$1</li>');
    
    return formatted;
  };

  const renderTable = () => {
    if (!tableData || tableData.length === 0) return null;
    const hasColumn = (key: keyof TableData) => tableData.some(row => row[key] !== null && row[key] !== undefined);

    return (
      <div className="mt-4 overflow-hidden rounded-xl border border-gray-100 shadow-sm bg-gray-50/50">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100/80 backdrop-blur-sm">
                {hasColumn('part_number') && <th className="px-4 py-3 text-left font-bold text-moss-dark uppercase tracking-wider text-[10px]">Part #</th>}
                {hasColumn('product_name') && <th className="px-4 py-3 text-left font-bold text-moss-dark uppercase tracking-wider text-[10px]">Product</th>}
                {hasColumn('material') && <th className="px-4 py-3 text-left font-bold text-moss-dark uppercase tracking-wider text-[10px]">Material</th>}
                {hasColumn('conductor_diameter') && <th className="px-4 py-3 text-center font-bold text-moss-dark uppercase tracking-wider text-[10px]">Ø (mm)</th>}
                {hasColumn('dimensions') && <th className="px-4 py-3 text-left font-bold text-moss-dark uppercase tracking-wider text-[10px]">Dimensions</th>}
                {hasColumn('breaking_load_kN') && <th className="px-4 py-3 text-right font-bold text-moss-dark uppercase tracking-wider text-[10px]">Load (kN)</th>}
                {hasColumn('short_circuit_kA') && <th className="px-4 py-3 text-right font-bold text-moss-dark uppercase tracking-wider text-[10px]">Short Cct</th>}
                {hasColumn('weight_kg') && <th className="px-4 py-3 text-right font-bold text-moss-dark uppercase tracking-wider text-[10px]">Weight</th>}
                {hasColumn('page') && <th className="px-4 py-3 text-center font-bold text-moss-dark uppercase tracking-wider text-[10px]">Pg</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tableData.map((row, idx) => (
                <tr key={idx} className="hover:bg-white transition-colors group/row">
                  {hasColumn('part_number') && <td className="px-4 py-3 font-mono text-[11px] text-moss-blue font-bold">{row.part_number || '-'}</td>}
                  {hasColumn('product_name') && <td className="px-4 py-3 font-medium text-gray-700">{row.product_name || '-'}</td>}
                  {hasColumn('material') && <td className="px-4 py-3 text-gray-500">{row.material || '-'}</td>}
                  {hasColumn('conductor_diameter') && <td className="px-4 py-3 text-center text-gray-500">{row.conductor_diameter || '-'}</td>}
                  {hasColumn('dimensions') && <td className="px-4 py-3 text-gray-500">{row.dimensions || '-'}</td>}
                  {hasColumn('breaking_load_kN') && <td className="px-4 py-3 text-right font-mono text-gray-600">{row.breaking_load_kN || '-'}</td>}
                  {hasColumn('short_circuit_kA') && <td className="px-4 py-3 text-right font-mono text-gray-600">{row.short_circuit_kA || '-'}</td>}
                  {hasColumn('weight_kg') && <td className="px-4 py-3 text-right font-mono text-gray-600">{row.weight_kg || '-'}</td>}
                  {hasColumn('page') && (
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-moss-blue bg-blue-50 px-2 py-0.5 rounded">
                        {row.page}
                      </span>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 group`}>
      <div className="relative max-w-[85%] lg:max-w-[75%]">
        {isUser ? (
          <div className="bg-moss-dark text-white rounded-2xl rounded-tr-sm px-5 py-4 shadow-lg shadow-black/5 font-medium leading-relaxed">
            {message}
          </div>
        ) : (
          <div className="bg-white border border-gray-200/60 rounded-2xl rounded-tl-sm px-6 py-5 shadow-sm leading-relaxed text-gray-800 relative">
            <div className="break-words prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: formatMessage(message) }} />
            {format === 'table' && tableData && tableData.length > 0 && renderTable()}
            <div className="absolute -right-12 top-0 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={toggleTTS} className={`p-2 rounded-xl border border-gray-200 transition-all hover:scale-105 shadow-sm ${isPlaying ? 'bg-moss-blue text-white' : 'bg-white text-gray-400 hover:text-moss-dark'}`}>
                {isPlaying ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            </div>
          </div>
        )}
        {timestamp && (
          <div className={`text-[10px] uppercase tracking-widest font-bold mt-2 opacity-40 ${isUser ? 'text-right pr-1' : 'pl-1'}`}>
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  );
}
