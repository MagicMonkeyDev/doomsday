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
class LogManager {
    constructor() {
        this.logsContainer = document.getElementById('logs');
        this.modal = document.getElementById('modal');
        this.lastLogId = null;
        this.currentSort = 'recent';
        this.votedLogs = new Set(this.getVotedLogs());
        this.setupSortControls();
        this.initialize();
        this.setupLearnButton();
    }

    setupSortControls() {
        // Create sort controls
        const sortControls = document.createElement('div');
        sortControls.className = 'sort-controls';
        sortControls.innerHTML = `
            <button class="sort-button active" data-sort="recent">RECENT</button>
            <button class="sort-button" data-sort="votes">MOST VOTED</button>
        `;
    
        // Insert before logs container
        this.logsContainer.parentNode.insertBefore(sortControls, this.logsContainer);
    
        // Add click handlers
        sortControls.querySelectorAll('.sort-button').forEach(button => {
            button.addEventListener('click', async () => {
                // Update active button
                sortControls.querySelectorAll('.sort-button').forEach(b => 
                    b.classList.toggle('active', b === button)
                );
                this.currentSort = button.dataset.sort;
                console.log('Sorting by:', this.currentSort); // Debug log
                await this.fetchLogs(); // Await the fetch
            });
        });
    }

    async initialize() {
        this.logsContainer.innerHTML = '<div class="loading">INITIALIZING LOGS...</div>';
        await this.fetchLogs();
        setInterval(() => this.checkForNewLogs(), 60 * 1000);
    }

