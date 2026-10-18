const { INITIAL_BALANCE } = require('../config');
const ChainUtil = require('../chain-util');
const Transaction = require('./transaction');

class Wallet {
    constructor() {
        this.balance = INITIAL_BALANCE;
        this.keyPair = ChainUtil.genKeyPair();
        this.publicKey = this.keyPair.getPublic().encode('hex');
        this.secret = this.keyPair.getPrivate('hex');
    }

    toString() {
        return `Wallet --
            publicKey: ${this.publicKey.toString()}
            balance  : ${this.balance}
            secret   : ${this.secret}`;
    }

    sign(dataHash) {
        return this.keyPair.sign(dataHash).toDER('hex');
    }

    createTransaction(recipient, amount, blockchain, transactionPool) {
        this.balance = this.calculateBalance(blockchain);

        if (amount > this.balance) {
            console.log(`Amount: ${amount} exceeds current balance: ${this.balance}`);
            return;
        }

        let transaction = transactionPool.existingTransaction(this.publicKey);

        if (transaction) {
            transaction.update(this, recipient, amount);
        } else {
            transaction = Transaction.newTransaction(this, recipient, amount);
            transactionPool.updateOrAddTransaction(transaction);
        }

        return transaction;
    }

    calculateBalance(blockchain) {
        // blockchain/index.js and app/miner.js both need to check an
        // arbitrary address's balance, not just this wallet's own - this
        // used to be the only implementation of this logic, as an instance
        // method keyed on `this.publicKey`, so a static
        // `Wallet.calculateBalance({ chain, address })` call just didn't
        // exist and crashed with a TypeError wherever it was called.
        return Wallet.calculateBalance({ chain: blockchain.chain, address: this.publicKey });
    }

    static calculateBalance({ chain, address }) {
        let balance = INITIAL_BALANCE;
        const transactions = [];

        // Get all transactions from the chain
        for (let i = 1; i < chain.length; i++) {
            const block = chain[i];
            for (let transaction of block.data) {
                if (transaction.id && transaction.input && transaction.outputs) {
                    transactions.push(transaction);
                }
            }
        }

        // Get all transactions sent by this address
        const addressInputs = transactions
            .filter(transaction => transaction.input.address === address);

        let startTime = 0;
        if (addressInputs.length > 0) {
            const recentInput = addressInputs
                .reduce((prev, current) =>
                    prev.input.timestamp > current.input.timestamp ? prev : current);

            balance = recentInput.outputs
                .find(output => output.address === address).amount;
            startTime = recentInput.input.timestamp;
        }

        // Add outputs received after the most recent transaction this
        // address sent
        transactions.forEach(transaction => {
            if (transaction.input.timestamp > startTime) {
                transaction.outputs.forEach(output => {
                    if (output.address === address) {
                        balance += output.amount;
                    }
                });
            }
        });

        return balance;
    }

    static blockchainWallet() {
        const blockchainWallet = new this();
        blockchainWallet.address = 'blockchain-wallet';
        return blockchainWallet;
    }
}

module.exports = Wallet;
