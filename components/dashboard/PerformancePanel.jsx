// components/dashboard/PerformancePanel.jsx
import { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Line
} from 'recharts';
import { Instagram, Youtube, TikTok, Twitch } from 'lucide-react';
import { getPlatformPerformance } from '@/lib/supabase/queries';

// Platform icon and color mapping
const platformConfig = {
  'Instagram': { 
    icon: <Instagram className="h-6 w-6 text-pink-600 mr-2" />,
    color: '#E1306C',
    bgColor: 'bg-pink-50',
    iconBgColor: 'bg-pink-100',
    textColor: 'text-pink-600'
  },
  'YouTube': {
    icon: <Youtube className="h-6 w-6 text-red-600 mr-2" />,
    color: '#FF0000',
    bgColor: 'bg-red-50',
    iconBgColor: 'bg-red-100',
    textColor: 'text-red-600'
  },
  'TikTok': {
    icon: <TikTok className="h-6 w-6 text-black mr-2" />,
    color: '#000000',
    bgColor: 'bg-gray-50',
    iconBgColor: 'bg-gray-100',
    textColor: 'text-gray-900'
  },
  'Twitch': {
    icon: <Twitch className="h-6 w-6 text-purple-600 mr-2" />,
    color: '#6441A4',
    bgColor: 'bg-purple-50',
    iconBgColor: 'bg-purple-100',
    textColor: 'text-purple-600'
  },
  'Kick': {
    icon: <span className="inline-block h-6 w-6 text-green-600 font-bold mr-2">K</span>,
    color: '#5EAC24',
    bgColor: 'bg-green-50',
    iconBgColor: 'bg-green-100',
    textColor: 'text-green-600'
  }
};

