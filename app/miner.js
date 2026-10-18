const Transaction = require('../wallet/transaction');
const Wallet = require('../wallet');
const { MINING_REWARD } = require('../config');

class Miner {
    constructor({ blockchain, transactionPool, wallet, p2pServer }) {
        this.blockchain = blockchain;
        this.transactionPool = transactionPool;
        this.wallet = wallet;
        this.p2pServer = p2pServer;
    }

    /**
     * Mines a new block including valid transactions from the pool
     * @returns {Block} The newly mined block
     */
    mine() {
        // Get valid transactions from the pool
        const validTransactions = this.transactionPool.validTransactions();

        // Include a reward for the miner
        validTransactions.push(
            Transaction.rewardTransaction(this.wallet, Wallet.blockchainWallet())
        );

        // Create a block with the valid transactions
        const block = this.blockchain.addBlock({ data: validTransactions });

        // Sync chains in the P2P server
        this.p2pServer.syncChains();

        // Clear the transaction pool
        this.transactionPool.clear();

        // Broadcast to every miner to clear their transaction pools
        this.p2pServer.broadcastClearTransactions();

        return block;
    }

    /**
     * Validates a transaction before adding it to the pool
     * @param {Transaction} transaction - The transaction to validate
     * @returns {boolean} True if the transaction is valid, false otherwise
     */
    validateTransaction(transaction) {
        // Check if the transaction is already in the pool
        if (this.transactionPool.existingTransaction(transaction.input.address)) {
            console.error('Transaction already in pool');
            return false;
        }

        // Verify the transaction
        if (!Transaction.verifyTransaction(transaction)) {
            console.error('Invalid transaction');
            return false;
        }

        // Check if the transaction amount is valid. transaction.output
        // (singular) doesn't exist on a Transaction - outputs is the
        // array - so this destructured undefined and threw every time
        // this method ran. input.amount is the real total value of the
        // transaction.
        const { amount } = transaction.input;
        if (amount <= 0) {
            console.error('Invalid transaction amount');
            return false;
        }

        // Check if the sender has sufficient balance
        const balance = Wallet.calculateBalance({
            chain: this.blockchain.chain,
            address: transaction.input.address
        });

        if (amount > balance) {
            console.error('Insufficient balance');
            return false;
        }

        return true;
    }

    /**
     * Adds a transaction to the pool if it's valid
     * @param {Transaction} transaction - The transaction to add
     * @returns {boolean} True if the transaction was added, false otherwise
     */
    addTransaction(transaction) {
        if (this.validateTransaction(transaction)) {
            this.transactionPool.updateOrAddTransaction(transaction);

            // Broadcast the transaction to the network
            this.p2pServer.broadcastTransaction(transaction);

            return true;
        }

        return false;
    }
}

module.exports = Miner;
