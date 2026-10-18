const Block = require('./block');
const { MINING_REWARD } = require('../config');
const Transaction = require('../wallet/transaction');
const Wallet = require('../wallet');

class Blockchain {
    constructor() {
        this.chain = [Block.genesis()];
    }

    addBlock({ data }) {
        const lastBlock = this.chain[this.chain.length - 1];
        const block = Block.mineBlock({
            lastBlock,
            data
        });

        this.chain.push(block);
        return block;
    }

    static isValidChain(chain) {
        if (JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis())) {
            return false;
        }

        for (let i = 1; i < chain.length; i++) {
            const block = chain[i];
            const lastBlock = chain[i - 1];
            const { timestamp, lastHash, hash, data, nonce, difficulty } = block;
            const actualLastHash = lastBlock.hash;
            const lastDifficulty = lastBlock.difficulty;

            // Validate block hash
            if (lastHash !== actualLastHash) return false;

            // Validate proof of work
            if (hash !== Block.hash({ timestamp, lastHash, data, nonce, difficulty })) return false;

            // Validate difficulty adjustment
            if (Math.abs(lastDifficulty - difficulty) > 1) return false;

            // Validate transactions if this is not the genesis block
            if (i > 0) {
                let rewardTransaction = data.find(tx => tx.input.address === '*mining-reward*');

                // Check if there's exactly one reward transaction
                if (!rewardTransaction || data.filter(tx => tx.input.address === '*mining-reward*').length !== 1) {
                    return false;
                }

                // Check if reward amount is correct
                if (rewardTransaction.outputs[0].amount !== MINING_REWARD) {
                    return false;
                }

                // Validate all transactions in the block
                const transactions = data.filter(tx => tx.input.address !== '*mining-reward*');

                for (let transaction of transactions) {
                    if (!Transaction.verifyTransaction(transaction)) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    replaceChain(chain, validateTransactions, onSuccess) {
        if (chain.length <= this.chain.length) {
            console.error('The incoming chain is not longer than the current chain');
            return;
        }

        if (!Blockchain.isValidChain(chain)) {
            console.error('The incoming chain is not valid');
            return;
        }

        if (validateTransactions && !this.validTransactionData({ chain })) {
            console.error('The incoming chain has invalid transaction data');
            return;
        }

        if (onSuccess) onSuccess();
        console.log('Replacing chain with', chain);
        this.chain = chain;
    }

    validTransactionData({ chain }) {
        for (let i = 1; i < chain.length; i++) {
            const block = chain[i];
            const transactionSet = new Set();
            let rewardTransactionCount = 0;

            for (let transaction of block.data) {
                if (transaction.input.address === '*mining-reward*') {
                    rewardTransactionCount++;

                    if (rewardTransactionCount > 1) {
                        console.error('Miner rewards exceed limit');
                        return false;
                    }

                    if (Object.values(transaction.outputs)[0].amount !== MINING_REWARD) {
                        console.error('Miner reward amount is invalid');
                        return false;
                    }
                } else {
                    if (!Transaction.verifyTransaction(transaction)) {
                        console.error('Invalid transaction');
                        return false;
                    }

                    // The balance a transaction's input.amount claims has
                    // to be checked against the candidate chain's own state
                    // just before this block - not against this.chain, the
                    // validating node's own separate, live chain. Those are
                    // usually different chains entirely, but when a node
                    // validates a peer's chain that happens to share a
                    // block this node already mined itself, this.chain
                    // already has that very transaction applied, so the
                    // comparison was against a *post*-transaction balance
                    // and failed on every chain sharing any block with the
                    // validating node - confirmed by actually running two
                    // nodes and watching the second one reject the first
                    // one's chain with "invalid transaction data" the
                    // moment it tried to sync.
                    const trueBalance = Wallet.calculateBalance({
                        chain: chain.slice(0, i),
                        address: transaction.input.address
                    });

                    if (transaction.input.amount !== trueBalance) {
                        console.error('Invalid input amount');
                        return false;
                    }

                    if (transactionSet.has(transaction)) {
                        console.error('Duplicate transaction in block');
                        return false;
                    } else {
                        transactionSet.add(transaction);
                    }
                }
            }
        }

        return true;
    }
}

module.exports = Blockchain;
