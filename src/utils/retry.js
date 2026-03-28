async function retry(fn, retries, baseDelay = 500) {
    let attempt = 0;
    while (true) {
        try {
            return await fn();
        } catch (err) {
            if (attempt >= retries) throw err;
            const delay = baseDelay * Math.pow(2, attempt);
            await new Promise(r => setTimeout(r, delay));
            attempt++;
        }
    }
}

module.exports = retry;