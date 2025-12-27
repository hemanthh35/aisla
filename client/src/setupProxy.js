/**
 * Proxy configuration for Create React App
 * 
 * Required to properly handle SSE (Server-Sent Events) streaming
 * The default proxy buffers responses, which breaks real-time streaming
 */

const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
    // Proxy API requests
    app.use(
        '/api',
        createProxyMiddleware({
            target: 'http://localhost:5000',
            changeOrigin: true,
            // Critical: Disable buffering for SSE streams
            onProxyRes: function (proxyRes, req, res) {
                // For SSE endpoints, disable buffering
                if (req.url.includes('/chat/stream') || req.url.includes('/explain/stream')) {
                    proxyRes.headers['X-Accel-Buffering'] = 'no';
                    proxyRes.headers['Cache-Control'] = 'no-cache, no-transform';
                }
            },
            // Log proxy errors for debugging
            onError: function (err, req, res) {
                console.error('Proxy error:', err);
                res.status(500).json({ error: 'Proxy error' });
            }
        })
    );
};
