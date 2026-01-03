const http = require('http');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(data);
    }
    req.end();
  });
}

async function testPOST() {
  console.log('🧪 Testing POST /api/daily-achievements\n');

  const testData = JSON.stringify({
    projectId: 'b94264e1-7c37-465c-80ca-ff20e6202b10',
    date: new Date().toISOString().split('T')[0],
    focusSessions: 1,
    currentStreak: 1,
    longestStreak: 1,
    tasksCompleted: 0,
    tasksCreated: 1,
    plannedHours: 1,
    completedHours: 0.5,
    totalSessionTime: 25,
    breakSessions: 0,
    sessions: [{
      taskId: null,
      taskTitle: 'Test Task',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      duration: 25,
      type: 'focus',
      completed: true
    }]
  });

  try {
    const postOptions = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/daily-achievements',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(testData)
      }
    };

    console.log('📤 Sending POST request...');
    const postResponse = await makeRequest(postOptions, testData);
    
    console.log(`\n📊 Response Status: ${postResponse.statusCode}`);
    
    if (postResponse.statusCode === 200) {
      console.log('✅ SUCCESS! POST works - Data saved successfully');
      try {
        const postData = JSON.parse(postResponse.body);
        console.log('\n📦 Response Data:');
        console.log(JSON.stringify(postData, null, 2));
      } catch (e) {
        console.log('\n📦 Raw Response:', postResponse.body);
      }
    } else if (postResponse.statusCode === 401) {
      console.log('❌ FAILED: POST returns 401 - Authentication issue');
      console.log('\n📦 Response:', postResponse.body);
    } else if (postResponse.statusCode === 500) {
      console.log('❌ FAILED: POST returns 500 - Server error');
      try {
        const errorData = JSON.parse(postResponse.body);
        console.log('\n📦 Error Details:');
        console.log(JSON.stringify(errorData, null, 2));
      } catch (e) {
        console.log('\n📦 Raw Error:', postResponse.body);
      }
    } else {
      console.log(`❌ FAILED: POST returns ${postResponse.statusCode}`);
      console.log('\n📦 Response:', postResponse.body);
    }
  } catch (error) {
    console.log('❌ Request Error:', error.message);
  }

  console.log('\n🎯 Test Complete');
}

testPOST().catch(console.error);
