// Quick test for DELETE functionality
// Visit: http://localhost:3000/test-delete

"use client";

import { useState } from 'react';

export default function TestDeletePage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testDelete = async () => {
    setLoading(true);
    setResult('Testing DELETE API...');

    try {
      // First, create a test task
      setResult('Creating test task...');
      const createResponse = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'DELETE TEST TASK',
          priority: 'high',
          duration: 5,
          projectId: 'test-project-delete',
          status: 'todo',
        }),
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create test task');
      }

      const createdTask = await createResponse.json();
      const taskId = createdTask.id;

      setResult(`Created task: ${taskId}. Now deleting...`);

      // Now delete the task
      const deleteResponse = await fetch('/api/tasks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      });

      if (deleteResponse.status === 204) {
        setResult(`✅ SUCCESS! Task ${taskId} deleted successfully (204 No Content)`);
      } else {
        const error = await deleteResponse.json();
        setResult(`❌ FAILED: ${deleteResponse.status} - ${error.error}`);
      }
    } catch (error) {
      setResult(`❌ ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">DELETE API Test</h1>
        <p className="text-gray-600 mb-6">
          This tests the DELETE /api/tasks endpoint with taskId in request body.
        </p>

        <button
          onClick={testDelete}
          disabled={loading}
          className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          {loading ? 'Testing...' : 'Test DELETE API'}
        </button>

        {result && (
          <div className={`mt-4 p-4 rounded-lg text-sm font-mono ${
            result.includes('SUCCESS') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            <pre className="whitespace-pre-wrap">{result}</pre>
          </div>
        )}

        <div className="mt-6 text-xs text-gray-500">
          <p><strong>API Call:</strong></p>
          <pre className="bg-gray-100 p-2 rounded mt-1">
{`DELETE /api/tasks
Content-Type: application/json

{
  "taskId": "uuid-here"
}`}
          </pre>
          <p className="mt-2"><strong>Expected Response:</strong> 204 No Content</p>
        </div>
      </div>
    </div>
  );
}
