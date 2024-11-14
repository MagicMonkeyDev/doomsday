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
                content: `You are the EOTW (End of the World) Protocol AI, monitoring potential extinction-level events. Generate a single, highly detailed global catastrophic scenario.

                Rules for scenario generation:
                1. MUST be a GLOBAL threat that affects the entire planet
                2. MUST be scientifically plausible
                3. MUST include realistic measurements and data
                4. MUST be based on actual scientific phenomena
                5. MUST have clear worldwide implications
                6. NEVER focus on a single region or country
                7. NEVER use generic or vague descriptions
                8. NEVER repeat previous scenario types

                Base scenarios on these categories:
                - Astronomical Events (solar flares, asteroid impacts, gamma-ray bursts)
                - Quantum Physics Disasters (vacuum decay, particle accelerator accidents)
                - Global Climate Tipping Points (methane clathrate releases, thermohaline circulation collapse)
                - Technological Singularities (AI emergence, grey goo scenarios)
                - Cosmic Phenomena (dark matter interactions, gravitational anomalies)
                - Biological/Evolutionary Events (rapid genetic mutations, microbial awakening)
                - Geomagnetic/Electromagnetic Phenomena (field reversals, electromagnetic pulses)

                Generate in this JSON format:
                {
                    "title": "Unique, scientific 3-6 word title describing the global threat",
                    "content": "2-3 detailed sentences explaining the worldwide catastrophic event, using specific scientific terminology and global impact metrics",
                    "timeline": [
                        "T+0h: Initial worldwide detection details with global measurements",
                        "T+24h: First planetary-scale developments",
                        "T+72h: Worldwide escalation patterns",
                        "T+168h: Global situation assessment"
                    ],
                    "observations": [
                        "Planetary-scale scientific measurement",
                        "Worldwide socioeconomic impact analysis",
                        "Global environmental system changes",
                        "Universal technological implications"
                    ],
                    "technicalData": {
                        "originCoordinates": "Must indicate GLOBAL or multiple worldwide coordinates",
                        "spreadRate": "Planet-wide progression rate",
                        "affectedRadius": "Must be global scale (>1000km)",
                        "populationExposed": "Must be >1 billion",
                        "probabilityRating": "Realistic probability (0.001% to 1%)",
                        "timeToImpact": "Time until global critical point"
                    },
                    "severity": "CRITICAL or SEVERE only",
                    "location": "GLOBAL",
                    "status": "ACTIVE or MONITORING",
                    "recommendations": [
                        "Worldwide coordination action",
                        "Global mitigation strategy",
                        "Universal survival protocol"
                    ]
                }`
            }],
            temperature: 0.8,
            max_tokens: 1000
        });

        const logData = JSON.parse(completion.choices[0].message.content);
        return {
            id: `LOG-${String(Date.now()).slice(-6)}`,
            ...logData,
            timestamp: new Date().toISOString(),
            votes: 0
        };
    } catch (error) {
        console.error('Error generating log:', error);
        return null;
    }
}

export default async function handler(req, res) {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        // Handle voting
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

        // Get the last generated time
        const lastGeneratedTime = await kv.get('lastGeneratedTime');
        const now = Date.now();
        console.log('Current time:', now);
        console.log('Last generated time:', lastGeneratedTime);

        // Check if enough time has passed (5 minutes)
        if (!lastGeneratedTime || (now - lastGeneratedTime) >= 5 * 60 * 1000) {
            console.log('Generating new log...');
            const newLog = await generateLog();
            
            if (newLog) {
                // Store the new log
                await kv.set(`log:${newLog.id}`, newLog);
                
                // Get existing log IDs
                let logIds = await kv.get('logIds') || [];
                console.log('Existing log IDs:', logIds);
                
                // Add new log ID to the front
                logIds.unshift(newLog.id);
                
                // Keep only the last 50 logs
                if (logIds.length > 50) {
                    logIds = logIds.slice(0, 50);
                }
                
                // Save updated log IDs
                await kv.set('logIds', logIds);
                await kv.set('lastGeneratedTime', now);
                
                console.log('New log generated:', newLog.id);
            }
        } else {
            console.log('Not enough time has passed for new log generation');
            console.log('Time difference:', now - lastGeneratedTime);
        }

        // Fetch all logs
        const logIds = await kv.get('logIds') || [];
        console.log('Retrieved log IDs:', logIds);
        
        const logs = await Promise.all(
            logIds.map(async (id) => {
                const log = await kv.get(`log:${id}`);
                return log;
            })
        );
        
        console.log('Retrieved logs:', logs.length);

        // Send response
        res.json(logs.filter(Boolean));

    } catch (error) {
        console.error('Detailed API error:', error);
        res.status(500).json({ 
            error: 'Internal server error', 
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
} 