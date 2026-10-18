const Blockchain = require('./index');
const Block = require('./block');

describe('Blockchain', () => {
    let bc, bc2;

    beforeEach(() => {
        bc = new Blockchain();
        bc2 = new Blockchain();
        // THis is to create a new blockchain isntance for every unit test.
    });

    it('starts with genesis bloc', () => {
        expect(bc.chain[0]).toEqual(Block.genesis());
    });

    it('adds a block', () => {
        const data = 'foo';
        bc.addBlock({ data });
        expect(bc.chain[1].data).toEqual(data);
    });

    it('invalidates chain with incorrect genesis', () => {
        bc2.chain[0].data = 'hello';
        expect(Blockchain.isValidChain(bc2.chain)).toEqual(false);
    });

    it('replaces chain with a longer valid chain', () => {
        bc2.addBlock({ data: 'foo' });

        bc.replaceChain(bc2.chain);
        expect(bc.chain).toEqual(bc2.chain);
    });

    it('does not replace the chain with one that is not longer', () => {
        bc.addBlock({ data: 'foo' });
        const originalChain = bc.chain;

        bc.replaceChain(bc2.chain);
        expect(bc.chain).toEqual(originalChain);
    });
});
