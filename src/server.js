const express = require('express');
const cors = require('cors');
const path = require('path');
const LogGenerator = require('./services/logGenerator');

const app = express();

// CORS configuration
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

const logGenerator = new LogGenerator();
const logs = [];

// Generate a new log every 5 minutes
async function generateNewLog() {
    const log = await logGenerator.generateLog();
    if (log) {
        logs.unshift(log);
        if (logs.length > 50) {
            logs.pop();
        }
        console.log('New log generated:', log.title);
    }
}

// API endpoints
app.get('/api/logs', (req, res) => {
    res.json(logs);
});

app.get('/api/logs/latest', (req, res) => {
    res.json(logs[0] || null);
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Generate initial log and start interval
generateNewLog();
setInterval(generateNewLog, 5 * 60 * 1000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to view the site`);
}); 