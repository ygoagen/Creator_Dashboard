// components/dashboard/Dashboard.jsx
'use client';

import { useState, useEffect } from 'react';
import { getClientCampaigns } from '@/lib/supabase/queries';
import FilterBar from './FilterBar';
import OverviewPanel from './OverviewPanel';
import PerformancePanel from './PerformancePanel';
import ContentTable from './ContentTable';
import { getClientContent, getContentMetrics } from '@/lib/supabase/queries';

export default function Dashboard({ clientId, clientName }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({
    platform: 'all',
    campaign: 'all',
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
      end: new Date().toISOString().split('T')[0], // today
    },
  });
  const [contentItems, setContentItems] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contentSort, setContentSort] = useState({ key: 'post_date', direction: 'desc' });

  // Fetch campaigns for dropdown
  useEffect(() => {
    async function fetchCampaigns() {
      try {
        const campaignsData = await getClientCampaigns(clientId);
        setCampaigns(campaignsData);
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      }
    }
    
    fetchCampaigns();
  }, [clientId]);

  // Fetch content items for Content tab
  useEffect(() => {
    async function fetchContentItems() {
      if (activeTab !== 'content') return;
      
      setLoading(true);
      
      try {
        // Prepare filter parameters
        const params = {
          clientId,
          platform: filters.platform !== 'all' ? filters.platform : null,
          campaignId: filters.campaign !== 'all' ? filters.campaign : null,
          startDate: filters.dateRange.start,
          endDate: filters.dateRange.end
        };
        
        // Fetch content items
        const { data: items } = await getClientContent(params);
        
        if (items.length === 0) {
          setContentItems([]);
          setLoading(false);
          return;
        }
        
        // Get content IDs to fetch metrics
        const contentIds = items.map(item => item.id);
        
        // Fetch metrics for these content items
        const metricsMap = await getContentMetrics(contentIds);
        
        // Add metrics to content items
        const contentWithMetrics = items.map(item => ({
          ...item,
          metrics: metricsMap[item.id] || {}
        }));
        
        // Sort content items
        const sortedContent = sortContent(contentWithMetrics, contentSort);
        
        setContentItems(sortedContent);
      } catch (error) {
        console.error('Error fetching content items:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchContentItems();
  }, [clientId, filters, activeTab, contentSort]);

  // Helper function to sort content items
  const sortContent = (items, sortConfig) => {
    return [...items].sort((a, b) => {
      if (a[sortConfig.key] === null) return 1;
      if (b[sortConfig.key] === null) return -1;
      
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (sortConfig.key === 'post_date') {
        // Date comparison
        const dateA = new Date(aValue);
        const dateB = new Date(bValue);
        
        return sortConfig.direction === 'asc' 
          ? dateA - dateB 
          : dateB - dateA;
      }
      
      // String or number comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      // Default comparison
      return sortConfig.direction === 'asc'
        ? aValue - bValue
        : bValue - aValue;
    });
  };

  // Handle sort change in content table
  const handleSortChange = (newSort) => {
    setContentSort(newSort);
  };


  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">Social Media Analytics</h1>
              </div>
            </div>
            <div className="flex items-center">
              <div className="ml-3 relative">
                <div>
                  <span className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700">
                    Client: {clientName}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <FilterBar 
          filters={filters} 
          setFilters={setFilters} 
          campaigns={campaigns}
        />

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-4" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-2 font-medium text-sm rounded-md ${
                activeTab === 'overview'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`px-3 py-2 font-medium text-sm rounded-md ${
                activeTab === 'performance'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Performance
            </button>
            <button
              onClick={() => setActiveTab('content')}
              className={`px-3 py-2 font-medium text-sm rounded-md ${
                activeTab === 'content'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Content
            </button>
          </nav>
        </div>

        {/* Dashboard Panels */}
        {activeTab === 'overview' && (
          <OverviewPanel 
            clientId={clientId} 
            dateRange={filters.dateRange}
            selectedPlatform={filters.platform}
          />
        )}
        
        {activeTab === 'performance' && (
          <PerformancePanel 
            clientId={clientId} 
            dateRange={filters.dateRange}
            selectedPlatform={filters.platform}
          />
        )}
        
        {activeTab === 'content' && (
          <ContentTable 
            contentItems={contentItems} 
            loading={loading}
            onSortChange={handleSortChange}
            sortConfig={contentSort}
          />
        )}
      </main>
    </div>
  );
}