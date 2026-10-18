// Mines a run of real blocks directly against the Blockchain class (no
// server, no network) and records each block's actual mine time and
// difficulty, to show whether the adjustable-difficulty algorithm in
// blockchain/block.js actually converges on MINE_RATE in practice.
//
// Usage: node scripts/measure-difficulty.js [blockCount]
// Writes examples/mine_run.json; plot it with scripts/plot-difficulty.py.

const fs = require('fs');
const path = require('path');
const Blockchain = require('../blockchain');
const { MINE_RATE } = require('../config');

const blockCount = Number(process.argv[2]) || 30;

const bc = new Blockchain();
const rows = [];

for (let i = 0; i < blockCount; i++) {
    const start = Date.now();
    bc.addBlock({ data: `block ${i}` });
    const mineTimeMs = Date.now() - start;
    const newBlock = bc.chain[bc.chain.length - 1];

    rows.push({
        index: i + 1,
        difficulty: newBlock.difficulty,
        mineTimeMs,
        nonce: newBlock.nonce
    });
    console.log(`block ${i + 1}: difficulty=${newBlock.difficulty} mineTimeMs=${mineTimeMs} nonce=${newBlock.nonce}`);
}

console.log(`\nMINE_RATE target: ${MINE_RATE}ms`);

const outPath = path.join(__dirname, '..', 'examples', 'mine_run.json');
fs.writeFileSync(outPath, JSON.stringify(rows, null, 2));
console.log(`Wrote ${outPath}`);
