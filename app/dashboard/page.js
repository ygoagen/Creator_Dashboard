import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Dashboard from '@/components/dashboard/Dashboard';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = createServerSupabase();
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/auth/signin');
    return null;
  }
  
  // Get client ID associated with this user
  const { data: clientData } = await supabase
    .from('client_users')
    .select('client_id')
    .eq('user_id', user.id)
    .maybeSingle();
    
  if (!clientData || !clientData.client_id) {
    // User is not associated with any client
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Account Not Configured</h2>
          <p className="mt-2 text-gray-600">
            Your account is not associated with any client. Please contact your administrator.
          </p>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = '/auth/signin';
            }}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }
  
  // Get client info
  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientData.client_id)
    .single();
  
  // Handle the case where client data is not found
  if (error || !client) {
    console.error('Error fetching client data:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Client Not Found</h2>
          <p className="mt-2 text-gray-600">
            We couldn't find the client information for your account. This might be due to a database configuration issue.
          </p>
          <div className="mt-4">
            <p className="text-sm text-gray-500">Technical details (for administrators):</p>
            <pre className="mt-2 bg-gray-100 p-2 rounded text-left text-xs overflow-auto">
              {JSON.stringify({ clientId: clientData.client_id, error: error?.message }, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    );
  }
  
  
  return (
    <Dashboard 
      clientId={clientData.client_id} 
      clientName={client.name || 'Unknown Client'} // Provide fallback even if client exists but name is null
    />
  );
}