/**
 * Optional custom server for local WiFi development.
 * Use this to capture client IP/MAC when customers order from phones on your WiFi.
 *
 * Run: node server-local.js
 * (instead of: npm run dev)
 *
 * This injects x-real-ip from the TCP connection so device tracking works.
 */
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      const remoteAddr = req.socket?.remoteAddress?.replace(/^::ffff:/, '') || '';
      req.headers['x-real-ip'] = remoteAddr;
      if (!req.headers['x-forwarded-for']) {
        req.headers['x-forwarded-for'] = remoteAddr;
      }
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, hostname, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> Other devices: http://<your-ip>:${port}`);
    });
});
