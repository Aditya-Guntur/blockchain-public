const Blockchain = require('./index');
const Block = require('./block');

describe('Blockchain', ()=>{
    let bc,bc2;

    beforeEach(()=>{
        bc  = new Blockchain();
        bc2 = new Blockchain();
        //THis is to create a new blockchain isntance for every unit test.
    });

    it('starts with genesis bloc',()=>{
        expect(bc.chain[0]).toEqual(Block.genesis());
    });

    it('adds a block',()=>{
        const data = 'foo';
        bc.addBlock(data);
        expect(bc.chain[1].data).toEqual(data);
    });


    it('invalidates chain with incorrect genesis',()=>{
        bc2.chain[0].data = 'hello';
        expect(bc2.isValidChain(bc2.chain)).toEqual(false);
    })

    it('replaces chain with longer chain', ()=>{
        data = 'foo';
        bc2.addBlock(data);

        expect(bc.replaceChain(bc2.chain)).toEqual(true);
    })

})
