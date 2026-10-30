const { spawn } = require('child_process');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const debugPort = 9335;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function test() {
  const p = spawn(edgePath, [
    `--remote-debugging-port=${debugPort}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    'http://localhost:5173'
  ], { stdio: 'ignore' });

  let list = null;
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    try {
      list = await getJson(`http://localhost:${debugPort}/json`);
      if (list && list.length) break;
    } catch(e) {}
  }
  const ws = new WebSocket(list[0].webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));

  let id = 1;
  const cbs = new Map();
  ws.on('message', raw => {
    const d = JSON.parse(raw);
    if (d.id && cbs.has(d.id)) { cbs.get(d.id)(d); cbs.delete(d.id); }
  });
  const send = (method, params = {}) => new Promise(res => {
    const cur = id++;
    cbs.set(cur, res);
    ws.send(JSON.stringify({ id: cur, method, params }));
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 320,
    height: 568,
    deviceScaleFactor: 1,
    mobile: true
  });
  await sleep(1000);

  const res = await send('Runtime.evaluate', {
    expression: `(() => {
      const cards = document.querySelectorAll('.saas-card');
      const header = document.querySelector('header');
      const buttons = document.querySelectorAll('button');
      return JSON.stringify({
        windowInnerWidth: window.innerWidth,
        headerRect: header ? header.getBoundingClientRect() : null,
        firstCardRect: cards[0] ? cards[0].getBoundingClientRect() : null,
        buttons: Array.from(buttons).slice(0, 6).map(b => ({
          text: b.innerText.slice(0, 20),
          rect: b.getBoundingClientRect()
        }))
      });
    })()`,
    returnByValue: true
  });

  console.log('MEASUREMENTS AT 320px:');
  console.log(JSON.stringify(JSON.parse(res.result.result.value), null, 2));

  // Capture screenshot via CDP Page.captureScreenshot
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  const fs = require('fs');
  fs.writeFileSync('screenshots/cdp-small-mobile.png', Buffer.from(shot.result.data, 'base64'));
  console.log('Saved screenshots/cdp-small-mobile.png');

  ws.close();
  p.kill();
}
test().catch(console.error);

