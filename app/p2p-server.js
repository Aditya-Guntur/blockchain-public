const WebSocket = require('ws');

const P2P_PORT = process.env.P2P_PORT || 5001;

// This is the list of websocket addresses this node should connect to as a
// peer, e.g. PEERS=ws://localhost:5002,ws://localhost:5003
const peers = process.env.PEERS ? process.env.PEERS.split(',') : [];

const MESSAGE_TYPES = {
    chain: 'CHAIN'
};

class P2pServer {
    constructor(blockchain) {
        this.blockchain = blockchain;
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

    messageHandler(socket) {
        socket.on('message', message => {
            const data = JSON.parse(message);

            // Previously: this only ever logged the parsed message and
            // never did anything with it - replaceChain() was never
            // called here, so two peers' chains never actually converged
            // no matter how many blocks either side mined.
            if (data.type === MESSAGE_TYPES.chain) {
                this.blockchain.replaceChain(data.chain);
            }
        });
    }

    syncChains() {
        this.sockets.forEach(socket => this.sendChain(socket));
    }
}

module.exports = P2pServer;
