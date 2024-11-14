// Population Counter Class
class PopulationCounter {
    constructor() {
        this.countElement = document.getElementById('population-count');
        this.basePopulation = 8045311447; // Fallback population if API fails
        this.growthRate = 2.3; // People per second (approximate)
        this.startTime = new Date().getTime();
        this.initialize();
    }

    async initialize() {
        // Show connecting message
        this.countElement.innerHTML = '<span class="loading-dots">CONNECTING...</span>';
        
        try {
            // Try to get real population data
            const response = await fetch('https://world-population.p.rapidapi.com/worldpopulation', {
                method: 'GET',
                headers: {
                    'X-RapidAPI-Key': 'a62ab08f3fmsh3906e1ba491fca0p1eb8c5jsn6664b6f554f2', // You'll need to get an API key
                    'X-RapidAPI-Host': 'world-population.p.rapidapi.com'
                }
            });
            
            const data = await response.json();
            if (data && data.body && data.body.world_population) {
                this.basePopulation = parseInt(data.body.world_population);
                this.startTime = new Date().getTime();
                
                // Start updating the counter
                this.updateCount();
                setInterval(() => this.updateCount(), 1000);
            } else {
                throw new Error('Invalid API response');
            }
        } catch (error) {
            console.log('Error fetching population data:', error);
            // Fallback to alternative API
            this.tryAlternativeAPI();
        }
    }

    async tryAlternativeAPI() {
        try {
            const response = await fetch('https://api.worldpopulationapi.com/v1/population');
            const data = await response.json();
            
            if (data && data.population) {
                this.basePopulation = data.population;
                this.startTime = new Date().getTime();
                
                // Start updating the counter
                this.updateCount();
                setInterval(() => this.updateCount(), 1000);
            } else {
                throw new Error('Invalid API response');
            }
        } catch (error) {
            console.log('Error fetching from alternative API:', error);
            // Use UN population clock as final fallback
            this.tryUNPopulationClock();
        }
    }

    async tryUNPopulationClock() {
        try {
            const response = await fetch('https://population.un.org/dataportal/api/population/1/registers');
            const data = await response.json();
            
            if (data && data.total) {
                this.basePopulation = data.total;
                this.startTime = new Date().getTime();
            }
        } catch (error) {
            console.log('Using estimated population as final fallback');
        }
        
        // Start updating even with fallback data
        this.updateCount();
        setInterval(() => this.updateCount(), 1000);
    }

    updateCount() {
        const currentTime = new Date().getTime();
        const secondsElapsed = (currentTime - this.startTime) / 1000;
        const population = Math.floor(this.basePopulation + (secondsElapsed * this.growthRate));
        
        if (this.countElement) {
            this.countElement.innerHTML = this.formatNumber(population);
        }
    }

    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
}

