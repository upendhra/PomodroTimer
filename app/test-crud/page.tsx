// Test page for CRUD operations
// Access at: http://localhost:3000/test-crud

import TaskManager from '@/components/TaskManager';

export default function TestCRUDPage() {
  // Use a test project ID
  const testProjectId = 'test-project-mvp';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Pomodoro MVP - Task CRUD Test
          </h1>
          <p className="text-gray-600">
            Test ADD/EDIT/DELETE operations. All data syncs with Supabase instantly.
          </p>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Test Project ID:</strong> {testProjectId}
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Check Supabase dashboard → tasks table to verify operations work.
            </p>
          </div>
        </div>

        <TaskManager projectId={testProjectId} />

        <div className="mt-12 p-6 bg-gray-100 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">API Endpoints Tested:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded border">
              <h3 className="font-medium text-green-600">✅ GET /api/tasks</h3>
              <p className="text-sm text-gray-600">Fetch tasks by projectId</p>
            </div>
            <div className="bg-white p-4 rounded border">
              <h3 className="font-medium text-blue-600">✅ POST /api/tasks</h3>
              <p className="text-sm text-gray-600">Create new task (201)</p>
            </div>
            <div className="bg-white p-4 rounded border">
              <h3 className="font-medium text-orange-600">✅ PATCH /api/tasks</h3>
              <p className="text-sm text-gray-600">Update existing task (200)</p>
            </div>
            <div className="bg-white p-4 rounded border">
              <h3 className="font-medium text-red-600">✅ DELETE /api/tasks</h3>
              <p className="text-sm text-gray-600">Delete task (204)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
