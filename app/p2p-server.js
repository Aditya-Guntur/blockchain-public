const WebSocket = require('ws');
const blockchain = require('../blockchain');

const P2P_PORT = process.env.P2P_PORT || 5001;
//The above statement is to randomly assign a port to the connected user.

//This is ternary. It will return an array of all the websocket addresses.
const peers = process.env.PEERS ? process.env.PEERS.split(',') : [];

console.log("Peers:", peers);

/*We assume the above environment variable peers is a string that contains the list of all
the web socket addresses that this web socket should connect as a peer.
ex: if application running on 5001 as its p2p port, the web socket address will be:
ws://localhost:5001. And for our peers environment variable if there is more than one to
connect to, we combine them with strings,

Thus : PEERS= ws://localhost:5001,ws://localhost:5002. Thus the 2 will be joined as strings
and seperated by a comma.*/


class P2pServer {
    constructor(blockchain){
        /*the reason we are passign blockchain as a parameter here is so that every user
        can receive the blockchain and  build on top of it and share their final objects. */

        this.blockchain = blockchain;
        this.sockets = [];//THis contains a list of connected websocket servers.
    }

    listen(){
        //This function will do the task of starting and creating the server
        const server = new WebSocket.Server({port : P2P_PORT});//This is to create the server.

        server.on("connection", socket=>this.connectSocket(socket));/*This can listen for
        incoming messages. The string is for specifying the event that we are listening for.
        Thus by listening for connection events, we can fire specific code whenever
        new socket connects to the server and inorder to interact with that socket, we
        are given a callback function. in that, we have created a helper function that passes
        the socket and does the job of pushign the socket into thee array*/

        this.connectToPeers();

        console.log(`Listening for peer to peer connections on: ${P2P_PORT}`);
    }

    connectToPeers(){
        peers.forEach(peer => {
            //peer variable will hold the address of the peer
            const socket = new WebSocket(peer);//This creates a new websocket.

            socket.on('open',()=> this.connectSocket(socket));
        });
    }

    connectSocket(socket){
        //All the sockets  work with the help of this.
        this.sockets.push(socket);
        console.log("Socket connected");

        this.messageHandler(socket);
        this.sendChain(socket);
    }

    sendChain(socket){
        socket.send(JSON.stringify(this.blockchain.chain));
    }


    messageHandler(socket){
        socket.on('message', message =>{
            const data = JSON.parse(message); /*Messages are strigified objects. Thus we have to turn them back
            into a regular object by using this above function. This changes the stringified
            json into a javascript object that is being stored in the data variable.*/

            console.log('data',data);
        })
    }

    syncChains(){
        this.sockets.forEach(socket=>this.sendChain(socket));
    }


}

module.exports = P2pServer;
