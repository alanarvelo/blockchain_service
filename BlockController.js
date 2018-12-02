//Importing the Block and Blockchain Classes
const Block = require('./Block.js');
const Blockchain = require('./Blockchain.js');
const bitcoinMessage = require('bitcoinjs-message');

/**
 * Controller Definition to encapsulate routes to work with blocks
 */
class BlockController {

    /**
     * Constructor to create a new BlockController, you need to initialize here all your endpoints
     * @param {*} app 
     */
    constructor(app) {
        this.app = app;
        this.Blockchain = new Blockchain();
        this.getBlockByHeight();
        this.postNewBlock();
        this.postRequestValidation();
        this.postValidateSignature();
        this.getBlockByHash();
        this.getBlockByWalletAddress();
        // this.removeValidationRequest();
        this.TimeoutRequestsWindowTime = 5*60*1000;
        this.mempool = [];
        this.timeoutRequests = {};   
        this.mempoolValid = [];
    }

    /**
     * Implement a GET Endpoint to retrieve a block by height, url: "/block/:index"
     */
    getBlockByHeight() {
        this.app.get("/block/:height", async (req, res) => {
            let reqBlock = null;
            try {
                reqBlock = await this.Blockchain.getBlockByHeight(req.params.height);
                res.send(reqBlock);
            } catch (err) {
                if (err.message.includes("Key not found")) {
                    res.send(`No block found with height of ${req.params.height}`);
                } else {
                    res.send(`Error in getBlockByHeight method of Block Controller. \n ${err}`);
                }
            }
        });
    }

    
    /**
     * Implement a GET Endpoint to retrieve a block by hash, url: "/stars/hash:[hash]"
     */
    getBlockByHash() {
        this.app.get("/stars/hash::hash", async (req, res) => {
            let reqBlock = null;
            try {
                reqBlock = await this.Blockchain.getBlockByHash(req.params.hash);
                console.log(reqBlock);
                if (!reqBlock) throw Error("Hash not found")
                res.send(reqBlock);
            } catch (err) {
                if (err.message.includes("Hash not found")) {
                    res.send(`No block found with hash: ${req.params.hash}`);
                } else {
                    res.send(`Error in getBlockByHash method of Block Controller. \n ${err}`);
                }
            }
        });
    }


    /**
     * Implement a GET Endpoint to retrieve a block by walletAddress, url: "/stars/address:[address]"
     */
    getBlockByWalletAddress(){
        this.app.get("/stars/address::address", async (req, res) => {
            let reqBlocks = null;
            try {
                reqBlocks = await this.Blockchain.getBlockByWalletAddress(req.params.address);
                console.log(reqBlocks);
                if (reqBlocks.length == 0) throw Error("No blocks found associated to this wallet")
                res.send(reqBlocks);
            } catch (err) {
                if (err.message.includes("to this wallet")) {
                    res.send(`No block found with hash: ${req.params.address}`);
                } else {
                    res.send(`Error in getBlockByWalletAddress method of Block Controller. \n ${err}`);
                }
            }
        });
    }


    /**
     * Implement a POST Endpoint to add a new Block, url: "/block"
     */
    postNewBlock() {
        this.app.post("/block", async (req, res) => {
            try {
                let starObj = req.body;
                // Wallet Address has requested validation
                if (!this.mempoolValid.includes(starObj.address)) throw Error("Wallet Address has not validated a request");
                // Star Object has required properties
                else if (!Object.keys(starObj).includes('address', 'star') || 
                         !Object.keys(starObj.star).includes('dec', 'ra', 'story')) {
                            throw Error("Invalid star object format for Block's body");
                }
                // Star story is not too long
                else if (starObj.star.story.split(" ").length > 250 ||
                         Buffer.byteLength(starObj.star.story, 'ascii') > 500) {
                            throw Error("Invalid star story, > 250 words or > 500 bites");
                }
                // Star story has only ascii characters
                else if ([...starObj.star.story].some(char => char.charCodeAt(0) > 127)) throw Error("String story has non-Ascii characters")
                let body = {
                    address: starObj.address,
                    star: starObj.star
                };

                let savedBlockHeight = await this.Blockchain.addBlock(new Block(body));
                let savedBlock = await this.Blockchain.getBlockByHeight(savedBlockHeight);
                res.send(savedBlock);
            } catch (err) {
                if (err.message.includes("validated a request") ||
                    err.message.includes("Invalid ") ||
                    err.message.includes("non-Ascii")) {
                        console.log(err)
                        res.send(err.message);
                } else {
                    console.log(err)
                    res.send(`Error in postNewBlock method of Block Controller. \n ${err}`);
                }
            }
        });
    }


