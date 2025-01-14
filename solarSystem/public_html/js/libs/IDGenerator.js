class IDGenerator {
    static #instance = null;
    #counter = 0;
    #prefix = '';
    #lastTimestamp = 0;
    #usedIDs = new Set();

    constructor() {
        if (IDGenerator.#instance) {
            return IDGenerator.#instance;
        }
        IDGenerator.#instance = this;
    }

    static getInstance() {
        if (!IDGenerator.#instance) {
            IDGenerator.#instance = new IDGenerator();
        }
        return IDGenerator.#instance;
    }

    setPrefix(prefix) {
        this.#prefix = prefix;
        return this;
    }

    generate() {
        const timestamp = Date.now();
        if (timestamp === this.#lastTimestamp) {
            this.#counter++;
        } else {
            this.#counter = 0;
            this.#lastTimestamp = timestamp;
        }

        const id = `${this.#prefix}${timestamp}-${this.#counter}`;

        // Ensure uniqueness
        if (this.#usedIDs.has(id)) {
            // In the extremely unlikely case of a collision, recursively try again
            return this.generate();
        }

        this.#usedIDs.add(id);
        return id;
    }

    // Generate a shorter numeric ID if needed
    generateNumeric() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        const id = parseInt(`${timestamp}${random}`, 10);

        if (this.#usedIDs.has(id)) {
            return this.generateNumeric();
        }

        this.#usedIDs.add(id);
        return id;
    }

    // Clear used IDs (use with caution)
    clearUsedIDs() {
        this.#usedIDs.clear();
    }

    // Check if an ID exists
    exists(id) {
        return this.#usedIDs.has(id);
    }
}

// Export as singleton
const idGen = IDGenerator.getInstance();