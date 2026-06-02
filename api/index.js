process.on('uncaughtException', (err) => { console.error('UNCAUGHT EXCEPTION:', err); });
process.on('unhandledRejection', (reason) => { console.error('UNHANDLED REJECTION:', reason); });

try {
    module.exports = require('../index');
} catch (error) {
    module.exports = (req, res) => {
        res.status(500).json({ error: "Startup Error", message: error.message, stack: error.stack });
    };
}