    /**
     * Project 4 - request validation
     * Implement a POST Endpoint to initiate request validation, url: "/validateRequest"
     */
    postRequestValidation() {
        this.app.post("/requestValidation", (req, res) => {
            const address = req.body.address;
            const reqTimestamp = new Date().getTime().toString().slice(0,-3);
            let reqValObj = {};

            // check if this wallet address has a previous, valid, validation request
            if (Object.keys(this.timeoutRequests).includes(address)) {
                // getting original request validation object
                reqValObj = this.timeoutRequests[address];
                // calculate remaining time in validation window and update dict property
                let timeElapsed = reqTimestamp - reqValObj["requestTimeStamp"];
                let timeLeft = (this.TimeoutRequestsWindowTime/1000) - timeElapsed;
                reqValObj["validationWindow"] = timeLeft;

            // if there isn't a valid, validation requests by this walletAddress, create one
            } else {
                reqValObj["address"] = address,
                reqValObj["requestTimeStamp"] = reqTimestamp;
                reqValObj["message"] = `${address}:${reqTimestamp} :starRegistry`; // sub 0 for ${reqTimestamp} for testing 
                reqValObj["validationWindow"] = this.TimeoutRequestsWindowTime/1000;   
                           
            }

            // saving the original validation request object
            // timeoutRequests is a dictionary with walletAddress as keys and requestValidationObjects (also dicts) as values
            this.timeoutRequests[address] = reqValObj;
            
            setTimeout( () => {
                delete this.timeoutRequests[address];
                // console.log(this.timeoutRequests);
            }, this.TimeoutRequestsWindowTime, address);

            res.send(reqValObj);
        });
    }


     /**
     * Project 4 - Validate Signature
     * Implement a POST Endpoint to validate message signature, url: "/message-signature/validate"
     */
    postValidateSignature() {
        this.app.post("/message-signature/validate", (req, res) => {
            const reqTimestamp = new Date().getTime().toString().slice(0,-3);
            const address = req.body.address;
            const signature = req.body.signature;

            if (Object.keys(this.timeoutRequests).includes(address)) {
                // verify signature
                let reqValObj = this.timeoutRequests[address];
                let isValid = bitcoinMessage.verify(reqValObj.message, address, signature);
                if (isValid) {
                    // calculate remaining time in validation window and update dict property
                    let timeElapsed = reqTimestamp - reqValObj["requestTimeStamp"];
                    let timeLeft = (this.TimeoutRequestsWindowTime/1000) - timeElapsed;
                    reqValObj["validationWindow"] = timeLeft

                    // create a valid request object
                    let valObj = { "registerStar": isValid, "status": reqValObj };
                    valObj["status"]["messageSignature"] = isValid;
                    this.mempoolValid.push(valObj.status.address)
                    delete this.timeoutRequests[address];
                    res.send(valObj);
                }
                else {
                    res.send("Signature Validation Invalid")
                }
            } else {
                res.send("You must first submit a Validation Request, go to: /validateRequest")
            }
        })
    }


} // Block Controller Class closing bracket


/**
 * Exporting the BlockController class
 * @param {*} app
 */
module.exports = (app) => { return new BlockController(app);}