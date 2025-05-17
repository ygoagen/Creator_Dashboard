// lib/supabase/queries.js
// This file contains the core data-fetching functions for the dashboard

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Initialize the Supabase client
const supabase = createClientComponentClient();

/**
 * Fetch client information for the authenticated user
 */
export async function getClientInfo() {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  // Get client ID associated with this user
  const { data: clientUser } = await supabase
    .from('client_users')
    .select('client_id')
    .eq('user_id', user.id)
    .single();
    
  if (!clientUser) return null;
  
  // Get client info
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientUser.client_id)
    .single();
    
  return client;
}

/**
 * Fetch campaigns for a client
 * @param {string} clientId - The client ID
 */
export async function getClientCampaigns(clientId) {
  const { data, error } = await supabase
    .from('campaigns')
    .select('id, name, start_date, end_date')
    .eq('client_id', clientId)
    .order('start_date', { ascending: false });
    
  if (error) {
    console.error('Error fetching campaigns:', error);
    return [];
  }
  
  return data;
}

/**
 * Fetch social media content for a client with optional filters
 * @param {Object} params - Filter parameters
 */
export async function getClientContent({
  clientId,
  platform = null,
  campaignId = null,
  startDate = null,
  endDate = null,
  limit = 100,
  page = 0
}) {
  // Build query
  let query = supabase
    .from('content_items')
    .select(`
      id, 
      content_name, 
      platform, 
      content_type, 
      content_url,
      post_date,
      campaign_id,
      campaigns(name)
    `)
    .eq('client_id', clientId);
  
  // Apply filters
  if (platform) {
    query = query.eq('platform', platform);
  }
  
  if (campaignId) {
    query = query.eq('campaign_id', campaignId);
  }
  
  if (startDate) {
    query = query.gte('post_date', startDate);
  }
  
  if (endDate) {
    query = query.lte('post_date', endDate);
  }
  
  // Pagination
  query = query
    .order('post_date', { ascending: false })
    .range(page * limit, (page + 1) * limit - 1);
  
  const { data, error, count } = await query;
  
  if (error) {
    console.error('Error fetching content:', error);
    return { data: [], count: 0 };
  }
  
  // Process data to include campaign name
  const processedData = data.map(item => ({
    ...item,
    campaign_name: item.campaigns?.name || 'No Campaign'
  }));
  
  return { data: processedData, count };
}

/**
 * Fetch metrics for specified content items
 * @param {Array} contentIds - Array of content item IDs
 */
export async function getContentMetrics(contentIds) {
  if (!contentIds.length) return {};
  
  const { data, error } = await supabase
    .from('metrics')
    .select('content_id, metric_name, metric_value')
    .in('content_id', contentIds);
    
  if (error) {
    console.error('Error fetching metrics:', error);
    return {};
  }
  
  // Organize metrics by content ID
  const metricsMap = {};
  
  data.forEach(metric => {
    if (!metricsMap[metric.content_id]) {
      metricsMap[metric.content_id] = {};
    }
    
    metricsMap[metric.content_id][metric.metric_name] = metric.metric_value;
  });
  
  return metricsMap;
}

/**
 * Fetch platform distribution statistics
 * @param {string} clientId - The client ID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 */
export async function getPlatformDistribution(clientId, startDate, endDate) {
  // Using Postgres aggregate syntax in the select statement
  const { data, error } = await supabase
    .rpc('get_platform_counts', { 
      client_id: clientId,
      start_date: startDate,
      end_date: endDate
    });
    
  if (error) {
    console.error('Error fetching platform distribution:', error);
    
    // Fallback to client-side grouping if RPC fails
    const { data: rawData, error: fetchError } = await supabase
      .from('content_items')
      .select('platform')
      .eq('client_id', clientId)
      .gte('post_date', startDate)
      .lte('post_date', endDate);
      
    if (fetchError || !rawData) {
      console.error('Fallback query also failed:', fetchError);
      return [];
    }
    
    // Count platforms in JavaScript
    const platformCounts = {};
    rawData.forEach(item => {
      if (!platformCounts[item.platform]) {
        platformCounts[item.platform] = 0;
      }
      platformCounts[item.platform]++;
    });
    
    // Map platform colors
    const platformColors = {
      'Instagram': '#E1306C',
      'YouTube': '#FF0000',
      'TikTok': '#000000',
      'Twitch': '#6441A4',
      'Kick': '#5EAC24'
    };
    
    // Convert to the required format
    return Object.keys(platformCounts).map(platform => ({
      name: platform,
      value: platformCounts[platform],
      color: platformColors[platform] || '#888888'
    }));
  }
  
  // Map platform colors
  const platformColors = {
    'Instagram': '#E1306C',
    'YouTube': '#FF0000',
    'TikTok': '#000000',
    'Twitch': '#6441A4',
    'Kick': '#5EAC24'
  };
  
  return data.map(item => ({
    name: item.platform,
    value: parseInt(item.count),
    color: platformColors[item.platform] || '#888888'
  }));
}

