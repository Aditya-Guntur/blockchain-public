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
        let balance = this.balance;
        const transactions = [];

        // Get all transactions from the blockchain
        for (let i = 1; i < blockchain.chain.length; i++) {
            const block = blockchain.chain[i];
            for (let transaction of block.data) {
                if (transaction.id && transaction.input && transaction.outputs) {
                    transactions.push(transaction);
                }
            }
        }

        // Get all transactions for this wallet
        const walletInputs = transactions
            .filter(transaction => transaction.input.address === this.publicKey);

        let startTime = 0;
        if (walletInputs.length > 0) {
            const recentInput = walletInputs
                .reduce((prev, current) =>
                    prev.input.timestamp > current.input.timestamp ? prev : current);

            balance = recentInput.outputs
                .find(output => output.address === this.publicKey).amount;
            startTime = recentInput.input.timestamp;
        }

        // Calculate balance from all outputs after the most recent transaction
        transactions.forEach(transaction => {
            if (transaction.input.timestamp > startTime) {
                transaction.outputs.forEach(output => {
                    if (output.address === this.publicKey) {
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
