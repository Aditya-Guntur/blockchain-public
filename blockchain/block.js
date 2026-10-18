const SHA256 = require('crypto-js/sha256');
const { DIFFICULTY, MINE_RATE } = require('../config');
const hexToBinary = require('hex-to-binary');

class Block {
    constructor({ timestamp, lastHash, hash, data, nonce, difficulty }) {
        this.timestamp = timestamp;
        this.lastHash = lastHash;
        this.hash = hash;
        this.data = data;
        this.nonce = nonce;
        this.difficulty = difficulty || DIFFICULTY;
    }

    toString() {
        return `Block -
            Timestamp : ${this.timestamp}
            Last Hash : ${this.lastHash.substring(0, 10)}
            Hash      : ${this.hash.substring(0, 10)}
            Nonce     : ${this.nonce}
            Difficulty: ${this.difficulty}
            Data      : ${this.data}`;
    }

    static genesis() {
        return new this({
            timestamp: 'Genesis time',
            lastHash: '----',
            hash: 'genesis-hash',
            data: [],
            nonce: 0,
            difficulty: DIFFICULTY
        });
    }

    static mineBlock({ lastBlock, data }) {
        let hash, timestamp;
        const lastHash = lastBlock.hash;
        let { difficulty } = lastBlock;
        let nonce = 0;

        do {
            nonce++;
            timestamp = Date.now();
            difficulty = Block.adjustDifficulty({
                originalBlock: lastBlock,
                timestamp
            });
            hash = Block.hash({
                timestamp,
                lastHash,
                data,
                nonce,
                difficulty
            });
        } while (hexToBinary(hash).substring(0, difficulty) !== '0'.repeat(difficulty));

        return new this({
            timestamp,
            lastHash,
            data,
            difficulty,
            nonce,
            hash
        });
    }

    static hash({ timestamp, lastHash, data, nonce, difficulty }) {
        return SHA256(
            `${timestamp}${lastHash}${JSON.stringify(data)}${nonce}${difficulty}`
        ).toString();
    }

    static blockHash(block) {
        const { timestamp, lastHash, data, nonce, difficulty } = block;
        return Block.hash({
            timestamp,
            lastHash,
            data,
            nonce,
            difficulty
        });
    }

    static adjustDifficulty({ originalBlock, timestamp }) {
        const { difficulty } = originalBlock;
        
        // Prevent difficulty from going below 1
        if (difficulty < 1) return 1;

        // Adjust difficulty based on MINE_RATE
        if ((timestamp - originalBlock.timestamp) > MINE_RATE) {
            return difficulty - 1;
        }
        
        return difficulty + 1;
    }
}

module.exports = Block;