/**
 * Get daily views over a time period
 * @param {string} clientId - The client ID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @param {string} platform - Optional platform filter
 */
export async function getDailyViews(clientId, startDate, endDate, platform = null) {
  // Get all content in date range
  let query = supabase
    .from('content_items')
    .select('id, post_date, platform')
    .eq('client_id', clientId)
    .gte('post_date', startDate)
    .lte('post_date', endDate);
    
  if (platform) {
    query = query.eq('platform', platform);
  }
  
  const { data: contentItems, error: contentError } = await query;
  
  if (contentError) {
    console.error('Error fetching content for views:', contentError);
    return [];
  }
  
  if (!contentItems.length) return [];
  
  // Get all views metrics for these content items
  const contentIds = contentItems.map(item => item.id);
  
  const { data: metrics, error: metricsError } = await supabase
    .from('metrics')
    .select('content_id, metric_value')
    .in('content_id', contentIds)
    .eq('metric_name', 'views');
    
  if (metricsError) {
    console.error('Error fetching views metrics:', metricsError);
    return [];
  }
  
  // Create a map of content ID to views
  const viewsMap = {};
  metrics.forEach(metric => {
    viewsMap[metric.content_id] = metric.metric_value;
  });
  
  // Create a map of date to total views
  const dateMap = {};
  contentItems.forEach(item => {
    const date = item.post_date;
    const views = viewsMap[item.id] || 0;
    
    if (!dateMap[date]) {
      dateMap[date] = 0;
    }
    
    dateMap[date] += parseInt(views);
  });
  
  // Convert to array and sort by date
  const result = Object.entries(dateMap).map(([date, views]) => ({
    date,
    views
  }));
  
  result.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  return result;
}

/**
 * Get summary statistics
 * @param {string} clientId - The client ID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 */
export async function getSummaryStats(clientId, startDate, endDate) {
  // Get content items in date range
  const { data: contentItems, error: contentError } = await supabase
    .from('content_items')
    .select('id, platform, content_type')
    .eq('client_id', clientId)
    .gte('post_date', startDate)
    .lte('post_date', endDate);
    
  if (contentError) {
    console.error('Error fetching content for summary:', contentError);
    return null;
  }
  
  if (!contentItems.length) {
    return {
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      averageEngagement: 0
    };
  }
  
  // Get all metrics for these content items
  const contentIds = contentItems.map(item => item.id);
  
  const { data: metrics, error: metricsError } = await supabase
    .from('metrics')
    .select('metric_name, metric_value')
    .in('content_id', contentIds);
    
  if (metricsError) {
    console.error('Error fetching metrics for summary:', metricsError);
    return null;
  }
  
  // Calculate summary stats
  let totalViews = 0;
  let totalLikes = 0;
  let totalComments = 0;
  
  metrics.forEach(metric => {
    const value = parseFloat(metric.metric_value) || 0;
    
    if (metric.metric_name === 'views') {
      totalViews += value;
    } else if (metric.metric_name === 'likes') {
      totalLikes += value;
    } else if (metric.metric_name === 'comments') {
      totalComments += value;
    }
  });
  
  // Calculate engagement rate (simple formula: (likes + comments) / views)
  let averageEngagement = 0;
  if (totalViews > 0) {
    averageEngagement = ((totalLikes + totalComments) / totalViews) * 100;
  }
  
  return {
    totalViews,
    totalLikes,
    totalComments,
    averageEngagement: averageEngagement.toFixed(2)
  };
}

