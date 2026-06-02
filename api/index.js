process.on('uncaughtException', (err) => { console.error('UNCAUGHT EXCEPTION:', err); });
process.on('unhandledRejection', (reason) => { console.error('UNHANDLED REJECTION:', reason); });

module.exports = (req, res) => {
    if (req.url && req.url.includes('test=1')) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end("TEST_OK");
        return;
    }
    
    try {
        const app = require('../index');
        return app(req, res);
    } catch (error) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: "Startup Error", message: error.message, stack: error.stack }));
    }
};
