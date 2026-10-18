const WebSocket = require('ws');

const P2P_PORT = process.env.P2P_PORT || 5001;

// This is the list of websocket addresses this node should connect to as a
// peer, e.g. PEERS=ws://localhost:5002,ws://localhost:5003
const peers = process.env.PEERS ? process.env.PEERS.split(',') : [];

const MESSAGE_TYPES = {
    chain: 'CHAIN',
    transaction: 'TRANSACTION',
    clear_transactions: 'CLEAR_TRANSACTIONS'
};

class P2pServer {
    constructor({ blockchain, transactionPool }) {
        this.blockchain = blockchain;
        this.transactionPool = transactionPool;
        this.sockets = [];
    }

    listen() {
        const server = new WebSocket.Server({ port: P2P_PORT });
        server.on('connection', socket => this.connectSocket(socket));
        this.connectToPeers();
        console.log(`Listening for peer to peer connections on: ${P2P_PORT}`);
    }

    connectToPeers() {
        peers.forEach(peer => {
            const socket = new WebSocket(peer);
            socket.on('open', () => this.connectSocket(socket));
        });
    }

    connectSocket(socket) {
        this.sockets.push(socket);
        console.log('Socket connected');

        this.messageHandler(socket);
        this.sendChain(socket);
    }

    sendChain(socket) {
        socket.send(JSON.stringify({
            type: MESSAGE_TYPES.chain,
            chain: this.blockchain.chain
        }));
    }

    sendTransaction(socket, transaction) {
        socket.send(JSON.stringify({
            type: MESSAGE_TYPES.transaction,
            transaction
        }));
    }

    messageHandler(socket) {
        socket.on('message', message => {
            const data = JSON.parse(message);

            switch (data.type) {
                case MESSAGE_TYPES.chain:
                    // validateTransactions=true, with a success callback
                    // that clears any pool transactions the newly-adopted
                    // chain already mined - otherwise a node could keep
                    // trying to re-mine transactions a peer already
                    // confirmed.
                    this.blockchain.replaceChain(data.chain, true, () => {
                        this.transactionPool.clearBlockchainTransactions({
                            chain: data.chain
                        });
                    });
                    break;
                case MESSAGE_TYPES.transaction:
                    // app/miner.js's addTransaction() already called
                    // p2pServer.broadcastTransaction(), but that method
                    // (and this whole case) didn't exist yet, so it
                    // crashed with a TypeError the first time anyone
                    // tried to submit a transaction on a node with any
                    // peers connected.
                    this.transactionPool.updateOrAddTransaction(data.transaction);
                    break;
                case MESSAGE_TYPES.clear_transactions:
                    this.transactionPool.clear();
                    break;
            }
        });
    }

    syncChains() {
        this.sockets.forEach(socket => this.sendChain(socket));
    }

    broadcastTransaction(transaction) {
        this.sockets.forEach(socket => this.sendTransaction(socket, transaction));
    }

    broadcastClearTransactions() {
        this.sockets.forEach(socket => socket.send(JSON.stringify({
            type: MESSAGE_TYPES.clear_transactions
        })));
    }
}

module.exports = P2pServer;
