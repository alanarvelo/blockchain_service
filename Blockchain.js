/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');

const level = require('level');
const chainDB = './chaindata';
const db = level(chainDB);

const Block = require('./Block.js');


/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain{
  constructor(){
    this.chainLength;
    this.chain = [];
    this.getLastBlockHeight().then( (lastBlockHeight) => {
      if (lastBlockHeight == -1) this.addBlock(new Block("First block in the chain - Genesis block"));
    });
  }

  // Add new block
  async addBlock(newBlock){
    // UTC timestamp
    newBlock.time = new Date().getTime().toString().slice(0,-3);

    // Getting the height of the last block
    const lastBlockHeight = await this.getLastBlockHeight();
    
    if (lastBlockHeight >= 0) {
      newBlock.height =  lastBlockHeight + 1;
      // previous block
      const previousBlock = await this.getBlock(lastBlockHeight);
      // hash linking
      newBlock.previousBlockHash = previousBlock.hash;
      // Block hash with SHA256 using newBlock and converting to a string
      newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
      // Adding block object to chain
      this.saveBlock(newBlock.height, JSON.stringify(newBlock).toString())
      .then(() => {console.log("Saved block successfully")})
      .catch((err) => {console.log("Error saving Block: ", err)});

    } else if (lastBlockHeight == -1) {
      // create and save Genesis block
      newBlock.body = "First block in the chain - Genesis block";
      newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
      this.saveBlock(newBlock.height, JSON.stringify(newBlock).toString())
      .then(() => {console.log("Saved Genesis block successfully")})
      .catch(() => {console.log("Error saving Genesis Block")});
    }
  
  }


  // Add data to levelDB with key/value pair
  saveBlock(key,value){
    return new Promise((resolve, reject) => {
      // console.log('Block #' + key + ': ' + value );
      db.put(key, value, function(err, result) {
        if (err) reject(err);
        resolve(result);
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
        console.log('Error counting block to get the lastBlockHeight' + err);
      })
      .on('close', () => resolve(count) )
    })
  }


  // get block
  getBlock(blockHeight){
    return new Promise((resolve, reject) => {
      db.get(blockHeight, function(err, block) {
        if (err) return console.log('Error getting block', err);;
        resolve(JSON.parse(block));
      });
    });
  }


  // validate block
  validateBlock(blockHeight){
    return new Promise((resolve, reject) => {
      // get block object
      this.getBlock(blockHeight)
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
      }).catch( (err) => console.log("There was an error validatinBlock" + err));

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
    blocks.push(this.getBlock(i));
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