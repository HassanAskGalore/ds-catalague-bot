'use client';

import React from 'react';
import { Filter, XCircle, Search, Layers, TableProperties, FileSearch, SlidersHorizontal } from 'lucide-react';

interface SearchFiltersProps {
  filters: {
    product_type?: string;
    catalogue_section?: string;
    has_table?: boolean;
  };
  showSources: boolean;
  onFilterChange: (filters: any) => void;
  onShowSourcesChange: (show: boolean) => void;
}

export default function SearchFilters({ filters, showSources, onFilterChange, onShowSourcesChange }: SearchFiltersProps) {
  const productTypes = [
    'all',
    'clamp',
    'insulator',
    'connector',
    'horn',
    'bolt',
    'damper',
    'tie',
    'eye',
  ];

  const handleProductTypeChange = (type: string) => {
    const newFilters = { ...filters };
    if (type === 'all') {
      delete newFilters.product_type;
    } else {
      newFilters.product_type = type;
    }
    onFilterChange(newFilters);
  };

  const handleSectionChange = (section: string) => {
    const newFilters = { ...filters };
    if (section === 'all') {
      delete newFilters.catalogue_section;
    } else {
      newFilters.catalogue_section = section;
    }
    onFilterChange(newFilters);
  };

  const handleTableToggle = () => {
    const newFilters = { ...filters };
    if (filters.has_table === undefined) {
      newFilters.has_table = true;
    } else {
      delete newFilters.has_table;
    }
    onFilterChange(newFilters);
  };

  return (
    <div className="space-y-8 py-2">
      <div className="flex items-center gap-2.5 mb-6">
        <Filter size={18} className="text-moss-blue" />
        <h3 className="text-sm font-bold text-moss-dark uppercase tracking-widest">Search Control</h3>
      </div>

      {/* Product Type Group */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
          <Layers size={12} />
          <span>Product Classification</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {productTypes.map((type) => (
            <button
              key={type}
              onClick={() => handleProductTypeChange(type)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                (filters.product_type === type || (!filters.product_type && type === 'all'))
                  ? 'bg-moss-blue text-white border-moss-blue shadow-md shadow-moss-blue/20'
                  : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Catalogue Section Group */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
          <Search size={12} />
          <span>Catalogue Region</span>
        </div>
        <select
          value={filters.catalogue_section || 'all'}
          onChange={(e) => handleSectionChange(e.target.value)}
          className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm text-moss-dark font-semibold focus:outline-none focus:ring-2 focus:ring-moss-blue/20 transition-all cursor-pointer appearance-none shadow-sm"
        >
          <option value="all">All Sections</option>
          <option value="17">Section 17 - Distribution OHL</option>
          <option value="19">Section 19 - ABC Systems</option>
        </select>
      </div>

      {/* Toggles Group */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
          <SlidersHorizontal size={12} />
          <span>Display Preferences</span>
        </div>
        
        <label className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors group shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg transition-colors ${filters.has_table ? 'bg-moss-blue/10 text-moss-blue' : 'bg-gray-50 text-gray-400'}`}>
              <TableProperties size={18} />
            </div>
            <span className="text-xs font-bold text-moss-dark">Data Tables Only</span>
          </div>
          <input type="checkbox" checked={filters.has_table || false} onChange={handleTableToggle} className="w-5 h-5 accent-moss-blue rounded-lg border-gray-200" />
        </label>

        <label className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors group shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg transition-colors ${showSources ? 'bg-moss-blue/10 text-moss-blue' : 'bg-gray-50 text-gray-400'}`}>
              <FileSearch size={18} />
            </div>
            <span className="text-xs font-bold text-moss-dark">Show Citations</span>
          </div>
          <input type="checkbox" checked={showSources} onChange={(e) => onShowSourcesChange(e.target.checked)} className="w-5 h-5 accent-moss-blue rounded-lg border-gray-200" />
        </label>
      </div>

      {/* Clear Action */}
      {(filters.product_type || filters.catalogue_section || filters.has_table) && (
        <button
          onClick={() => onFilterChange({})}
          className="w-full mt-10 flex items-center justify-center gap-2 py-4 bg-moss-red/5 hover:bg-moss-red text-moss-red hover:text-white rounded-2xl transition-all font-bold text-xs uppercase tracking-widest border border-moss-red/10 group active:scale-95"
        >
          <XCircle size={16} className="group-hover:rotate-90 transition-transform" />
          <span>Reset Parameters</span>
        </button>
      )}
    </div>
  );
}
