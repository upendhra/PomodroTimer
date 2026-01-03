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

async function testDataInsertion() {
  console.log('🧪 Testing Data Insertion After Deletion...\n');

  // Test data that should create a new row
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
    console.log('📤 Testing POST /api/daily-achievements...');
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

    console.log(`📊 POST Status: ${postResponse.statusCode}`);

    if (postResponse.statusCode === 200) {
      console.log('✅ SUCCESS! Data should be inserted');
      try {
        const postData = JSON.parse(postResponse.body);
        console.log('📦 Response:', JSON.stringify(postData, null, 2));
      } catch (e) {
        console.log('📦 Raw Response:', postResponse.body);
      }
    } else {
      console.log('❌ FAILED! Check server logs for errors');
      console.log('📦 Response:', postResponse.body);
    }

    console.log('\n⏳ Waiting 2 seconds then checking GET...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test GET to see if data was inserted
    console.log('\n📥 Testing GET /api/daily-achievements...');
    const getOptions = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/daily-achievements?projectId=b94264e1-7c37-465c-80ca-ff20e6202b10',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const getResponse = await makeRequest(getOptions);
    console.log(`📊 GET Status: ${getResponse.statusCode}`);

    if (getResponse.statusCode === 200) {
      try {
        const getData = JSON.parse(getResponse.body);
        console.log('📊 Retrieved Data:', JSON.stringify(getData, null, 2));

        if (getData.data && getData.data.length > 0) {
          console.log('✅ SUCCESS! New data found in database');
        } else {
          console.log('❌ FAILED! No data found in database');
        }
      } catch (e) {
        console.log('📊 Raw GET Response:', getResponse.body);
      }
    } else {
      console.log('❌ GET failed:', getResponse.body);
    }

  } catch (error) {
    console.log('❌ Test Error:', error.message);
  }

  console.log('\n🎯 Test Complete');
  console.log('\n💡 If POST succeeds but GET returns no data, check:');
  console.log('   1. Supabase table permissions');
  console.log('   2. Database connection');
  console.log('   3. Schema constraints');
}

testDataInsertion().catch(console.error);
