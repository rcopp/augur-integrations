class RateLimiter {
    constructor(maxPerMinute) {
        this.capacity = maxPerMinute;
        this.tokens = maxPerMinute;
        this.refillInterval = 60000;
        this._interval = setInterval(() => this.tokens = this.capacity, this.refillInterval);
    }

    async acquire() {
        while (this.tokens <= 0) {
            await new Promise(r => setTimeout(r, 200));
        }
        this.tokens--;
    }

    stop() {
        clearInterval(this._interval);
    }
}

module.exports = RateLimiter;
