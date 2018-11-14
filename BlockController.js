//Importing the Block and Blockchain Classes
const Block = require('./Block.js');
const Blockchain = require('./Blockchain.js');

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
    }

    /**
     * Implement a GET Endpoint to retrieve a block by index, url: "/api/block/:index"
     */
    getBlockByHeight() {
        this.app.get("/block/:index", async (req, res) => {
            let reqBlock = null;
            try {
                reqBlock = await this.Blockchain.getBlock(req.params.index);
                res.send(reqBlock);
            } catch (err) {
                if (err.message.includes("Key not found")) {
                    res.send(`No block found with height of ${req.params.index}`);
                } else {
                    res.send(`Error in GetBlock method of Block Controller. \n ${err}`);
                }
            }
        });
    }

    /**
     * Implement a POST Endpoint to add a new Block, url: "/api/block"
     */
    postNewBlock() {
        this.app.post("/block", async (req, res) => {
            try {
                if (!req.body.body) throw Error("Empty string or invalid value for Block's body");
                let savedBlock = await this.Blockchain.addBlock(new Block(req.body.body));
                res.send(savedBlock);
            } catch (err) {
                if (err.message.includes("Block's body")) {
                    console.log(err)
                    res.send(err.message);
                } else {
                    console.log(err)
                    res.send(`Error in postNewBlock method of Block Controller. \n ${err}`);
                }
            }
        });
    }

}

/**
 * Exporting the BlockController class
 * @param {*} app
 */
module.exports = (app) => { return new BlockController(app);}