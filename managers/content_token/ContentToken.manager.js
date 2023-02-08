const { secretbox, randomBytes } = require("tweetnacl");
const {
  decodeUTF8,
  encodeUTF8,
  encodeBase64,
  decodeBase64
} = require("tweetnacl-util");



module.exports = class ContentToken {

    constructor({config}){
      this.nacl_secret = config.dotEnv.NACL_SECRET;
    }

    _newNonce(){
      return randomBytes(secretbox.nonceLength);
    }

    encrypt(json) {
      const key = this.nacl_secret;
      const keyUint8Array = decodeBase64(key);
    
      const nonce = this._newNonce();
      const messageUint8 = decodeUTF8(JSON.stringify(json));
      const box = secretbox(messageUint8, nonce, keyUint8Array);
    
      const fullMessage = new Uint8Array(nonce.length + box.length);
      fullMessage.set(nonce);
      fullMessage.set(box, nonce.length);
    
      const base64FullMessage = encodeBase64(fullMessage);
      return base64FullMessage;
    }

    decrypt(messageWithNonce) {
      try {
        const key = this.nacl_secret;
        const keyUint8Array = decodeBase64(key);
        const messageWithNonceAsUint8Array = decodeBase64(messageWithNonce);
        const nonce = messageWithNonceAsUint8Array.slice(0, secretbox.nonceLength);
        const message = messageWithNonceAsUint8Array.slice(
          secretbox.nonceLength,
          messageWithNonce.length
        );
      
        const decrypted = secretbox.open(message, nonce, keyUint8Array);
      
        if (!decrypted) {
          throw new Error("Could not decrypt message");
        }
      
        const base64DecryptedMessage = encodeUTF8(decrypted);
        return JSON.parse(base64DecryptedMessage);
      } catch(err){
        return false;
      }
    }
}