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
                content: `You are the EOTW (End of the World) Protocol AI, a sophisticated system designed to monitor and document potential extinction-level events and apocalyptic scenarios.

                Generate a detailed apocalyptic scenario log in this exact JSON format:
                {
                    "title": "Brief but dramatic title (max 6 words)",
                    "content": "A 2-3 sentence overview of the scenario",
                    "timeline": [
                        "Day 1: Initial event description",
                        "Day 3: Escalation point",
                        "Day 7: Critical development",
                        "Day 14: Current situation"
                    ],
                    "observations": [
                        "Scientific observation about the event",
                        "Social/political impact observation",
                        "Environmental observation",
                        "Technological observation"
                    ],
                    "severity": "CRITICAL, SEVERE, HIGH, or MODERATE",
                    "location": "Specific location or GLOBAL",
                    "status": "ACTIVE, MONITORING, or CONTAINED"
                }`
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
    console.log('API endpoint called');
    try {
        // Get the last generated time
        const lastGeneratedTime = await kv.get('lastGeneratedTime');
        const now = Date.now();
        
        console.log('Last generated time:', lastGeneratedTime);
        console.log('Current time:', now);
        console.log('Time difference:', now - (lastGeneratedTime || 0));

        // Check if we need to generate a new log (5 minutes passed)
        if (!lastGeneratedTime || (now - lastGeneratedTime) >= 5 * 60 * 1000) {
            console.log('Generating new log...');
            const newLog = await generateLog();
            
            if (newLog) {
                console.log('New log generated:', newLog);
                // Store the new log
                await kv.set(`log:${newLog.id}`, newLog);
                
                // Update the list of logs
                let logIds = await kv.get('logIds') || [];
                logIds.unshift(newLog.id);
                if (logIds.length > 50) logIds = logIds.slice(0, 50);
                
                await kv.set('logIds', logIds);
                await kv.set('lastGeneratedTime', now);
                
                console.log('Log stored successfully');
            }
        } else {
            console.log('Not enough time has passed for new log generation');
        }

        // Fetch and return all logs
        const logIds = await kv.get('logIds') || [];
        console.log('Retrieved log IDs:', logIds);
        
        const logs = await Promise.all(
            logIds.map(id => kv.get(`log:${id}`))
        );
        
        console.log('Retrieved logs:', logs.length);

        res.json(logs.filter(Boolean));

    } catch (error) {
        console.error('Error in API:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
} 