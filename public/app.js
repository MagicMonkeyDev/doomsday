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
        this.lastLogId = null;
        this.initialize();
    }

    async initialize() {
        this.logsContainer.innerHTML = '<div class="loading">INITIALIZING LOGS...</div>';
        await this.fetchLogs();
        // Check for new logs every minute
        setInterval(() => this.checkForNewLogs(), 60 * 1000);
    }

    async fetchLogs() {
        try {
            const response = await fetch('/api/logs');
            const logs = await response.json();
            this.displayLogs(logs);
        } catch (error) {
            console.error('Error fetching logs:', error);
            this.logsContainer.innerHTML = '<div class="error">ERROR FETCHING LOGS...</div>';
        }
    }

    displayLogs(logs) {
        this.logsContainer.innerHTML = '';
        logs.forEach((log, index) => {
            const logElement = this.createLogElement(log);
            // Add staggered animation delay
            logElement.style.animationDelay = `${index * 0.1}s`;
            this.logsContainer.appendChild(logElement);
        });
    }

    createLogElement(log) {
        const logElement = document.createElement('div');
        logElement.className = 'log-entry fade-in';
        
        // Calculate time ago
        const timeAgo = this.getTimeAgo(new Date(log.timestamp));
        
        logElement.innerHTML = `
            <div class="log-header">
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

        // Add click handler for detailed view
        logElement.querySelector('.details-button').addEventListener('click', () => {
            this.showDetailedLog(log);
        });

        return logElement;
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

    async checkForNewLogs() {
        const currentTime = Date.now();
        // Only try to generate a new log if 5 minutes have passed
        if (currentTime - this.lastCheckTime >= 5 * 60 * 1000) {
            try {
                const response = await fetch('/api/logs?generate=true');
                const newLog = await response.json();
                if (newLog && (!this.lastLogId || newLog.id !== this.lastLogId)) {
                    this.addNewLog(newLog);
                    this.lastLogId = newLog.id;
                }
                this.lastCheckTime = currentTime;
            } catch (error) {
                console.error('Error checking for new logs:', error);
            }
        }
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