const { execSync } = require('child_process');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

// We can dump DOM overflow info by evaluating script in headless edge or using CDP!
// Or simpler: run a puppeteer/node script or run msedge with a test page that loads localhost:5173 and logs to console.
// Even simpler: create a test HTML that iframes or fetches, or use node-fetch or execute a script.
console.log('Diagnosing overflow...');

