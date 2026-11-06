import { spawn } from 'child_process';
import http from 'http';

// Launch chrome headless with remote debugging
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--disable-gpu',
  '--no-sandbox',
  'http://localhost:3000/'
]);

async function check() {
  await new Promise(r => setTimeout(r, 2000));
  http.get('http://127.0.0.1:9222/json', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', async () => {
      try {
        const tabs = JSON.parse(data);
        console.log('Tabs:', tabs[0]?.webSocketDebuggerUrl);
        const wsUrl = tabs[0]?.webSocketDebuggerUrl;
        if (!wsUrl) {
          chrome.kill();
          process.exit(1);
        }
        
        const WebSocket = (await import('ws')).default || globalThis.WebSocket;
        const ws = new WebSocket(wsUrl);
        
        ws.on('open', () => {
          console.log('WS connected');
          // Enable Runtime and Log
          ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
          ws.send(JSON.stringify({ id: 2, method: 'Log.enable' }));
          
          // Evaluate a script that starts a game and triggers finishHand
          setTimeout(() => {
            ws.send(JSON.stringify({
              id: 3,
              method: 'Runtime.evaluate',
              params: {
                expression: `
                  console.log("Checking page state...");
                  window.__testErrors = [];
                  window.onerror = (msg, url, line, col, err) => {
                    console.error("WINDOW ERROR:", msg, err);
                  };
                  // Return title
                  document.title;
                `,
                returnByValue: true
              }
            }));
          }, 1000);
        });

        ws.on('message', (msg) => {
          const m = JSON.parse(msg.toString());
          if (m.method === 'Runtime.consoleAPICalled') {
            console.log('[BROWSER CONSOLE]', m.params.type, m.params.args.map(a => a.value || a.description).join(' '));
          }
          if (m.method === 'Runtime.exceptionThrown') {
            console.error('[BROWSER EXCEPTION]', m.params.exceptionDetails);
          }
          if (m.id === 3) {
            console.log('Eval result:', m.result);
          }
        });

        setTimeout(() => {
          chrome.kill();
          process.exit(0);
        }, 8000);

      } catch (e) {
        console.error('Error:', e);
        chrome.kill();
        process.exit(1);
      }
    });
  }).on('error', (err) => {
    console.error('HTTP error:', err);
    chrome.kill();
    process.exit(1);
  });
}

check();
