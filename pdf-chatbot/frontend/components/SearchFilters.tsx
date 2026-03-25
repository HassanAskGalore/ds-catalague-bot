'use client';

import React from 'react';

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
    <div className="bg-navy-800 border border-cyan-500/20 rounded-lg p-4 space-y-4">
      <h3 className="text-cyan-400 font-semibold mb-3">Filters</h3>

      {/* Product Type */}
      <div>
        <label className="text-gray-300 text-sm mb-2 block">Product Type</label>
        <select
          value={filters.product_type || 'all'}
          onChange={(e) => handleProductTypeChange(e.target.value)}
          className="w-full bg-navy-700 border border-cyan-500/30 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
        >
          {productTypes.map((type) => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Catalogue Section */}
      <div>
        <label className="text-gray-300 text-sm mb-2 block">Catalogue Section</label>
        <select
          value={filters.catalogue_section || 'all'}
          onChange={(e) => handleSectionChange(e.target.value)}
          className="w-full bg-navy-700 border border-cyan-500/30 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
        >
          <option value="all">All Sections</option>
          <option value="17">Section 17 - Distribution OHL</option>
          <option value="19">Section 19 - ABC Systems</option>
        </select>
      </div>

      {/* Has Table Toggle */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="has-table"
          checked={filters.has_table || false}
          onChange={handleTableToggle}
          className="w-4 h-4 accent-cyan-500"
        />
        <label htmlFor="has-table" className="text-gray-300 text-sm">
          Only show products with tables
        </label>
      </div>

      {/* Show Sources Toggle */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="show-sources"
          checked={showSources}
          onChange={(e) => onShowSourcesChange(e.target.checked)}
          className="w-4 h-4 accent-cyan-500"
        />
        <label htmlFor="show-sources" className="text-gray-300 text-sm">
          Show source references
        </label>
      </div>

      {/* Clear Filters */}
      {(filters.product_type || filters.catalogue_section || filters.has_table) && (
        <button
          onClick={() => onFilterChange({})}
          className="w-full bg-navy-700 hover:bg-navy-600 text-cyan-400 py-2 rounded transition-colors text-sm"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );
}
