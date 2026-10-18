const Transaction = require("./transaction");
const Wallet = require("./index");
const { MINING_REWARD } = require('../config');

describe('Transaction', () => {
    let transaction, wallet, recipient, amount, blockchain;

    beforeEach(() => {
        wallet = new Wallet();
        amount = 50;
        recipient = 'r3c1p13nt';
        blockchain = { 
            chain: [{
                data: []
            }] 
        };
        transaction = Transaction.newTransaction(wallet, recipient, amount);
    });

    it('creates an output with the `amount` subtracted from the wallet balance', () => {
        const output = transaction.outputs.find(output => output.address === wallet.publicKey);
        expect(output.amount).toEqual(wallet.balance - amount);
    });

    it('outputs the `amount` added to the recipient', () => {
        const output = transaction.outputs.find(output => output.address === recipient);
        expect(output.amount).toEqual(amount);
    });

    it('inputs the balance of the wallet', () => {
        expect(transaction.input.amount).toEqual(wallet.balance);
    });

    it('validates a valid transaction', () => {
        expect(Transaction.verifyTransaction(transaction)).toBe(true);
    });

    it('invalidates a corrupt transaction', () => {
        transaction.outputs[0].amount = 50000;
        expect(Transaction.verifyTransaction(transaction)).toBe(false);
    });

    describe('transacting with an amount that exceeds the balance', () => {
        beforeEach(() => {
            amount = 50000;
            transaction = Transaction.newTransaction(wallet, recipient, amount);
        });

        it('does not create the transaction', () => {
            expect(transaction).toEqual(undefined);
        });
    });

    describe('and updating a transaction', () => {
        let nextAmount, nextRecipient;

        beforeEach(() => {
            nextAmount = 20;
            nextRecipient = 'n3xt-4ddr355';
            transaction = transaction.update(wallet, nextRecipient, nextAmount);
        });

        it(`subtracts the next amount from the sender's output`, () => {
            const senderOutput = transaction.outputs.find(output => output.address === wallet.publicKey);
            expect(senderOutput.amount).toEqual(wallet.balance - amount - nextAmount);
        });

        it('outputs an amount for the next recipient', () => {
            const recipientOutput = transaction.outputs.find(output => output.address === nextRecipient);
            expect(recipientOutput.amount).toEqual(nextAmount);
        });
    });

    describe('creating a reward transaction', () => {
        beforeEach(() => {
            transaction = Transaction.rewardTransaction(wallet, Wallet.blockchainWallet());
        });

        it(`rewards the miner's wallet`, () => {
            const output = transaction.outputs.find(output => output.address === wallet.publicKey);
            expect(output.amount).toEqual(MINING_REWARD);
        });
    });
});