    async fetchLogs() {
        try {
            const response = await fetch('/api/logs');
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API Error: ${errorData.error} - ${errorData.details || ''}`);
            }
            const logs = await response.json();
            
            // Sort the logs based on current sort selection
            if (this.currentSort === 'votes') {
                logs.sort((a, b) => (b.votes || 0) - (a.votes || 0));
            } else {
                // Sort by recent (timestamp)
                logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            }
            
            console.log(`Sorted by ${this.currentSort}:`, logs); // Debug log
            this.displayLogs(logs);
        } catch (error) {
            console.error('Error fetching logs:', error);
            this.logsContainer.innerHTML = `<div class="error">ERROR FETCHING LOGS: ${error.message}</div>`;
        }
    }

    async checkForNewLogs() {
        try {
            const response = await fetch('/api/logs');
            const logs = await response.json();
            if (logs.length > 0 && logs[0].id !== this.lastLogId) {
                this.displayLogs(logs);
            }
        } catch (error) {
            console.error('Error checking for new logs:', error);
        }
    }

    displayLogs(logs) {
        if (!Array.isArray(logs)) {
            console.error('Expected array of logs, got:', logs);
            this.logsContainer.innerHTML = '<div class="error">INVALID LOG DATA</div>';
            return;
        }

        this.logsContainer.innerHTML = '';
        logs.forEach((log, index) => {
            const logElement = this.createLogElement(log);
            logElement.style.animationDelay = `${index * 0.1}s`;
            this.logsContainer.appendChild(logElement);
        });
        
        if (logs.length > 0) {
            this.lastLogId = logs[0].id;
        }
    }

    getVotedLogs() {
        return JSON.parse(localStorage.getItem('votedLogs') || '[]');
    }

    saveVotedLogs() {
        localStorage.setItem('votedLogs', JSON.stringify(Array.from(this.votedLogs)));
    }

    createLogElement(log) {
        const logElement = document.createElement('div');
        logElement.className = 'log-entry fade-in';
        logElement.dataset.logId = log.id;
        
        const timeAgo = this.getTimeAgo(new Date(log.timestamp));
        const hasVoted = this.votedLogs.has(log.id);
        
        logElement.innerHTML = `
            <div class="log-header">
                <div class="vote-section">
                    <button class="vote-button ${hasVoted ? 'voted' : ''}" 
                            title="${hasVoted ? 'Already voted' : 'Upvote this scenario'}"
                            ${hasVoted ? 'disabled' : ''}>
                        ▲
                    </button>
                    <span class="vote-count">${log.votes || 0}</span>
                </div>
                <span class="log-id">${log.id}</span>
                <span class="log-time">${timeAgo}</span>
                <span class="severity-badge ${log.severity.toLowerCase()}">${log.severity}</span>
            </div>
            <h3 class="log-title">${log.title}</h3>
            <p class="log-content">${log.content}</p>
            <div class="log-footer">
                <span class="location-badge">${log.location}</span>
                <span class="status-badge ${log.status.toLowerCase()}">${log.status}</span>
            </div>
            <button class="details-button">VIEW DETAILS</button>
        `;

        // Add vote handler
        const voteButton = logElement.querySelector('.vote-button');
        if (!hasVoted) {
            voteButton.addEventListener('click', async (e) => {
                e.stopPropagation();
                await this.upvoteLog(log.id);
            });
        }

        // Add details handler
        const detailsButton = logElement.querySelector('.details-button');
        detailsButton.addEventListener('click', () => {
            this.showDetailedLog(log);
        });

        return logElement;
    }

    async upvoteLog(logId) {
        if (this.votedLogs.has(logId)) return;
    
        try {
            const response = await fetch('/api/logs?action=vote', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ logId })
            });
            
            const data = await response.json();
            if (data.success) {
                // Update vote count
                const voteCount = document.querySelector(`[data-log-id="${logId}"] .vote-count`);
                const voteButton = document.querySelector(`[data-log-id="${logId}"] .vote-button`);
                
                if (voteCount && voteButton) {
                    voteCount.textContent = data.votes;
                    voteCount.classList.add('vote-updated');
                    setTimeout(() => voteCount.classList.remove('vote-updated'), 300);
                    
                    // Mark as voted
                    voteButton.classList.add('voted');
                    voteButton.disabled = true;
                    voteButton.title = 'Already voted';
                    
                    // Save to voted logs
                    this.votedLogs.add(logId);
                    this.saveVotedLogs();
    
                    // Refresh the logs if sorted by votes
                    if (this.currentSort === 'votes') {
                        await this.fetchLogs();
                    }
                }
            }
        } catch (error) {
            console.error('Error voting:', error);
        }
    }

    showDetailedLog(log) {
        const modalContent = document.getElementById('modal-content');
        
        modalContent.innerHTML = `
            <div class="detailed-log">
                <div class="log-header">
                    <span class="log-id">${log.id}</span>
                    <h2 class="log-title">${log.title}</h2>
                </div>
                
                <div class="log-section scenario">
                    <h3>SCENARIO OVERVIEW</h3>
                    <p>${log.content}</p>
                </div>

                <div class="log-section timeline">
                    <h3>EVENT TIMELINE</h3>
                    <ul class="cyber-list">
                        ${log.timeline.map(event => `<li>${event}</li>`).join('')}
                    </ul>
                </div>

                <div class="log-section observations">
                    <h3>CRITICAL OBSERVATIONS</h3>
                    <ul class="cyber-list">
                        ${log.observations.map(obs => `<li>${obs}</li>`).join('')}
                    </ul>
                </div>

                <div class="log-status-bar">
                    <span class="status-item severity-${log.severity.toLowerCase()}">${log.severity}</span>
                    <span class="status-item">${log.location}</span>
                    <span class="status-item status-${log.status.toLowerCase()}">${log.status}</span>
                    <span class="status-item">${new Date(log.timestamp).toLocaleString()}</span>
                </div>
            </div>
        `;

        this.modal.classList.add('active');
    }

    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        
        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60
        };

        for (const [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInUnit);
            if (interval >= 1) {
                return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
            }
        }
        
        return 'Just now';
    }

    setupLearnButton() {
        // Create modal HTML if it doesn't exist
        if (!document.getElementById('about-overlay')) {
            const modalHTML = `
                <div class="modal-overlay" id="about-overlay">
                    <div class="about-modal" id="about-modal">
                        <div class="about-section">
                            <h2>EOTW PROTOCOL</h2>
                            <p>The End of the World (EOTW) Protocol is an advanced monitoring system designed to track and analyze potential extinction-level events and global catastrophic scenarios. Using cutting-edge AI technology and blockchain infrastructure, we provide real-time assessment of worldwide threats to human civilization.</p>
                        </div>

                        <div class="about-section">
                            <h2>TECHNOLOGY STACK</h2>
                            <div class="tech-grid">
                                <div class="tech-item">
                                    <h3>AI SYSTEMS</h3>
                                    <p>Powered by OpenAI GPT-3.5 and Anthropic's Claude, our system generates detailed analysis of potential global catastrophic scenarios with scientific accuracy.</p>
                                </div>
                                <div class="tech-item">
                                    <h3>BLOCKCHAIN STORAGE</h3>
                                    <p>Utilizing Shadowdrive and GenesysGo for decentralized, immutable storage of all scenario data and analytical results on the Solana blockchain.</p>
                                </div>
                                <div class="tech-item">
                                    <h3>REAL-TIME PROCESSING</h3>
                                    <p>Advanced algorithms process and analyze global data streams to identify and assess potential threats to human civilization.</p>
                                </div>
                                <div class="tech-item">
                                    <h3>DISTRIBUTED SYSTEM</h3>
                                    <p>Built on decentralized infrastructure to ensure continuous operation and data integrity during global catastrophic events.</p>
                                </div>
                            </div>
                        </div>

                        <div class="about-section">
                            <h2>PURPOSE</h2>
                            <p>The EOTW Protocol serves as an early warning system for civilization-ending scenarios, providing detailed analysis and recommendations for global-scale threats. Our mission is to monitor and document potential extinction-level events, enabling better preparation and response strategies for worldwide catastrophes.</p>
                        </div>

                        <button class="close-button" id="about-close">&times;</button>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }

        // Add event listeners
        const learnButton = document.querySelector('.learn-more');
        const closeButton = document.getElementById('about-close');
        const overlay = document.getElementById('about-overlay');
        const modal = document.getElementById('about-modal');

        if (learnButton) {
            learnButton.addEventListener('click', () => {
                overlay.classList.add('active');
                modal.classList.add('active');
            });
        }

        closeButton.addEventListener('click', () => {
            overlay.classList.remove('active');
            modal.classList.remove('active');
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
                modal.classList.remove('active');
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                overlay.classList.remove('active');
                modal.classList.remove('active');
            }
        });
    }
}

// Initialize everything when the document loads
document.addEventListener('DOMContentLoaded', () => {
    new PopulationCounter();
    new LogManager();

    // Modal close handler
    const modal = document.getElementById('modal');
    const closeButton = modal.querySelector('.close-button');
    
    closeButton.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            modal.classList.remove('active');
        }
    });
});