export default function PerformancePanel({ clientId, dateRange, selectedPlatform }) {
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPerformanceData() {
      setLoading(true);
      
      try {
        const platformPerformance = await getPlatformPerformance(
          clientId, 
          dateRange.start, 
          dateRange.end
        );
        
        // Filter by selected platform if needed
        let filteredData = platformPerformance;
        if (selectedPlatform !== 'all') {
          filteredData = platformPerformance.filter(item => item.platform === selectedPlatform);
        }
        
        setPerformanceData(filteredData);
      } catch (error) {
        console.error('Error fetching performance data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchPerformanceData();
  }, [clientId, dateRange, selectedPlatform]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="p-6">
            <div className="h-96 bg-gray-100 rounded animate-pulse"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[1, 2].map((item) => (
            <div key={item} className="bg-white rounded-lg shadow p-6">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="space-y-4">
                <div className="bg-gray-100 p-4 rounded-lg animate-pulse h-24"></div>
                <div className="bg-gray-100 p-4 rounded-lg animate-pulse h-24"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Sort platforms by engagement (higher first)
  const sortedData = [...performanceData].sort((a, b) => parseFloat(b.engagement) - parseFloat(a.engagement));

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Performance Comparison Chart */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Performance by Platform</h3>
        </div>
        <div className="p-6">
          {performanceData.length > 0 ? (
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={performanceData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="platform" />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    yAxisId="left" 
                    dataKey="engagement" 
                    name="Engagement (%)" 
                    fill="#8884d8" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    yAxisId="right" 
                    dataKey="views" 
                    name="Total Views" 
                    fill="#82ca9d" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="posts"
                    name="Number of Posts"
                    stroke="#ff7300"
                    activeDot={{ r: 8 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center">
              <p className="text-gray-500">No performance data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Platform-Specific Metrics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {sortedData.slice(0, 4).map((platformData) => {
          const platform = platformData.platform;
          const config = platformConfig[platform] || {
            icon: null,
            bgColor: 'bg-gray-50',
            iconBgColor: 'bg-gray-100',
            textColor: 'text-gray-900'
          };
          
          return (
            <div key={platform} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                {config.icon ? (
                  <div className={`${config.iconBgColor} rounded-full p-2 mr-2`}>
                    {config.icon}
                  </div>
                ) : (
                  <div className="bg-gray-100 rounded-full p-2 mr-2">
                    <span className="h-6 w-6 text-gray-600 font-bold">{platform.charAt(0)}</span>
                  </div>
                )}
                <h3 className="text-lg font-medium text-gray-900">{platform} Metrics</h3>
              </div>
              
              <div className="space-y-4">
                <div className={`${config.bgColor} p-4 rounded-lg`}>
                  <p className="text-sm font-medium text-gray-500">Engagement Rate</p>
                  <p className="text-2xl font-semibold text-gray-900">{platformData.engagement}%</p>
                  <div className="mt-1 flex items-center">
                    <span className="text-sm text-gray-500">
                      Based on {platformData.posts} {platformData.posts === 1 ? 'post' : 'posts'}
                    </span>
                  </div>
                </div>
                
                <div className={`${config.bgColor} p-4 rounded-lg`}>
                  <p className="text-sm font-medium text-gray-500">Average Views per Post</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {platformData.posts > 0 
                      ? Math.round(platformData.views / platformData.posts).toLocaleString() 
                      : '0'}
                  </p>
                  <div className="mt-1 flex items-center">
                    <span className="text-sm text-gray-500">
                      Total Views: {platformData.views.toLocaleString()}
                    </span>
                  </div>
                </div>
                
                {platform === 'Instagram' && (
                  <div className={`${config.bgColor} p-4 rounded-lg`}>
                    <p className="text-sm font-medium text-gray-500">Story Completion Rate</p>
                    <p className="text-2xl font-semibold text-gray-900">68%</p>
                    <div className="mt-1 flex items-center">
                      <span className={`text-sm ${config.textColor} mr-1`}>+5.2%</span>
                      <span className="text-sm text-gray-500">from previous period</span>
                    </div>
                  </div>
                )}
                
                {(platform === 'YouTube' || platform === 'Twitch' || platform === 'Kick') && (
                  <div className={`${config.bgColor} p-4 rounded-lg`}>
                    <p className="text-sm font-medium text-gray-500">
                      {platform === 'YouTube' ? 'Average Watch Time' : 'Average Viewers'}
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {platform === 'YouTube' ? '4:32' : platformData.reach?.toLocaleString() || '0'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Platform Rankings */}
      {performanceData.length > 1 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Platform Rankings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-500">Highest Engagement</p>
              <div className="mt-2 flex items-center">
                {sortedData.length > 0 && (
                  <>
                    {platformConfig[sortedData[0].platform]?.icon || (
                      <div className="bg-gray-100 rounded-full p-2 mr-2">
                        <span className="h-6 w-6 text-gray-600 font-bold">
                          {sortedData[0].platform.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">{sortedData[0].platform}</p>
                      <p className="text-sm text-gray-500">
                        {sortedData[0].engagement}% engagement rate
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-500">Most Views</p>
              <div className="mt-2 flex items-center">
                {sortedData.length > 0 && (
                  <>
                    {platformConfig[sortedData.sort((a, b) => b.views - a.views)[0].platform]?.icon || (
                      <div className="bg-gray-100 rounded-full p-2 mr-2">
                        <span className="h-6 w-6 text-gray-600 font-bold">
                          {sortedData[0].platform.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">
                        {sortedData.sort((a, b) => b.views - a.views)[0].platform}
                      </p>
                      <p className="text-sm text-gray-500">
                        {sortedData.sort((a, b) => b.views - a.views)[0].views.toLocaleString()} total views
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-500">Most Content</p>
              <div className="mt-2 flex items-center">
                {sortedData.length > 0 && (
                  <>
                    {platformConfig[sortedData.sort((a, b) => b.posts - a.posts)[0].platform]?.icon || (
                      <div className="bg-gray-100 rounded-full p-2 mr-2">
                        <span className="h-6 w-6 text-gray-600 font-bold">
                          {sortedData[0].platform.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">
                        {sortedData.sort((a, b) => b.posts - a.posts)[0].platform}
                      </p>
                      <p className="text-sm text-gray-500">
                        {sortedData.sort((a, b) => b.posts - a.posts)[0].posts} {' '}
                        {sortedData.sort((a, b) => b.posts - a.posts)[0].posts === 1 ? 'post' : 'posts'}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}