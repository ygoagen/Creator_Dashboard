// components/dashboard/ContentTable.jsx
import { useState } from 'react';
import { Instagram, Youtube, TikTok, Twitch } from 'lucide-react';

// Platform icon mapping
const PlatformIcon = ({ platform }) => {
  switch (platform) {
    case 'Instagram':
      return <Instagram className="h-5 w-5 text-pink-500" />;
    case 'YouTube':
      return <Youtube className="h-5 w-5 text-red-500" />;
    case 'TikTok':
      return <TikTok className="h-5 w-5 text-black" />;
    case 'Twitch':
      return <Twitch className="h-5 w-5 text-purple-500" />;
    case 'Kick':
      return <span className="h-5 w-5 text-green-500 font-bold">K</span>;
    default:
      return null;
  }
};

// Get relevant metrics based on platform and content type
const getRelevantMetrics = (content) => {
  const { platform, content_type, metrics = {} } = content;
  
  const relevantMetrics = [];
  
  if (platform === 'Instagram') {
    if (content_type === 'Post' || content_type === 'Reel') {
      if (metrics.views) relevantMetrics.push({ name: 'Views', value: metrics.views });
      if (metrics.likes) relevantMetrics.push({ name: 'Likes', value: metrics.likes });
      if (metrics.comments) relevantMetrics.push({ name: 'Comments', value: metrics.comments });
    } else if (content_type === 'Story') {
      if (metrics.views) relevantMetrics.push({ name: 'Views', value: metrics.views });
      if (metrics.clicks) relevantMetrics.push({ name: 'Link Clicks', value: metrics.clicks });
    }
  } else if (platform === 'YouTube' || platform === 'TikTok') {
    if (metrics.views) relevantMetrics.push({ name: 'Views', value: metrics.views });
    if (metrics.likes) relevantMetrics.push({ name: 'Likes', value: metrics.likes });
    if (metrics.comments) relevantMetrics.push({ name: 'Comments', value: metrics.comments });
    if (metrics.hours) relevantMetrics.push({ name: 'Hours Watched', value: metrics.hours });
  } else if (platform === 'Twitch' || platform === 'Kick') {
    if (metrics.avgViewers) relevantMetrics.push({ name: 'Avg Viewers', value: metrics.avgViewers });
    if (metrics.peakViewers) relevantMetrics.push({ name: 'Peak Viewers', value: metrics.peakViewers });
    if (metrics.hours) relevantMetrics.push({ name: 'Hours Watched', value: metrics.hours });
  }
  
  return relevantMetrics;
};

export default function ContentTable({ 
  contentItems = [], 
  loading = false,
  onSortChange = () => {},
  sortConfig = { key: 'post_date', direction: 'desc' } 
}) {
  const [expandedRow, setExpandedRow] = useState(null);
  
  const toggleExpandRow = (id) => {
    if (expandedRow === id) {
      setExpandedRow(null);
    } else {
      setExpandedRow(id);
    }
  };
  
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    onSortChange({ key, direction });
  };
  
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <span className="ml-1">⇵</span>;
    }
    return sortConfig.direction === 'asc' ? <span className="ml-1">↑</span> : <span className="ml-1">↓</span>;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Content Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <div className="p-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-2 text-gray-700">Loading content data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!contentItems.length) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Content Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <div className="p-8 text-center">
            <p className="text-gray-500">No content found for the selected filters.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Content Performance</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('content_name')}
              >
                Content
                {getSortIcon('content_name')}
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('platform')}
              >
                Platform
                {getSortIcon('platform')}
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('content_type')}
              >
                Type
                {getSortIcon('content_type')}
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('post_date')}
              >
                Date
                {getSortIcon('post_date')}
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('campaign_name')}
              >
                Campaign
                {getSortIcon('campaign_name')}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Metrics
              </th>
              <th scope="col" className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {contentItems.map((content) => (
              <>
                <tr key={content.id} className={expandedRow === content.id ? 'bg-blue-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {content.content_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <PlatformIcon platform={content.platform} />
                      <span className="ml-2">{content.platform}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {content.content_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(content.post_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {content.campaign_name || 'No Campaign'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getRelevantMetrics(content).map((metric, i) => (
                      <span key={i} className="mr-3">
                        {metric.name}: <span className="font-semibold">{Number(metric.value).toLocaleString()}</span>
                      </span>
                    ))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-center">
                    <button
                      onClick={() => toggleExpandRow(content.id)}
                      className="text-blue-600 hover:text-blue-900 focus:outline-none"
                    >
                      {expandedRow === content.id ? 'Hide' : 'Show'}
                    </button>
                  </td>
                </tr>
                {expandedRow === content.id && (
                  <tr className="bg-blue-50">
                    <td colSpan="7" className="px-6 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Content Details</h4>
                          <div className="bg-white p-4 rounded shadow-sm">
                            {content.content_url && (
                              <p className="mb-2">
                                <span className="font-medium">URL: </span>
                                <a 
                                  href={content.content_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  {content.content_url}
                                </a>
                              </p>
                            )}
                            <p className="mb-2"><span className="font-medium">Platform: </span>{content.platform}</p>
                            <p className="mb-2"><span className="font-medium">Type: </span>{content.content_type}</p>
                            <p className="mb-2">
                              <span className="font-medium">Posted: </span>
                              {new Date(content.post_date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Performance Metrics</h4>
                          <div className="bg-white p-4 rounded shadow-sm">
                            <div className="grid grid-cols-2 gap-2">
                              {getRelevantMetrics(content).map((metric, i) => (
                                <div key={i} className="bg-gray-50 p-3 rounded">
                                  <p className="text-sm text-gray-500">{metric.name}</p>
                                  <p className="text-lg font-semibold">{Number(metric.value).toLocaleString()}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}