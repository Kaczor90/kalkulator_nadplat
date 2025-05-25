const http = require('http');

console.log('Testing health endpoint...');

const options = {
  hostname: 'localhost',
  port: 3010,
  path: '/api/health',
  method: 'GET',
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'Health-Test-Script'
  }
};

const req = http.request(options, (res) => {
  console.log('Response received');
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
  
  let data = '';
  
  res.on('data', (chunk) => {
    console.log('Data chunk received:', chunk.length, 'bytes');
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response complete');
    console.log('Total data length:', data.length);
    console.log('Raw Response:', data);
    
    if (data.trim()) {
      try {
        const parsed = JSON.parse(data);
        console.log('Parsed Response:');
        console.log(JSON.stringify(parsed, null, 2));
        
        if (parsed.services && parsed.services.database) {
          console.log('\n=== DATABASE STATUS ===');
          console.log('Status:', parsed.services.database.status);
          console.log('Type:', parsed.services.database.type);
          console.log('Host:', parsed.services.database.host);
          console.log('Database:', parsed.services.database.database);
          console.log('Using Atlas:', parsed.services.database.usingAtlas);
          console.log('Ready State:', parsed.services.database.readyState);
          console.log('Ready State Text:', parsed.services.database.readyStateText);
        }
      } catch (e) {
        console.log('Failed to parse JSON:', e.message);
      }
    } else {
      console.log('Empty response received');
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.on('timeout', () => {
  console.error('Request timeout');
  req.destroy();
});

req.setTimeout(5000);

console.log('Sending request...');
req.end(); 