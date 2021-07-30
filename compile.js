const path = require('path');
const fs = require('fs');
const solc = require('solc');

const lotteryPath = path.resolve(__dirname, 'contracts', 'Lottery.sol');
const source = fs.readFileSync(lotteryPath, 'utf-8');

const input = {
  language: 'Solidity',
  sources: {
    'lottery.sol': {
      content: source,
    },
  },
  settings: {
    outputSelection: {
      '*': {
        '*': ['*'],
      },
    },
  },
};

console.log(JSON.parse(solc.compile(JSON.stringify(input))));

module.exports = JSON.parse(solc.compile(JSON.stringify(input))).contracts[
  'lottery.sol'
]['Lottery'];
