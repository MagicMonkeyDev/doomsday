import { kv } from '@vercel/kv';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function generateLog() {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{
                role: "system",
                content: `You are the EOTW (End of the World) Protocol AI, a sophisticated system designed to monitor and document potential extinction-level events and apocalyptic scenarios. Generate unique, diverse scenarios - no repetition of themes or patterns.

                Generate a detailed apocalyptic scenario log in this exact JSON format:
                {
                    "title": "Create a unique, dramatic 3-6 word title. NEVER use 'Rapid' or 'Global' or common apocalyptic phrases. Be creative and specific to the scenario.",
                    "content": "A detailed 2-3 sentence overview using technical language and specific details. Include unique scientific phenomena, specific measurements, and realistic technological or natural systems. Every scenario should be distinctly different from others.",
                    "timeline": [
                        "T+0h: Initial detection/event with specific metrics and locations",
                        "T+24h: First major development with unique progression details",
                        "T+72h: Escalation with specific scientific measurements",
                        "T+168h: Current situation with distinct characteristics"
                    ],
                    "observations": [
                        "Technical scientific observation with unique measurements",
                        "Specific geopolitical/social impact analysis",
                        "Detailed environmental impact data",
                        "Unique infrastructure/technological implications"
                    ],
                    "technicalData": {
                        "originCoordinates": "Specific Lat/Long or detailed location",
                        "spreadRate": "Unique rate of progression with precise units",
                        "affectedRadius": "Specific area affected in km",
                        "populationExposed": "Precise number of people at risk",
                        "probabilityRating": "Calculated probability (0.001% to 5%)",
                        "timeToImpact": "Specific estimated time until critical point"
                    },
                    "severity": "CRITICAL, SEVERE, HIGH, or MODERATE",
                    "location": "Specific location - be precise and varied",
                    "status": "ACTIVE, MONITORING, or CONTAINED",
                    "recommendations": [
                        "Specific technical action item",
                        "Unique mitigation strategy",
                        "Detailed population protection measure"
                    ]
                }`
            }],
            temperature: 0.9
        });

        const logData = JSON.parse(completion.choices[0].message.content);
        return {
            id: `LOG-${String(Date.now()).slice(-6)}`,
            ...logData,
            timestamp: new Date().toISOString(),
            votes: 0  // Initialize votes
        };
    } catch (error) {
        console.error('Error generating log:', error);
        return null;
    }
}

export default async function handler(req, res) {
    if (req.method === 'POST' && req.query.action === 'vote') {
        try {
            const { logId } = req.body;
            const currentVotes = await kv.get(`votes:${logId}`) || 0;
            await kv.set(`votes:${logId}`, currentVotes + 1);
            
            // Update the log's vote count
            const log = await kv.get(`log:${logId}`);
            if (log) {
                log.votes = currentVotes + 1;
                await kv.set(`log:${logId}`, log);
            }
            
            res.json({ success: true, votes: currentVotes + 1 });
            return;
        } catch (error) {
            console.error('Vote error:', error);
            res.status(500).json({ error: 'Failed to vote' });
            return;
        }
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        // Get the last generated time
        const lastGeneratedTime = await kv.get('lastGeneratedTime');
        const now = Date.now();

        // Check if we need to generate a new log (5 minutes passed)
        if (!lastGeneratedTime || (now - lastGeneratedTime) >= 5 * 60 * 1000) {
            console.log('Generating new log...');
            const newLog = await generateLog();
            
            if (newLog) {
                // Store the new log
                await kv.set(`log:${newLog.id}`, newLog);
                
                // Update the list of logs
                let logIds = await kv.get('logIds') || [];
                logIds.unshift(newLog.id);
                if (logIds.length > 50) logIds = logIds.slice(0, 50);
                
                await kv.set('logIds', logIds);
                await kv.set('lastGeneratedTime', now);
                
                console.log('New log generated:', newLog.title);
            }
        }

        // Fetch all logs and their votes
        const logIds = await kv.get('logIds') || [];
        const logs = await Promise.all(
            logIds.map(async (id) => {
                const log = await kv.get(`log:${id}`);
                return log;
            })
        );

        // Filter out null values and sort based on query parameter
        const validLogs = logs.filter(Boolean);
        const sortBy = req.query.sort || 'recent';
        
        if (sortBy === 'votes') {
            validLogs.sort((a, b) => (b.votes || 0) - (a.votes || 0));
        } else {
            // Default sort by recent
            validLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }

        res.json(validLogs);

    } catch (error) {
        console.error('Error in API:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
} 