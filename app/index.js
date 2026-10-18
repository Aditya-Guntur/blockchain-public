const express = require('express');
const bodyParser = require('body-parser');

const Blockchain = require('../blockchain');
const Wallet = require('../wallet');
const TransactionPool = require('../wallet/transaction-pool');
const P2pServer = require('./p2p-server');

// If no environment variable is set, each of these falls back to a default
// so multiple instances on one machine need HTTP_PORT/P2P_PORT/PEERS set
// explicitly, e.g.: HTTP_PORT=3002 P2P_PORT=5002 PEERS=ws://localhost:5001 npm start
const HTTP_PORT = process.env.HTTP_PORT || 3001;

const app = express();
const bc = new Blockchain();
const wallet = new Wallet();
const transactionPool = new TransactionPool();
// p2pServer always needs a transactionPool to apply CHAIN messages (it
// clears mined transactions out of the pool on every successful replace),
// even before any endpoint here uses the pool directly.
const p2pServer = new P2pServer({ blockchain: bc, transactionPool });

app.use(bodyParser.json());

app.get('/blocks', (req, res) => {
    res.json(bc.chain);
});

app.post('/mine', (req, res) => {
    // addBlock() takes { data }, not a bare value - this used to call
    // bc.addBlock(req.body.data) positionally, which destructured `data`
    // off of whatever req.body.data was instead of treating it as the
    // data itself, so every block mined through this endpoint had
    // data: undefined no matter what was posted.
    const block = bc.addBlock({ data: req.body.data });
    console.log(`New block added: ${block.toString()}`);
    p2pServer.syncChains();
    res.redirect('/blocks');
});

app.get('/public-key', (req, res) => {
    res.json({ publicKey: wallet.publicKey });
});

app.get('/wallet-info', (req, res) => {
    res.json({
        address: wallet.publicKey,
        balance: Wallet.calculateBalance({ chain: bc.chain, address: wallet.publicKey })
    });
});

app.listen(HTTP_PORT, () => console.log(`Listening on port ${HTTP_PORT}`));

p2pServer.listen();
