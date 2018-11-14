# Blockchain Data

Blockchain has the potential to change the way that the world approaches data. Develop Blockchain skills by understanding the data model behind Blockchain by developing your own simplified private blockchain.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Installing Node and NPM is pretty straightforward using the installer package available from the (Node.js® web site)[https://nodejs.org/en/].

### Configuring your project

- Use NPM to initialize your project and create package.json to store project dependencies.
```
npm init
```
- Install crypto-js with --save flag to save dependency to our package.json file
```
npm install crypto-js --save
```
- Install level with --save flag
```
npm install level --save
```
- Install express with --save flag
```
npm install express --save
```

## Testing

To test code:
1: Open a command prompt or shell terminal after install node.js.
2: Start the server by running the following command on your terminal.
```
node app.js
```
3: Make a GET request to http://localhost:8000/block/:height for the block with the corresponding height to appear in your browser.
4: Make a POST request to http://localhost:8000/block/ with a JSON object with a single key called "body", to create a new block with such body. The response will be the new, completed block as saved to the blockchain. 