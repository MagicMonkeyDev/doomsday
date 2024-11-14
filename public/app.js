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
        this.initialize();
    }

    async initialize() {
        // Show loading state
        this.logsContainer.innerHTML = '<div class="loading">INITIALIZING LOGS...</div>';
        
        // Get initial logs
        await this.fetchLogs();
        
        // Check for new logs every 5 minutes
        setInterval(() => this.checkForNewLogs(), 5 * 60 * 1000);
    }

    async fetchLogs() {
        try {
            const response = await fetch('http://localhost:3000/api/logs');
            const logs = await response.json();
            this.displayLogs(logs);
        } catch (error) {
            console.error('Error fetching logs:', error);
            this.logsContainer.innerHTML = '<div class="error">ERROR FETCHING LOGS...</div>';
        }
    }

    async checkForNewLogs() {
        try {
            const response = await fetch('http://localhost:3000/api/logs/latest');
            const latestLog = await response.json();
            
            if (latestLog) {
                this.addNewLog(latestLog);
            }
        } catch (error) {
            console.error('Error checking for new logs:', error);
        }
    }

    displayLogs(logs) {
        this.logsContainer.innerHTML = '';
        logs.forEach(log => this.addNewLog(log));
    }

    addNewLog(log) {
        const logElement = document.createElement('div');
        logElement.className = 'log-card';
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
                <span class="log-severity ${log.severity.toLowerCase()}">${log.severity}</span>
            </div>
        `;

        // Add click handler for detailed view
        logElement.addEventListener('click', () => this.showDetailedLog(log));

        // Add to container with animation
        logElement.style.opacity = '0';
        this.logsContainer.insertBefore(logElement, this.logsContainer.firstChild);
        requestAnimationFrame(() => {
            logElement.style.opacity = '1';
        });
    }

    showDetailedLog(log) {
        const modal = document.getElementById('modal');
        const modalContent = document.getElementById('modal-content');
        
        modalContent.innerHTML = `
            <div class="detailed-log">
                <div class="log-header">
                    <span class="log-id">${log.id}</span>
                    <h2 class="log-title">${log.title}</h2>
                </div>
                
                <div class="log-section">
                    <h3>SCENARIO</h3>
                    <p>${log.content}</p>
                </div>

                <div class="log-section">
                    <h3>TIMELINE</h3>
                    <ul>
                        ${log.timeline.map(event => `<li>${event}</li>`).join('')}
                    </ul>
                </div>

                <div class="log-section">
                    <h3>OBSERVATIONS</h3>
                    <ul>
                        ${log.observations.map(obs => `<li>${obs}</li>`).join('')}
                    </ul>
                </div>

                <div class="log-footer">
                    <span class="log-timestamp">${new Date(log.timestamp).toLocaleString()}</span>
                    <span class="log-severity ${log.severity.toLowerCase()}">${log.severity}</span>
                    <span class="log-location">${log.location}</span>
                    <span class="log-status">${log.status}</span>
                </div>
            </div>
        `;

        modal.classList.add('active');
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