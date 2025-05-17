// components/dashboard/OverviewPanel.jsx
import { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { TrendingUp, Instagram, Youtube, MessageSquare } from 'lucide-react';
import { getPlatformDistribution, getDailyViews, getSummaryStats, getMetricsComparison } from '@/lib/supabase/queries';


const platformColors = {
  'Instagram': '#E1306C',
  'YouTube': '#FF0000',
  'TikTok': '#000000',
  'Twitch': '#6441A4',
  'Kick': '#5EAC24'
};

export default function OverviewPanel({ clientId, dateRange, selectedPlatform }) {
  const [platformData, setPlatformData] = useState([]);
  const [viewsData, setViewsData] = useState([]);
  const [summaryStats, setSummaryStats] = useState({
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    averageEngagement: 0
  });
  const [metricsComparison, setMetricsComparison] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      
      try {
        // Calculate previous period for comparison
        const currentStartDate = new Date(dateRange.start);
        const currentEndDate = new Date(dateRange.end);
        const dayDiff = Math.round((currentEndDate - currentStartDate) / (24 * 60 * 60 * 1000));
        
        const previousEndDate = new Date(currentStartDate);
        previousEndDate.setDate(previousEndDate.getDate() - 1);
        
        const previousStartDate = new Date(previousEndDate);
        previousStartDate.setDate(previousStartDate.getDate() - dayDiff);
        
        // Fetch data in parallel
        const [platformDistribution, dailyViews, stats, comparison] = await Promise.all([
          getPlatformDistribution(clientId, dateRange.start, dateRange.end),
          getDailyViews(clientId, dateRange.start, dateRange.end, selectedPlatform !== 'all' ? selectedPlatform : null),
          getSummaryStats(clientId, dateRange.start, dateRange.end),
          getMetricsComparison(
            clientId,
            dateRange.start,
            dateRange.end,
            previousStartDate.toISOString().split('T')[0],
            previousEndDate.toISOString().split('T')[0],
            selectedPlatform !== 'all' ? selectedPlatform : null
          )
        ]);
        
        setPlatformData(platformDistribution);
        
        // Format daily views data for the chart
        const formattedViewsData = dailyViews.map(item => ({
          date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          views: item.views
        }));
        
        setViewsData(formattedViewsData);
        setSummaryStats(stats);
        setMetricsComparison(comparison);
      } catch (error) {
        console.error('Error fetching overview data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchDashboardData();
  }, [clientId, dateRange, selectedPlatform]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="bg-white rounded-lg shadow p-6">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    );
  }

  // Helper function to display change percentage
  const renderChangePercent = (value) => {
    const rounded = Math.round(value * 10) / 10; // Round to 1 decimal place
    const isPositive = rounded >= 0;
    
    return (
      <span className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'} mr-1`}>
        {isPositive ? '+' : ''}{rounded}%
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Platform Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Platform Distribution</h3>
        <div className="h-64">
          {platformData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value} posts`, 'Count']}
                  labelFormatter={(name) => name}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-gray-500">No data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Daily Views */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Views</h3>
        <div className="h-64">
          {viewsData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={viewsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="views" 
                  stroke="#3B82F6" 
                  fill="#93C5FD" 
                  activeDot={{ r: 8 }} 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-gray-500">No view data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-full p-2 mr-4">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Views</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {summaryStats.totalViews.toLocaleString()}
                </p>
                {metricsComparison && (
                  <div className="mt-1 flex items-center">
                    {renderChangePercent(metricsComparison.changes.views)}
                    <span className="text-sm text-gray-500">from previous period</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-pink-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="bg-pink-100 rounded-full p-2 mr-4">
                <Instagram className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Engagement Rate</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {summaryStats.averageEngagement}%
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="bg-purple-100 rounded-full p-2 mr-4">
                <MessageSquare className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Comments</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {summaryStats.totalComments.toLocaleString()}
                </p>
                {metricsComparison && (
                  <div className="mt-1 flex items-center">
                    {renderChangePercent(metricsComparison.changes.comments)}
                    <span className="text-sm text-gray-500">from previous period</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}