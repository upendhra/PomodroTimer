// Test script for CRUD operations
// Run this in browser console or create a test page

const TEST_PROJECT_ID = 'test-project-123'; // Use any project ID for testing

async function testCRUDOperations() {
  console.log('🧪 Starting CRUD Test for Tasks API');
  console.log('=====================================');

  // Test 1: CREATE a task
  console.log('\n1️⃣ Testing CREATE...');
  try {
    const createResponse = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test Task - ' + Date.now(),
        priority: 'high',
        duration: 30,
        projectId: TEST_PROJECT_ID,
        status: 'todo',
        targetSessions: 2,
        dailyGoal: false
      })
    });

    if (createResponse.status === 201) {
      const createdTask = await createResponse.json();
      console.log('✅ CREATE SUCCESS:', createdTask);
      window.testTaskId = createdTask.id; // Store for other tests
    } else {
      const error = await createResponse.json();
      console.error('❌ CREATE FAILED:', createResponse.status, error);
      return;
    }
  } catch (error) {
    console.error('❌ CREATE ERROR:', error);
    return;
  }

  // Test 2: READ tasks
  console.log('\n2️⃣ Testing READ...');
  try {
    const readResponse = await fetch(`/api/tasks?projectId=${TEST_PROJECT_ID}`);

    if (readResponse.ok) {
      const data = await readResponse.json();
      console.log('✅ READ SUCCESS: Found', data.tasks?.length || 0, 'tasks');

      // Find our test task
      const ourTask = data.tasks?.find((t) => t.id === window.testTaskId);
      if (ourTask) {
        console.log('✅ Our test task found:', ourTask.title);
      }
    } else {
      console.error('❌ READ FAILED:', readResponse.status);
    }
  } catch (error) {
    console.error('❌ READ ERROR:', error);
  }

  // Test 3: UPDATE the task
  console.log('\n3️⃣ Testing UPDATE...');
  try {
    const updateResponse = await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: window.testTaskId,
        title: 'Updated Test Task - ' + Date.now(),
        priority: 'low',
        duration: 45
      })
    });

    if (updateResponse.ok) {
      const updatedTask = await updateResponse.json();
      console.log('✅ UPDATE SUCCESS:', updatedTask);
    } else {
      const error = await updateResponse.json();
      console.error('❌ UPDATE FAILED:', updateResponse.status, error);
    }
  } catch (error) {
    console.error('❌ UPDATE ERROR:', error);
  }

  // Test 4: DELETE the task
  console.log('\n4️⃣ Testing DELETE...');
  try {
    const deleteResponse = await fetch(`/api/tasks?id=${window.testTaskId}`, {
      method: 'DELETE'
    });

    if (deleteResponse.status === 204) {
      console.log('✅ DELETE SUCCESS: Task deleted (204 No Content)');
    } else {
      const error = await deleteResponse.json();
      console.error('❌ DELETE FAILED:', deleteResponse.status, error);
    }
  } catch (error) {
    console.error('❌ DELETE ERROR:', error);
  }

  // Test 5: Verify deletion
  console.log('\n5️⃣ Verifying DELETE...');
  try {
    const verifyResponse = await fetch(`/api/tasks?projectId=${TEST_PROJECT_ID}`);
    if (verifyResponse.ok) {
      const data = await verifyResponse.json();
      const ourTask = data.tasks?.find((t) => t.id === window.testTaskId);
      if (!ourTask) {
        console.log('✅ VERIFICATION SUCCESS: Task is gone from database');
      } else {
        console.error('❌ VERIFICATION FAILED: Task still exists!');
      }
    }
  } catch (error) {
    console.error('❌ VERIFICATION ERROR:', error);
  }

  console.log('\n🎉 CRUD Test Complete!');
  console.log('Check Supabase dashboard to verify all operations worked.');
}

// Auto-run the test
if (typeof window !== 'undefined') {
  // Add to window so you can call it from console
  window.testCRUD = testCRUDOperations;

  console.log('🧪 CRUD Test loaded!');
  console.log('Run: testCRUD() in console to test all operations');
}
