const { spawn } = require('child_process');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const debugPort = 9333;

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('Starting headless Edge with CDP on port', debugPort);
  const edgeProcess = spawn(edgePath, [
    `--remote-debugging-port=${debugPort}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + path.resolve(__dirname, 'edge_profile'),
    'http://localhost:5173'
  ], { stdio: 'ignore' });

  // Wait for debug port
  let list = null;
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    try {
      list = await getJson(`http://localhost:${debugPort}/json`);
      if (list && list.length > 0) break;
    } catch (e) {}
  }

  if (!list || list.length === 0) {
    console.error('Failed to connect to Edge CDP endpoint');
    edgeProcess.kill();
    return;
  }

  const page = list.find(p => p.type === 'page') || list[0];
  console.log('Found page target:', page.title, page.url);
  const ws = new WebSocket(page.webSocketDebuggerUrl);

  await new Promise(r => ws.on('open', r));

  let msgId = 1;
  const callbacks = new Map();
  ws.on('message', (raw) => {
    const res = JSON.parse(raw);
    if (res.id && callbacks.has(res.id)) {
      callbacks.get(res.id)(res);
      callbacks.delete(res.id);
    }
  });

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      callbacks.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send('Page.enable');
  await send('DOM.enable');
  await send('Runtime.enable');

  const testViewports = [
    { name: 'small-mobile', width: 320, height: 568 },
    { name: 'mobile-360', width: 360, height: 800 }
  ];

  for (const vp of testViewports) {
    console.log(`\n=== Testing Viewport ${vp.name} (${vp.width}x${vp.height}) ===`);
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: true
    });

    await sleep(1000);

    const evalResult = await send('Runtime.evaluate', {
      expression: `(() => {
        const vpWidth = ${vp.width};
        const docScrollWidth = document.documentElement.scrollWidth;
        const bodyScrollWidth = document.body.scrollWidth;
        const rootEl = document.getElementById('root');
        const rootScrollWidth = rootEl ? rootEl.scrollWidth : 0;

        const overflowing = [];
        const all = document.querySelectorAll('*');
        all.forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.right > vpWidth + 1 || el.scrollWidth > vpWidth + 1) {
            let selector = el.tagName.toLowerCase();
            if (el.id) selector += '#' + el.id;
            else if (el.className && typeof el.className === 'string') {
              const firstClass = el.className.split(' ').filter(c => c.length > 0)[0];
              if (firstClass) selector += '.' + firstClass;
            }
            overflowing.push({
              tag: el.tagName,
              selector,
              className: (el.className && typeof el.className === 'string') ? el.className.slice(0, 100) : '',
              rectRight: Math.round(rect.right),
              rectWidth: Math.round(rect.width),
              scrollWidth: el.scrollWidth,
              textSnippet: el.innerText ? el.innerText.slice(0, 30).replace(/\\n/g, ' ') : ''
            });
          }
        });

        return JSON.stringify({
          vpWidth,
          docScrollWidth,
          bodyScrollWidth,
          rootScrollWidth,
          overflowCount: overflowing.length,
          topOverflowing: overflowing.slice(0, 15)
        });
      })()`,
      returnByValue: true
    });

    console.log('Eval result object:', JSON.stringify(evalResult));
  }

  ws.close();
  edgeProcess.kill();
}

run().catch(console.error);
