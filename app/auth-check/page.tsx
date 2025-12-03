'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthCheckPage() {
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      setAuthStatus({
        user: user ? { id: user.id, email: user.email } : null,
        error: error?.message,
        hasUser: !!user
      });
    } catch (err) {
      setAuthStatus({
        error: 'Failed to check auth',
        details: err instanceof Error ? err.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Checking authentication...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Status</h1>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Client-Side Auth Check</h2>
          <pre className="bg-gray-700 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(authStatus, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="space-y-4">
            <a
              href="/api/projects/test"
              target="_blank"
              className="block bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white"
            >
              Test Server-Side Auth (/api/projects/test)
            </a>

            <a
              href="/auth/login"
              className="block bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white"
            >
              Go to Login Page
            </a>

            <button
              onClick={() => window.location.reload()}
              className="block bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded text-white w-full text-left"
            >
              Refresh Page
            </button>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>If "hasUser" is false, you need to log in first</li>
            <li>Click "Go to Login Page" and sign in</li>
            <li>Come back here and check if auth status changes</li>
            <li>Test the server-side auth link</li>
            <li>Try creating a project from the dashboard</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
