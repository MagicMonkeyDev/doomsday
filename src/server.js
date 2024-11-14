const express = require('express');
const cors = require('cors');
const LogGenerator = require('./services/logGenerator');

const app = express();
app.use(cors());
app.use(express.json());

const logGenerator = new LogGenerator();
const logs = [];

// Generate a new log every 5 minutes
async function generateNewLog() {
    const log = await logGenerator.generateLog();
    if (log) {
        logs.unshift(log); // Add to beginning of array
        // Keep only last 50 logs
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

// Generate initial log and start interval
generateNewLog();
setInterval(generateNewLog, 5 * 60 * 1000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 