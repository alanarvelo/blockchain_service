const Blockchain = require('./Blockchain.js');
const Block = require('./Block.js');

let bc = new Blockchain();

// bc.validateBlock(1).then( (res) => console.log(res))
// console.log(bb)

(function theLoop (i) {
    setTimeout(function () {
        let blockTest = new Block("Test Block - " + (i + 1));
        bc.addBlock(blockTest)
        // bc.getBlock(i).then((res) => console.log(res));
        // console.log(result);
        i++;
        if (i < 6) theLoop(i);
        }, 2000);
})(3);

bc.validateChain();

// bc.getBlock(111).then( (block) => {
//     console.log(block);
// }).catch( (err)=> {
//     console.log('Error getting block ' + err); 
// });

// bc.getBlock(118).then( (block) => {
//     console.log(block);
// }).catch( (err)=> {
//     console.log('Error getting block ' + err); 
// });

// bc.getBlock(119).then( (block) => {
//     console.log(block);
// }).catch( (err)=> {
//     console.log('Error getting block ' + err); 
// });

// bc.getBlock(120).then( (block) => {
//     console.log(block);
// }).catch( (err)=> {
//     console.log('Error getting block ' + err); 
// });

// bc.saveBlock(key, block).then( (value) => {
//     console.log(value);
// }).catch( (err)=> {
//     console.log('Block ' + key + ' submission failed', err); 
// });