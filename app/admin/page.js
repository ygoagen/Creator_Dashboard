import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = createServerSupabase();
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/auth/signin');
    return null;
  }
  
  // Check if user is an admin
  const { data: userRole } = await supabase
    .from('client_users')
    .select('role')
    .eq('user_id', user.id)
    .single();
    
  if (!userRole || userRole.role !== 'admin') {
    // User is not an admin
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">
            You do not have permission to access the admin portal.
          </p>
        </div>
      </div>
    );
  }
  
  // Get clients this user has admin access to
  const { data: clientsData } = await supabase
    .from('client_users')
    .select('client_id, clients(*)')
    .eq('user_id', user.id)
    .eq('role', 'admin');
  
  const clients = clientsData.map(item => item.clients);
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {clients.map(client => (
          <div key={client.id} className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium">{client.name}</h2>
            <div className="mt-4 flex">
              
                href={`/admin/clients/${client.id}`}
                className="text-blue-600 hover:text-blue-800"
              >
                Manage Client
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}