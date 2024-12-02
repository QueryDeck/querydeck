'use strict';

const crypto = require('crypto');
const {
    KMSClient,
    GenerateDataKeyCommand,
    DecryptCommand
} = require('@aws-sdk/client-kms');

var cipherDetails = {
    algorithm: 'aes-256-ctr'
};

var db = require.main.require('./lib/maindb.js');

exports.init = (callback) => {
    var kmsClient = new KMSClient({
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        },
        region: process.env.AWS_REGION
    });

    db.query({
        text: 'with s1 as (select cipher_text_encrypted from kms_keys where arn = $1), s2 as (select count(*) as db_count from databases) select * from s2 left join s1 on true',
        values: [process.env.AWS_KMS_KEY_ARN]
    }, function(err, result) {
        if(err) return callback(err);
        if(result.rows && result.rows[0].cipher_text_encrypted) {

          cipherDetails.encryptedKey = Buffer.from(result.rows[0].cipher_text_encrypted, 'base64');

          kmsClient.send(new DecryptCommand({
            CiphertextBlob: cipherDetails.encryptedKey
          })).then(
              (decryptResult) => {
                  // process data.
                  cipherDetails.encryptionKey = decryptResult.Plaintext;
                  callback(null);
              },
              (error) => {
                  // error handling.
                  callback(error);
              }
          );
          
        } else {

          // TODO: uncomment this later. if encrypted data exists without key, throw error
          // if(result.rows[0].db_count > 0) {
          //   return callback({error: 'No matching key found for encrypted data'});
          // }
          kmsClient.send(new GenerateDataKeyCommand({
              KeyId: process.env.AWS_KMS_KEY_ARN,
              KeySpec: 'AES_256'
          })).then(
              (data) => {
                  // process data.
                  cipherDetails.encryptionKey = data.Plaintext;
                  cipherDetails.encryptedKey = data.CiphertextBlob;

                  db.query({
                    text: 'insert into kms_keys (cipher_text_encrypted, arn) values ($1, $2)',
                    values: [Buffer.from(cipherDetails.encryptedKey).toString('base64'), process.env.AWS_KMS_KEY_ARN]
                  }, function(err, result) {
                    if(err) return callback(err);
                    callback(null);
                  })
              
              },
              (error) => {
                  // error handling.
                  callback(error);
              }
          );
        }

    })

    
}

exports.encrypt = (str) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(cipherDetails.algorithm, cipherDetails.encryptionKey, iv);
    const encrypted = Buffer.concat([iv, cipher.update(str), cipher.final()]);
    return encrypted.toString('base64');
}

exports.decrypt = (enc) => {
    const buffer = Buffer.from(enc, 'base64');
    const iv = buffer.slice(0, 16);
    const encrypted = buffer.slice(16);
    const decipher = crypto.createDecipheriv(cipherDetails.algorithm, cipherDetails.encryptionKey, iv);
    return decipher.update(encrypted) + decipher.final('utf8');
}

// class Cipher {
//   constructor(keyId, callback) {
//     this.keyId = keyId;
//     this.algorithm = 'aes-256-ctr';
//     this.kmsClient = new KMSClient({
//       credentials: {
//           accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//           secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
//       },
//       region: process.env.AWS_REGION
//   });
//     this.kmsClient.send(new GenerateDataKeyCommand({
//       KeyId: this.keyId,
//       KeySpec: 'AES_256'
//     })).then(
//       (data) => {
//         // process data.
//         this.encryptionKey = data.Plaintext;
//         this.encryptedKey = data.CiphertextBlob;
//         callback(null, this);
//       },
//       (error) => {
//         // error handling.
//         callback(error);
//       }
//     );
//   }

//   encrypt(str) {
//     try {
//       const iv = crypto.randomBytes(16);
//       const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
//       const encrypted = Buffer.concat([iv, cipher.update(str), cipher.final()]);
//       return encrypted.toString('base64');
//     } catch (err) {
//       throw err;
//     }
//   }

//   decrypt(enc) {
//     try {
//       const buffer = Buffer.from(enc, 'base64');
//       const iv = buffer.slice(0, 16);
//       const encrypted = buffer.slice(16);
//       const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
//       return decipher.update(encrypted) + decipher.final('utf8');
//     } catch (err) {
//       return '';
//     }
//   }
// }
// module.exports = Cipher;