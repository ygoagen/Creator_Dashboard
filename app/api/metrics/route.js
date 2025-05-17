import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const supabase = createRouteHandlerClient({ cookies });
  
  // Get user and verify auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Get query params
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId');
  const platform = searchParams.get('platform');
  const campaign = searchParams.get('campaign');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  
  // Verify user has access to this client data
  const { data: clientAccess } = await supabase
    .from('client_users')
    .select('client_id')
    .eq('user_id', user.id)
    .eq('client_id', clientId);
    
  if (!clientAccess || clientAccess.length === 0) {
    return NextResponse.json({ error: 'No access to this client data' }, { status: 403 });
  }
  
  // Build query
  let query = supabase
    .from('content_items')
    .select(`
      id, 
      content_name, 
      platform, 
      content_type, 
      post_date,
      campaigns(name),
      metrics(metric_name, metric_value)
    `)
    .eq('client_id', clientId);
  
  if (startDate) {
    query = query.gte('post_date', startDate);
  }
  
  if (endDate) {
    query = query.lte('post_date', endDate);
  }
  
  if (platform && platform !== 'all') {
    query = query.eq('platform', platform);
  }
  
  if (campaign && campaign !== 'all') {
    query = query.eq('campaign_id', campaign);
  }
  
  // Execute query
  const { data, error } = await query.order('post_date', { ascending: false });
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  // Process data for frontend
  const processedData = data.map(item => {
    const metrics = {};
    
    item.metrics.forEach(metric => {
      metrics[metric.metric_name] = metric.metric_value;
    });
    
    return {
      id: item.id,
      name: item.content_name,
      platform: item.platform,
      type: item.content_type,
      date: item.post_date,
      campaign: item.campaigns?.name || 'No Campaign',
      metrics
    };
  });
  
  return NextResponse.json(processedData);
}