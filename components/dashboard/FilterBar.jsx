// components/dashboard/FilterBar.jsx
import { useState, useEffect } from 'react';
import { Filter, Calendar } from 'lucide-react';

export default function FilterBar({ 
  filters, 
  setFilters, 
  campaigns = [], 
  platforms = ['Instagram', 'YouTube', 'TikTok', 'Twitch', 'Kick']
}) {
  // Local state for date range to prevent multiple rerenders
  const [localDateRange, setLocalDateRange] = useState({
    start: filters.dateRange.start,
    end: filters.dateRange.end
  });
  
  // Update filters only when user completes their selection
  const applyDateRange = () => {
    setFilters({
      ...filters,
      dateRange: localDateRange
    });
  };
  
  // Predefined date ranges
  const datePresets = [
    { name: 'Last 7 Days', value: '7d' },
    { name: 'Last 30 Days', value: '30d' },
    { name: 'Last 90 Days', value: '90d' },
    { name: 'This Month', value: 'month' },
    { name: 'This Year', value: 'year' },
    { name: 'Custom', value: 'custom' }
  ];
  
  const [activeDatePreset, setActiveDatePreset] = useState('custom');
  
  // Apply date preset
  const applyDatePreset = (preset) => {
    const today = new Date();
    let start, end;
    
    switch (preset) {
      case '7d':
        start = new Date();
        start.setDate(today.getDate() - 7);
        end = today;
        break;
        
      case '30d':
        start = new Date();
        start.setDate(today.getDate() - 30);
        end = today;
        break;
        
      case '90d':
        start = new Date();
        start.setDate(today.getDate() - 90);
        end = today;
        break;
        
      case 'month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = today;
        break;
        
      case 'year':
        start = new Date(today.getFullYear(), 0, 1);
        end = today;
        break;
        
      case 'custom':
        // Don't change the dates
        return;
        
      default:
        start = new Date();
        start.setDate(today.getDate() - 30);
        end = today;
    }
    
    const newDateRange = {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
    
    setLocalDateRange(newDateRange);
    setFilters({
      ...filters,
      dateRange: newDateRange
    });
    setActiveDatePreset(preset);
  };
  
  // Update local state when filters change externally
  useEffect(() => {
    setLocalDateRange(filters.dateRange);
  }, [filters.dateRange]);

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center bg-gray-100 p-1 rounded-md">
          <Calendar size={16} className="ml-2 text-gray-500" />
          <span className="mx-2 text-sm font-medium text-gray-700">Date Range:</span>
        </div>
        
        {datePresets.map(preset => (
          <button
            key={preset.value}
            onClick={() => applyDatePreset(preset.value)}
            className={`px-3 py-1 text-sm rounded-md ${
              activeDatePreset === preset.value
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {preset.name}
          </button>
        ))}
      </div>
      
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center">
          <Filter size={16} className="mr-2 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters:</span>
        </div>
        
        <div className="flex-1 min-w-[200px]">
          <select 
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
            value={filters.platform}
            onChange={(e) => setFilters({...filters, platform: e.target.value})}
          >
            <option value="all">All Platforms</option>
            {platforms.map(platform => (
              <option key={platform} value={platform}>{platform}</option>
            ))}
          </select>
        </div>
        
        <div className="flex-1 min-w-[200px]">
          <select 
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
            value={filters.campaign}
            onChange={(e) => setFilters({...filters, campaign: e.target.value})}
          >
            <option value="all">All Campaigns</option>
            {campaigns.map(campaign => (
              <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
            ))}
          </select>
        </div>
        
        <div className="flex gap-2 min-w-[320px]">
          <div className="flex-1">
            <label htmlFor="start-date" className="sr-only">Start Date</label>
            <input 
              id="start-date"
              type="date" 
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
              value={localDateRange.start}
              onChange={(e) => {
                setLocalDateRange({...localDateRange, start: e.target.value});
                setActiveDatePreset('custom');
              }}
              onBlur={applyDateRange}
            />
          </div>
          <span className="self-center text-gray-500">to</span>
          <div className="flex-1">
            <label htmlFor="end-date" className="sr-only">End Date</label>
            <input 
              id="end-date"
              type="date" 
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
              value={localDateRange.end}
              onChange={(e) => {
                setLocalDateRange({...localDateRange, end: e.target.value});
                setActiveDatePreset('custom');
              }}
              onBlur={applyDateRange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}