/**
 * Get performance comparison by platform
 * @param {string} clientId - The client ID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 */
export async function getPlatformPerformance(clientId, startDate, endDate) {
  // Get content by platform
  const { data: platforms, error: platformError } = await supabase
    .from('content_items')
    .select('platform, count')
    .eq('client_id', clientId)
    .gte('post_date', startDate)
    .lte('post_date', endDate)
    .group('platform');
    
  if (platformError) {
    console.error('Error fetching platforms:', platformError);
    return [];
  }
  
  const result = [];
  
  // For each platform, get metrics
  for (const platform of platforms) {
    // Get content for this platform
    const { data: contentItems, error: contentError } = await supabase
      .from('content_items')
      .select('id')
      .eq('client_id', clientId)
      .eq('platform', platform.platform)
      .gte('post_date', startDate)
      .lte('post_date', endDate);
      
    if (contentError) {
      console.error(`Error fetching content for ${platform.platform}:`, contentError);
      continue;
    }
    
    if (!contentItems.length) continue;
    
    const contentIds = contentItems.map(item => item.id);
    
    // Get all metrics for these content items
    const { data: metrics, error: metricsError } = await supabase
      .from('metrics')
      .select('metric_name, metric_value')
      .in('content_id', contentIds);
      
    if (metricsError) {
      console.error(`Error fetching metrics for ${platform.platform}:`, metricsError);
      continue;
    }
    
    // Calculate platform stats
    let views = 0;
    let likes = 0;
    let comments = 0;
    
    metrics.forEach(metric => {
      const value = parseFloat(metric.metric_value) || 0;
      
      if (metric.metric_name === 'views') {
        views += value;
      } else if (metric.metric_name === 'likes') {
        likes += value;
      } else if (metric.metric_name === 'comments') {
        comments += value;
      }
    });
    
    // Calculate engagement rate
    let engagement = 0;
    if (views > 0) {
      engagement = ((likes + comments) / views) * 100;
    }
    
    result.push({
      platform: platform.platform,
      posts: parseInt(platform.count),
      views,
      engagement: engagement.toFixed(2),
      reach: Math.round(views / parseInt(platform.count))
    });
  }
  
  return result;
}

/**
 * Get content metrics with period comparison
 * @param {string} clientId - The client ID
 * @param {string} currentStartDate - Current period start date
 * @param {string} currentEndDate - Current period end date
 * @param {string} previousStartDate - Previous period start date 
 * @param {string} previousEndDate - Previous period end date
 * @param {string} platform - Optional platform filter
 */
export async function getMetricsComparison(
  clientId, 
  currentStartDate, 
  currentEndDate, 
  previousStartDate, 
  previousEndDate,
  platform = null
) {
  // Helper function to get metrics for a date range
  async function getMetricsForPeriod(startDate, endDate) {
    // Get content in range
    let query = supabase
      .from('content_items')
      .select('id')
      .eq('client_id', clientId)
      .gte('post_date', startDate)
      .lte('post_date', endDate);
      
    if (platform) {
      query = query.eq('platform', platform);
    }
    
    const { data: content, error: contentError } = await query;
    
    if (contentError || !content.length) {
      return {
        views: 0,
        likes: 0,
        comments: 0,
        posts: 0
      };
    }
    
    // Get metrics for these content items
    const contentIds = content.map(item => item.id);
    
    const { data: metrics, error: metricsError } = await supabase
      .from('metrics')
      .select('metric_name, metric_value')
      .in('content_id', contentIds);
      
    if (metricsError) {
      return {
        views: 0,
        likes: 0,
        comments: 0,
        posts: content.length
      };
    }
    
    // Calculate totals
    let views = 0;
    let likes = 0;
    let comments = 0;
    
    metrics.forEach(metric => {
      const value = parseFloat(metric.metric_value) || 0;
      
      if (metric.metric_name === 'views') {
        views += value;
      } else if (metric.metric_name === 'likes') {
        likes += value;
      } else if (metric.metric_name === 'comments') {
        comments += value;
      }
    });
    
    return {
      views,
      likes,
      comments,
      posts: content.length
    };
  }
}
  
  // Get metrics for both periods