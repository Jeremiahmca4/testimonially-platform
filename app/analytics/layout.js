import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import Sidebar from '../../components/layout/Sidebar';

export default async function Layout({ children }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-56 p-8 min-h-screen" style={{ background: 'var(--surface)' }}>
        {children}
      </main>
    </div>
  );
}
