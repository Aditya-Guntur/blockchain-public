const crypto = require('crypto');
const hexToBinary = require('hex-to-binary');

/**
 * Creates a SHA-256 hash of the input arguments
 * @param  {...any} inputs - Data to be hashed
 * @returns {string} - The resulting hash
 */
const cryptoHash = (...inputs) => {
    const hash = crypto.createHash('sha256');
    
    // Stringify and sort all inputs to ensure consistent hashing
    const stringifiedInputs = inputs.map(input => 
        typeof input === 'string' ? input : JSON.stringify(input)
    ).sort().join(' ');
    
    // Update the hash with the combined input
    hash.update(stringifiedInputs);
    
    // Return the hash as a hex string
    return hash.digest('hex');
};

/**
 * Converts a hex string to binary and compares the leading zeros with difficulty
 * @param {string} hash - The hash to check
 * @param {number} difficulty - The number of leading zeros required
 * @returns {boolean} - True if the hash meets the difficulty requirement
 */
const meetsDifficulty = (hash, difficulty) => {
    const hashInBinary = hexToBinary(hash);
    const requiredZeros = '0'.repeat(difficulty);
    return hashInBinary.startsWith(requiredZeros);
};

module.exports = {
    cryptoHash,
    meetsDifficulty
};
