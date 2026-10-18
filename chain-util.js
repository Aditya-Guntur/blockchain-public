const { ec: EC } = require('elliptic');
const { cryptoHash } = require('./crypto-hash');
const { v1: uuidV1 } = require('uuid');
const ec = new EC('secp256k1');

class ChainUtil {
    static genKeyPair() {
        return ec.genKeyPair();
    }

    static id() {
        return uuidV1();
    }

    static hash(data) {
        return cryptoHash(data);
    }

    static verifySignature({ publicKey, data, signature }) {
        // Handle the case where publicKey is a string
        const key = typeof publicKey === 'string' 
            ? ec.keyFromPublic(publicKey, 'hex')
            : publicKey;
            
        return key.verify(cryptoHash(data), signature);
    }

    static parseJSON(jsonString) {
        try {
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('Error parsing JSON:', error);
            return null;
        }
    }
}

module.exports = ChainUtil;