const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// In-memory storage (Note: This will reset on each deployment)
let logs = [];

async function generateLog() {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{
                role: "system",
                content: `You are a dystopian scenario generator for the EOTW (End of the World) protocol. 
                Generate a new apocalyptic scenario log in the following JSON format:
                {
                    "title": "Brief, impactful title",
                    "content": "Main scenario description",
                    "timeline": ["Event 1", "Event 2", "Event 3"],
                    "observations": ["Observation 1", "Observation 2", "Observation 3"],
                    "severity": "Choose from: CRITICAL, SEVERE, HIGH, MODERATE",
                    "location": "Affected location",
                    "status": "Choose from: ACTIVE, MONITORING, CONTAINED"
                }
                Make it unique, scientifically plausible, and detailed.`
            }],
            temperature: 0.9
        });

        const logData = JSON.parse(completion.choices[0].message.content);
        return {
            id: `LOG-${String(Date.now()).slice(-6)}`,
            ...logData,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error generating log:', error);
        return null;
    }
}

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Handle different endpoints
    if (req.method === 'GET') {
        if (req.query.latest) {
            // Return latest log
            res.json(logs[0] || null);
        } else {
            // Generate new log if it's been 5 minutes since last one
            const lastLog = logs[0];
            const now = Date.now();
            if (!lastLog || now - new Date(lastLog.timestamp).getTime() > 5 * 60 * 1000) {
                const newLog = await generateLog();
                if (newLog) {
                    logs.unshift(newLog);
                    if (logs.length > 50) logs.pop();
                }
            }
            res.json(logs);
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
} 