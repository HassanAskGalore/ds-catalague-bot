'use client';

import React from 'react';

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
  
  const renderTable = () => {
    if (!tableData || tableData.length === 0) return null;

    // Determine which columns have data
    const hasColumn = (key: keyof TableData) => 
      tableData.some(row => row[key] !== null && row[key] !== undefined);

    return (
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-cyan-500/30">
              {hasColumn('part_number') && (
                <th className="px-3 py-2 text-left font-semibold text-cyan-400">Part Number</th>
              )}
              {hasColumn('product_name') && (
                <th className="px-3 py-2 text-left font-semibold text-cyan-400">Product</th>
              )}
              {hasColumn('material') && (
                <th className="px-3 py-2 text-left font-semibold text-cyan-400">Material</th>
              )}
              {hasColumn('conductor_diameter') && (
                <th className="px-3 py-2 text-left font-semibold text-cyan-400">Conductor Ø (mm)</th>
              )}
              {hasColumn('dimensions') && (
                <th className="px-3 py-2 text-left font-semibold text-cyan-400">Dimensions</th>
              )}
              {hasColumn('breaking_load_kN') && (
                <th className="px-3 py-2 text-right font-semibold text-cyan-400">Breaking Load (kN)</th>
              )}
              {hasColumn('short_circuit_kA') && (
                <th className="px-3 py-2 text-right font-semibold text-cyan-400">Short Circuit (kA)</th>
              )}
              {hasColumn('weight_kg') && (
                <th className="px-3 py-2 text-right font-semibold text-cyan-400">Weight (kg)</th>
              )}
              {hasColumn('page') && (
                <th className="px-3 py-2 text-center font-semibold text-cyan-400">Page</th>
              )}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, idx) => (
              <tr 
                key={idx} 
                className="border-b border-cyan-500/10 hover:bg-cyan-500/5 transition-colors"
              >
                {hasColumn('part_number') && (
                  <td className="px-3 py-2 font-mono text-xs">{row.part_number || '-'}</td>
                )}
                {hasColumn('product_name') && (
                  <td className="px-3 py-2">{row.product_name || '-'}</td>
                )}
                {hasColumn('material') && (
                  <td className="px-3 py-2 text-sm">{row.material || '-'}</td>
                )}
                {hasColumn('conductor_diameter') && (
                  <td className="px-3 py-2 text-center">{row.conductor_diameter || '-'}</td>
                )}
                {hasColumn('dimensions') && (
                  <td className="px-3 py-2 text-sm">{row.dimensions || '-'}</td>
                )}
                {hasColumn('breaking_load_kN') && (
                  <td className="px-3 py-2 text-right font-mono">
                    {row.breaking_load_kN !== null && row.breaking_load_kN !== undefined 
                      ? row.breaking_load_kN 
                      : '-'}
                  </td>
                )}
                {hasColumn('short_circuit_kA') && (
                  <td className="px-3 py-2 text-right font-mono">
                    {row.short_circuit_kA !== null && row.short_circuit_kA !== undefined 
                      ? row.short_circuit_kA 
                      : '-'}
                  </td>
                )}
                {hasColumn('weight_kg') && (
                  <td className="px-3 py-2 text-right font-mono">
                    {row.weight_kg !== null && row.weight_kg !== undefined 
                      ? row.weight_kg 
                      : '-'}
                  </td>
                )}
                {hasColumn('page') && (
                  <td className="px-3 py-2 text-center">
                    <span className="inline-block px-2 py-1 bg-cyan-500/20 rounded text-xs">
                      {row.page || '-'}
                    </span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[90%] rounded-lg px-4 py-3 ${
          isUser
            ? 'bg-cyan-600 text-white'
            : 'bg-navy-700 text-gray-100 border border-cyan-500/20'
        }`}
      >
        <div className="whitespace-pre-wrap break-words">{message}</div>
        
        {format === 'table' && tableData && tableData.length > 0 && renderTable()}
        
        {timestamp && (
          <div className={`text-xs mt-2 ${isUser ? 'text-cyan-100' : 'text-gray-400'}`}>
            {timestamp.toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}
