const ChainUtil = require('../chain-util');
const { MINING_REWARD, MINING_INPUT } = require('../config');

class Transaction {
    constructor() {
        this.id = ChainUtil.id();
        this.input = null;
        this.outputs = [];
    }

    update(senderWallet, recipient, amount) {
        const senderOutput = this.outputs.find(output => output.address === senderWallet.publicKey);

        if (amount > senderOutput.amount) {
            console.log(`Amount: ${amount} exceeds balance`);
            return;
        }

        // Update sender's output with remaining balance
        senderOutput.amount = senderOutput.amount - amount;

        // Add recipient's output
        this.outputs.push({ amount, address: recipient });

        // Sign the transaction again with updated outputs
        Transaction.signTransaction(this, senderWallet);

        return this;
    }

    static transactionWithOutputs(senderWallet, outputs) {
        const transaction = new this();
        transaction.outputs.push(...outputs);
        Transaction.signTransaction(transaction, senderWallet);
        return transaction;
    }

    static newTransaction(senderWallet, recipient, amount) {
        if (amount > senderWallet.balance) {
            console.log(`Amount: ${amount} exceeds balance`);
            return;
        }

        return Transaction.transactionWithOutputs(senderWallet, [
            {
                amount: senderWallet.balance - amount,
                address: senderWallet.publicKey
            },
            {
                amount,
                address: recipient
            }
        ]);
    }

    static rewardTransaction(minerWallet, blockchainWallet) {
        // A reward transaction isn't signed by a real wallet - it's minted
        // by the protocol itself when a block is mined, and Blockchain's
        // isValidChain()/validTransactionData() both identify it by the
        // MINING_INPUT sentinel address ('*mining-reward*'). Routing it
        // through transactionWithOutputs()/signTransaction() instead signed
        // it with blockchainWallet's real keypair and set input.address to
        // that pubkey, so no mined block's reward transaction ever matched
        // the sentinel and every block with a real reward failed chain
        // validation.
        const transaction = new this();
        transaction.outputs.push({ amount: MINING_REWARD, address: minerWallet.publicKey });
        // Wallet.calculateBalance() only counts an output if its
        // transaction's input.timestamp is newer than the recipient's own
        // last transaction - MINING_INPUT has no timestamp field, so
        // `undefined > startTime` was always false and every mined reward
        // was silently never credited to anyone's balance, despite being
        // part of a perfectly valid block.
        transaction.input = { ...MINING_INPUT, timestamp: Date.now() };
        return transaction;
    }

    static signTransaction(transaction, senderWallet) {
        // input.amount is the sender's total balance at signing time, which
        // must equal the sum of this transaction's outputs (change back to
        // the sender + whatever was actually sent). It was missing
        // entirely, so TransactionPool.validTransactions() and
        // Blockchain.validTransactionData() - both of which compare
        // input.amount against the real output total - rejected every
        // single transaction as invalid, always.
        transaction.input = {
            timestamp: Date.now(),
            amount: senderWallet.balance,
            address: senderWallet.publicKey,
            signature: senderWallet.sign(ChainUtil.hash(transaction.outputs))
        };
    }

    static verifyTransaction(transaction) {
        return ChainUtil.verifySignature({
            publicKey: transaction.input.address,
            data: transaction.outputs,
            signature: transaction.input.signature
        });
    }
}

module.exports = Transaction;
