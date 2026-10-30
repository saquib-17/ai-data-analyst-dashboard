const { spawn } = require('child_process');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const outDir = path.resolve(__dirname, '..', '..', 'screenshots');

const viewports = [
  { name: 'state-b-mobile-360', width: 360, height: 800, mobile: true },
  { name: 'state-b-tablet-768', width: 768, height: 1024, mobile: true },
  { name: 'state-b-desktop-1440', width: 1440, height: 900, mobile: false }
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

async function captureStateB() {
  const debugPort = 9339;
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
    console.log(`Capturing State B for ${vp.name} (${vp.width}x${vp.height})...`);
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

    await send('Page.navigate', { url: 'http://localhost:5173' });
    await sleep(1500);

    // Click "Explore Sample Dataset" to switch to Analytics Dashboard (State B)
    await send('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const exploreBtn = buttons.find(b => b.innerText && b.innerText.includes('Explore Sample Dataset'));
        if (exploreBtn) exploreBtn.click();
      })()`
    });
    await sleep(2000);

    // Capture screenshot
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const outFile = path.join(outDir, `${vp.name}.png`);
    fs.writeFileSync(outFile, Buffer.from(shot.result.data, 'base64'));
    console.log(`✓ Saved ${vp.name}.png`);
  }

  ws.close();
  p.kill();
  console.log('State B captures complete!');
}

captureStateB().catch(console.error);

