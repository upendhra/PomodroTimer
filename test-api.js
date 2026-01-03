const http = require('http');
const https = require('https');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const client = options.protocol === 'https:' ? https : http;
    const req = client.request(options, (res) => {
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

async function testAPI() {
  console.log('🧪 Testing Daily Achievements API...\n');

  // Test GET endpoint
  console.log('📥 Testing GET /api/daily-achievements');
  try {
    const getOptions = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/daily-achievements?projectId=test-project',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const getResponse = await makeRequest(getOptions);
    console.log(`GET Status: ${getResponse.statusCode}`);

    if (getResponse.statusCode === 401) {
      console.log('❌ GET returns 401 - Authentication issue');
      console.log('Response:', getResponse.body);
    } else if (getResponse.statusCode === 200) {
      console.log('✅ GET works - Authentication successful');
      try {
        const getData = JSON.parse(getResponse.body);
        console.log('GET Response:', JSON.stringify(getData, null, 2));
      } catch (e) {
        console.log('Raw response:', getResponse.body);
      }
    } else {
      console.log(`❌ GET failed with status: ${getResponse.statusCode}`);
      console.log('Response:', getResponse.body);
    }
  } catch (error) {
    console.log('❌ GET Error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test POST endpoint
  console.log('📤 Testing POST /api/daily-achievements');
  const testData = JSON.stringify({
    projectId: 'test-project',
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

    const postResponse = await makeRequest(postOptions, testData);
    console.log(`POST Status: ${postResponse.statusCode}`);

    if (postResponse.statusCode === 401) {
      console.log('❌ POST returns 401 - Authentication failed');
      try {
        const errorData = JSON.parse(postResponse.body);
        console.log('Error details:', JSON.stringify(errorData, null, 2));
      } catch (e) {
        console.log('Raw error response:', postResponse.body);
      }
    } else if (postResponse.statusCode === 200) {
      console.log('✅ POST works - Data saved successfully');
      try {
        const postData = JSON.parse(postResponse.body);
        console.log('POST Response:', JSON.stringify(postData, null, 2));
      } catch (e) {
        console.log('Raw response:', postResponse.body);
      }
    } else {
      console.log(`❌ POST failed with status: ${postResponse.statusCode}`);
      try {
        const errorData = JSON.parse(postResponse.body);
        console.log('Error details:', JSON.stringify(errorData, null, 2));
      } catch (e) {
        console.log('Raw error response:', postResponse.body);
      }
    }
  } catch (error) {
    console.log('❌ POST Error:', error.message);
  }

  console.log('\n🎯 Analysis Complete');
}

testAPI().catch(console.error);
