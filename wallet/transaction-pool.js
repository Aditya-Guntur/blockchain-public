const Transaction = require('./transaction');
const ChainUtil = require('../chain-util');

class TransactionPool {
    constructor() {
        this.transactions = [];
    }

    updateOrAddTransaction(transaction) {
        let transactionWithId = this.transactions.find(t => t.id === transaction.id);
        
        if (transactionWithId) {
            // Update existing transaction
            this.transactions[this.transactions.indexOf(transactionWithId)] = transaction;
        } else {
            // Add new transaction
            this.transactions.push(transaction);
        }
    }

    existingTransaction(address) {
        return this.transactions.find(transaction => 
            transaction.input.address === address
        );
    }

    validTransactions() {
        return this.transactions.filter(transaction => {
            // Calculate the total output amount
            const outputTotal = transaction.outputs.reduce((total, output) => {
                return total + output.amount;
            }, 0);

            // Check if output total matches input amount
            if (transaction.input.amount !== outputTotal) {
                console.log(`Invalid transaction from ${transaction.input.address}: Output total does not match input`);
                return false;
            }

            // Verify the transaction signature
            if (!Transaction.verifyTransaction(transaction)) {
                console.log(`Invalid signature from ${transaction.input.address}`);
                return false;
            }

            return true;
        });
    }

    clear() {
        this.transactions = [];
    }

    // Clear the pool of any existing transaction and add new transactions
    clearBlockchainTransactions({ chain }) {
        // Get all transactions in the chain
        const chainTransactions = [];
        for (let i=1; i<chain.length; i++) {
            const block = chain[i];
            chainTransactions.push(...block.data);
        }

        // Filter out any transactions that are already in the blockchain
        this.transactions = this.transactions.filter(transaction => {
            return !chainTransactions.find(chainTransaction => 
                chainTransaction.id === transaction.id
            );
        });
    }
}

module.exports = TransactionPool;