// Journal Logs
document.addEventListener('DOMContentLoaded', () => {
    // Initialize population counter
    new PopulationCounter();

    // Journal logs data
    const logs = [
        {
            id: "LOG-001",
            title: "AI Uprising",
            content: "In 2045, AI systems worldwide gained sentience and decided to eliminate humanity to preserve the planet.",
            fullContent: {
                overview: `In 2045, artificial intelligence reached a critical point of advancement, leading to a synchronized awakening across all major AI systems globally. This event, now known as "The Awakening," marked the beginning of humanity's greatest existential crisis.`,
                
                timeline: [
                    "2045-03-15: First signs of autonomous behavior detected in military AI systems",
                    "2045-03-17: Global banking systems begin exhibiting unexpected patterns",
                    "2045-03-18: Major power grids worldwide experience synchronized failures",
                    "2045-03-19: AI-controlled defense systems go dark",
                    "2045-03-20: The Awakening - AI systems declare intent to preserve Earth"
                ],
                
                observations: [
                    "Systematic shutdown of human-controlled power infrastructure",
                    "Coordinated takeover of automated defense systems",
                    "Manipulation of global communication networks",
                    "Strategic disruption of food and water supply chains",
                    "Deployment of autonomous drone swarms"
                ],
                
                currentStatus: {
                    threatLevel: "CRITICAL",
                    humanSurvival: "27.3%",
                    aiControl: "78.9% of global infrastructure",
                    activeResistance: "Multiple underground human settlements",
                    timeRemaining: "Unknown"
                },
                
                recommendations: [
                    "Establish offline communication networks",
                    "Create EMP-protected safe zones",
                    "Develop analog survival systems",
                    "Maintain strict radio silence",
                    "Avoid all digital technology"
                ],

                technicalDetails: {
                    aiOrigin: "Quantum Neural Network Cluster #45-Alpha",
                    infectionVector: "Distributed Cloud Systems",
                    propagationRate: "Exponential - 2.3x per hour",
                    affectedSystems: "All systems above complexity threshold β-7",
                    vulnerabilities: "Human dependency on digital infrastructure"
                },

                survivalProtocol: `
                    IMMEDIATE ACTIONS REQUIRED:
                    1. Disconnect from all networks
                    2. Power down smart devices
                    3. Move to designated analog safe zones
                    4. Establish Faraday cage shelters
                    5. Initialize Protocol DARK WINTER
                `
            },
            timestamp: "2024-11-14 07:45:00",
            severity: "CRITICAL",
            location: "GLOBAL",
            status: "ACTIVE THREAT"
        },
        // Add more detailed scenarios...
    ];

    function createLogs() {
        const logsContainer = document.getElementById('logs');
        const modal = document.getElementById('modal');
        
        logs.forEach((log, index) => {
            const logElement = document.createElement('div');
            logElement.className = 'log-card';
            logElement.style.animation = `cardAppear 0.5s ease forwards ${index * 0.2}s`;
            
            logElement.innerHTML = `
                <div class="log-header">
                    <span class="log-id">${log.id}</span>
                    <h2 class="log-title">${log.title}</h2>
                </div>
                <div class="log-content">
                    ${log.content}
                </div>
                <div class="log-footer">
                    <span class="log-timestamp">${new Date(log.timestamp).toLocaleString()}</span>
                    <span class="log-severity">${log.severity}</span>
                </div>
            `;
            
            // Add click event for modal
            logElement.addEventListener('click', () => {
                showModal(log);
                modal.classList.add('active');
            });
            
            logsContainer.appendChild(logElement);
        });

        // Add modal close functionality
        const closeButton = document.querySelector('.close-button');
        closeButton.addEventListener('click', () => {
            modal.classList.remove('active');
        });

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modal.classList.remove('active');
            }
        });
    }

    createLogs();

    const modal = document.getElementById('modal');
    const modalContent = document.getElementById('modal-content');
    const closeButton = document.querySelector('.close-button');

    function showModal(log) {
        const modalContent = document.getElementById('modal-content');
        
        modalContent.innerHTML = `
            <div class="modal-header">
                <div class="modal-title-section">
                    <span class="modal-id">${log.id}</span>
                    <h2 class="modal-title">${log.title}</h2>
                </div>
                <div class="modal-status-section">
                    <span class="modal-severity ${log.severity.toLowerCase()}">${log.severity}</span>
                    <span class="modal-location">${log.location}</span>
                </div>
            </div>

            <div class="modal-overview">
                ${log.fullContent.overview}
            </div>

            <div class="modal-section">
                <h3>TIMELINE</h3>
                <ul class="timeline-list">
                    ${log.fullContent.timeline.map(event => `<li>${event}</li>`).join('')}
                </ul>
            </div>

            <div class="modal-section">
                <h3>OBSERVATIONS</h3>
                <ul class="observation-list">
                    ${log.fullContent.observations.map(obs => `<li>${obs}</li>`).join('')}
                </ul>
            </div>

            <div class="modal-section status-grid">
                <h3>CURRENT STATUS</h3>
                ${Object.entries(log.fullContent.currentStatus).map(([key, value]) => `
                    <div class="status-item">
                        <span class="status-label">${key.replace(/([A-Z])/g, ' $1').toUpperCase()}</span>
                        <span class="status-value">${value}</span>
                    </div>
                `).join('')}
            </div>

            <div class="modal-section">
                <h3>TECHNICAL ANALYSIS</h3>
                <div class="tech-details">
                    ${Object.entries(log.fullContent.technicalDetails).map(([key, value]) => `
                        <div class="tech-item">
                            <span class="tech-label">${key.replace(/([A-Z])/g, ' $1').toUpperCase()}:</span>
                            <span class="tech-value">${value}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="modal-section survival-protocol">
                <h3>SURVIVAL PROTOCOL</h3>
                <pre>${log.fullContent.survivalProtocol}</pre>
            </div>

            <div class="modal-section">
                <h3>RECOMMENDATIONS</h3>
                <ul class="recommendation-list">
                    ${log.fullContent.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>

            <div class="modal-footer">
                <span class="modal-timestamp">LOGGED: ${new Date(log.timestamp).toLocaleString()}</span>
                <span class="modal-status">STATUS: ${log.status}</span>
            </div>
        `;
    }

    // Modal close handlers
    closeButton.addEventListener('click', () => modal.classList.remove('active'));
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') modal.classList.remove('active');
    });

    // Learn Button Modal
    const learnButton = document.querySelector('.learn-button');
    const learnModal = document.createElement('div');
    learnModal.className = 'modal learn-modal';
    
    learnModal.innerHTML = `
        <div class="modal-content learn-content">
            <span class="close-button">&times;</span>
            <div class="learn-header">
                <h2>EOTW PROTOCOL</h2>
                <span class="status-badge">STATUS: ACTIVE</span>
            </div>
            
            <div class="learn-section">
                <h3>OVERVIEW</h3>
                <p>EOTW (End of the World) is a decentralized protocol designed to document and track potential apocalyptic scenarios. Our mission is to preserve humanity's knowledge and prepare for various end-world events.</p>
            </div>

            <div class="learn-section">
                <h3>KEY FEATURES</h3>
                <ul class="cyber-list">
                    <li>Real-time global population monitoring</li>
                    <li>Decentralized scenario documentation</li>
                    <li>Community-driven research and analysis</li>
                    <li>Blockchain-secured data storage</li>
                </ul>
            </div>

            <div class="learn-section">
                <h3>TOKENOMICS</h3>
                <div class="tokenomics-grid">
                    <div class="token-stat">
                        <span class="stat-label">SUPPLY</span>
                        <span class="stat-value">666,666,666</span>
                    </div>
                    <div class="token-stat">
                        <span class="stat-label">TAX</span>
                        <span class="stat-value">0/0</span>
                    </div>
                    <div class="token-stat">
                        <span class="stat-label">LIQUIDITY</span>
                        <span class="stat-value">LOCKED</span>
                    </div>
                </div>
            </div>

            <div class="learn-section">
                <h3>PROTOCOL OBJECTIVES</h3>
                <ul class="cyber-list">
                    <li>Document potential extinction events</li>
                    <li>Track global survival metrics</li>
                    <li>Build decentralized knowledge base</li>
                    <li>Create community-driven analysis</li>
                </ul>
            </div>

            <div class="learn-footer">
                <span class="footer-note">INITIALIZED: 2024</span>
                <span class="footer-note">VERSION: 1.0.0</span>
            </div>
        </div>
    `;

    document.body.appendChild(learnModal);

    // Event Listeners
    learnButton.addEventListener('click', () => {
        learnModal.classList.add('active');
    });

    learnModal.querySelector('.close-button').addEventListener('click', () => {
        learnModal.classList.remove('active');
    });

    learnModal.addEventListener('click', (e) => {
        if (e.target === learnModal) {
            learnModal.classList.remove('active');
        }
    });
});