
'use strict';

const crypto = require('crypto'); 
const Sentry = require('../sentry.js');

class Cipher {
  constructor(key, algorithm) {  
    this.key = key;
    this.algorithm = algorithm;
  }

  encrypt(str) {
    let sha256 = crypto.createHash('sha256');
    sha256.update(this.key);
    let iv = crypto.randomBytes(16);
    let cipher = crypto.createCipheriv(this.algorithm, sha256.digest(), iv);
    let ciphertext = cipher.update(Buffer.from(str));
    let encrypted = Buffer.concat([iv, ciphertext, cipher.final()]).toString('base64');
    return encrypted;
  }

  decrypt(enc) { 

    // return without decryption  
    // if( enc.length  < 30) return enc ;    //#####  TODO:  remove this line  after converting all db password encrypted 
    try {
      let sha256 = crypto.createHash('sha256');
      sha256.update(this.key);
      let input = Buffer.from(enc, 'base64');
      let iv = input.slice(0, 16);
      let decipher = crypto.createDecipheriv(this.algorithm, sha256.digest(), iv);
      let ciphertext = input.slice(16);
      let plaintext = decipher.update(ciphertext) + decipher.final();
      return plaintext;
    }
    catch( err){
      console.error( "----err-----------") 
      // console.error( err) 
      Sentry.captureError(err);
      return ''; 
      // return enc
    }
 
  }
}
module.exports = Cipher;