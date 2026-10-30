const { spawn } = require('child_process');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const outDir = path.resolve(__dirname, '..', '..', 'screenshots');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const viewports = [
  { name: 'small-mobile', width: 320, height: 568, mobile: true },
  { name: 'mobile-360', width: 360, height: 800, mobile: true },
  { name: 'mobile-390', width: 390, height: 844, mobile: true },
  { name: 'mobile-430', width: 430, height: 932, mobile: true },
  { name: 'tablet-portrait', width: 768, height: 1024, mobile: true },
  { name: 'tablet-landscape', width: 1024, height: 768, mobile: false },
  { name: 'laptop-1280', width: 1280, height: 800, mobile: false },
  { name: 'desktop-1440', width: 1440, height: 900, mobile: false }
];

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

async function captureAll() {
  const debugPort = 9338;
  console.log('Starting Edge process with CDP on port', debugPort);
  const p = spawn(edgePath, [
    `--remote-debugging-port=${debugPort}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    'about:blank'
  ], { stdio: 'ignore' });

  let list = null;
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    try {
      list = await getJson(`http://localhost:${debugPort}/json`);
      if (list && list.length) break;
    } catch(e) {}
  }
  const page = list.find(x => x.type === 'page') || list[0];
  const ws = new WebSocket(page.webSocketDebuggerUrl);
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

  for (const vp of viewports) {
    console.log(`Setting device metrics for ${vp.name} (${vp.width}x${vp.height}, mobile=${vp.mobile})...`);
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: vp.mobile
    });

    if (vp.mobile) {
      await send('Emulation.setUserAgentOverride', {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1'
      });
    } else {
      await send('Emulation.setUserAgentOverride', {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      });
    }

    // Navigate to ensure layout re-computes with the viewport
    await send('Page.navigate', { url: 'http://localhost:5173' });
    await sleep(1500);

    // Measure page dimensions
    const evalRes = await send('Runtime.evaluate', {
      expression: `JSON.stringify({
        innerWidth: window.innerWidth,
        docWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
        headerWidth: document.querySelector('header')?.getBoundingClientRect().width,
        cardWidth: document.querySelector('.saas-card')?.getBoundingClientRect().width
      })`,
      returnByValue: true
    });
    console.log(`[${vp.name}] Geometry:`, evalRes.result?.result?.value);

    // Capture screenshot
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const outFile = path.join(outDir, `${vp.name}.png`);
    fs.writeFileSync(outFile, Buffer.from(shot.result.data, 'base64'));
    const stat = fs.statSync(outFile);
    console.log(`✓ Saved ${vp.name}.png (${Math.round(stat.size / 1024)} KB)`);
  }

  ws.close();
  p.kill();
  console.log('All viewport captures complete!');
}

captureAll().catch(console.error);

