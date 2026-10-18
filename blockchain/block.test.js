const Block = require("./block");
const {DIFFICULTY} = require('../config');

describe('Block', () => {


    let data, lastBlock, block;
    /*THe reason we declared the variables here and not in before each is becuase then the
    variables will only be in the scope of beforeEach rather than have scope in the unit test
    it functions. */

    beforeEach(() =>{
        data = 'bar';
        lastBlock = Block.genesis();
        block = Block.mineBlock(lastBlock,data);
    });


    it('sets the `data` to match the input', ()=> {
        expect(block.data).toEqual(data);
    });

    it('sets the `lastHash` to match the hash of the last block', () => {
        expect(block.lastHash).toEqual(lastBlock.hash);
    });

    it('generates a hash to match the difficulty.', ()=>{
        expect(block.hash.substring(0,block.difficulty)).toEqual('0'.repeat(block.difficulty));
    });

    it('lower the difficulty for slowly mined blocks', ()=>{
        expect(Block.adjustDifficulty(block, block.timestamp+360000 )).toEqual(block.difficulty-1)
    });

    if('increases the difficulty for fast mined blocks',()=>{
        expect(Block.adjustDifficulty(block, block.timestamp+1)).toEqual(block.difficulty+1)
    });
});
