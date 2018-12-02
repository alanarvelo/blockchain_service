/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');

const level = require('level');
const chainDB = './chaindata';
const db = level(chainDB);

const Block = require('./Block.js');

const hex2ascii = require('hex2ascii');


/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain{
  constructor(){
    this.getLastBlockHeight().then( (lastBlockHeight) => {
      if (lastBlockHeight == -1) this.addBlock(new Block("Create First Block"));
    });
  }

  // Add new block
  async addBlock(newBlock){
    try {
      // Getting the height of the last block=
      const lastBlockHeight = await this.getLastBlockHeight();
      
      if (lastBlockHeight >= 0) {
        newBlock.height =  lastBlockHeight + 1;
        // previous block
        const previousBlock = await this.getBlockByHeight(lastBlockHeight);
        // hash linking
        newBlock.previousBlockHash = previousBlock.hash;
        // encoding star's story
        newBlock.body.star.story = Buffer(newBlock.body.star.story).toString('hex');
        // Block hash with SHA256 using newBlock and converting to a string
        newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
        // Adding block object to chain
        await this.saveBlock(newBlock.height, JSON.stringify(newBlock).toString());

      } else if (lastBlockHeight == -1) {
        // create and save Genesis block
        newBlock.body = {"address": "0000GEN", "star": {"story": "First block in the chain - Genesis block"}};
        // encoding star's story
        newBlock.body.star.story = Buffer(newBlock.body.star.story).toString('hex');
        newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
        await this.saveBlock(newBlock.height, JSON.stringify(newBlock).toString());
      }
      console.log("Saved block successfully");
      return newBlock.height

    } catch (err) {
      console.log("There was an error in the addBlock method of the Blockchain Class", err);
      return err;
    }
  
  }


  // Add data to levelDB with key/value pair
  saveBlock(key,value){
    return new Promise((resolve, reject) => {
      // console.log('Block #' + key + ': ' + value );
      db.put(key, value, function(err, result) {
        if (err) reject(err);
        else resolve(true);
      });
    });
  }


  // Get last block height i.e. chain length
  getLastBlockHeight(){
    return new Promise(function (resolve, reject){
     let count = -1;
     db.createReadStream()
      .on('data', () => { count++; })
      .on('error', (err) => {
        reject(err);
        console.log('Error counting block to get the lastBlockHeight',  err);
      })
      .on('close', () => resolve(count) )
    })
  }


  // get block
  getBlockByHeight(blockHeight){
    return new Promise((resolve, reject) => {
      db.get(blockHeight, function(err, block) {
        if (err) reject(err); // return console.log('Error getting block', err);;
        else {
          block = JSON.parse(block);
          // decoding star's story
          block.body.star.storyDecoded = hex2ascii(block.body.star.story);
          resolve(block)
        };
      });
    });
  }


  // Get block by hash
  getBlockByHash(hash) {
    return new Promise((resolve, reject) => {
      let block = null;
      db.createReadStream()
        .on('data', (data) => {
          if (JSON.parse(data.value).hash === hash) {
              block = JSON.parse(data.value);
              // decoding star's story
              block.body.star.storyDecoded = hex2ascii(block.body.star.story);
            }
        })
        .on('error', function (err) {
            reject(err)
        })
        .on('close', function () {
            resolve(block);
        });
    });
  }


  // Get block by WalletAddress
  getBlockByWalletAddress(address) {
    return new Promise((resolve, reject) => {
      let blocks = [];
      db.createReadStream()
        .on('data', (data) => {
          if (JSON.parse(data.value).body.address === address) {
              let block = JSON.parse(data.value);
              // decoding star's story
              block.body.star.storyDecoded = hex2ascii(block.body.star.story);
              blocks.push(block);
            }
        })
        .on('error', function (err) {
            reject(err)
        })
        .on('close', function () {
            resolve(blocks);
        });
    });
  }



  // validate block
  validateBlock(blockHeight){
    return new Promise((resolve, reject) => {
      // get block object
      this.getBlockByHeight(blockHeight)
      .then((block) => {
        // get block hash
        let blockHash = block.hash;
        // console.log(blockHash);
        
        // remove block hash to test block integrity
        block.hash = '';
        // generate block hash
        let validBlockHash = SHA256(JSON.stringify(block)).toString();
        // Compare
        if (blockHash===validBlockHash) {
          // console.log('Valid Block!')
          resolve(true);
        } else {
          console.log('Block #'+blockHeight+' invalid hash:\n'+blockHash+'<>'+validBlockHash);
          resolve(false);
          }
      }).catch( (err) => console.log("There was an error validatinBlock", err));

    });
  }
   

  // Validate blockchain
  async validateChain(){
    let errorLog = [];
    let blocks = [];
    let ValidBlockArray = [];

    const lastBlockHeight = await this.getLastBlockHeight();
    for (let i = 0; i <= lastBlockHeight; i++) {
    ValidBlockArray.push(this.validateBlock(i));
    blocks.push(this.getBlockByHeight(i));
    }
    
    // verify each block is valid
    Promise.all(ValidBlockArray).then((res) => console.log('all blocks valid ', res))
    .catch((err) => console.log('invalid block in chain', err))

    // compare blocks hash link
    Promise.all(blocks).then((BlocksList) => {
      if (BlocksList.length > 1) {
        for (let b = 0; b < BlocksList.length -1; b++) {
          let blockHash = BlocksList[b].hash;
          let previousBlockHash = BlocksList[b+1].previousBlockHash;
          if (blockHash !== previousBlockHash) {
            errorLog.push('Error linking blockchain at block position #', b);
          }
        }
      }
    })
    .catch((err) => console.log('invalid linkage in chain', err))
    if (errorLog.length > 0) {
    console.log('Block errors = ' + errorLog.length);
    console.log('Blocks: '+errorLog);
    } else {
    console.log('No errors detected');
    }
  }

}

module.exports = Blockchain;