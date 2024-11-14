require('dotenv').config();
const OpenAI = require('openai');

class LogGenerator {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }

    async generateLog() {
        try {
            const completion = await this.openai.chat.completions.create({
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

            // Parse the response into proper JSON
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
}

module.exports = LogGenerator; 