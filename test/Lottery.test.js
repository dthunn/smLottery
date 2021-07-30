const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const { abi, evm } = require('../compile');

let lottery;
let accounts;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();

  const contract = await new web3.eth.Contract(abi);
  const deploy = await contract.deploy({ data: '0x' + evm.bytecode.object });
  lottery = await deploy.send({ from: accounts[0], gas: '1000000' });
});

describe('Lottery Contract', () => {
  it('deploys a contract', () => {
    assert.ok(lottery.options.address);
  });

  it('allows one account to enter', async () => {
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei('0.02', 'ether'),
    });

    const players = await lottery.methods.getPlayers().call({
      from: accounts[0],
    });

    assert.strictEqual(accounts[0], players[0]);
    assert.strictEqual(1, players.length);
  });

  it('allows multiple accounts to enter', async () => {
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei('0.02', 'ether'),
    });

    await lottery.methods.enter().send({
      from: accounts[1],
      value: web3.utils.toWei('0.02', 'ether'),
    });

    await lottery.methods.enter().send({
      from: accounts[2],
      value: web3.utils.toWei('0.02', 'ether'),
    });

    const players = await lottery.methods.getPlayers().call({
      from: accounts[0],
    });

    assert.strictEqual(accounts[0], players[0]);
    assert.strictEqual(accounts[1], players[1]);
    assert.strictEqual(accounts[2], players[2]);
    assert.strictEqual(3, players.length);
  });

  it('requires a min amount (.01) of ether', async () => {
    let e;
    try {
      await lottery.methods.enter().send({
        from: accounts[0],
        value: web3.utils.toWei('0.001', 'ether'),
      });
    } catch (err) {
      e = err;
    }
    assert(e);
  });

  it('only manager can call pickWinner', async () => {
    let executed;
    try {
      // At least one person must enter the lottery else pickWinner will fail
      // even if invoked by the manager and this test will pass
      // because the error will be caught by the catch block.
      await lottery.methods.enter().send({
        from: accounts[1],
        value: web3.utils.toWei('0.02', 'ether'),
      });

      await lottery.methods.pickWinner().send({
        from: accounts[1],
      });

      executed = 'success';
    } catch (err) {
      executed = 'fail';
    }

    assert.strictEqual('fail', executed);
  });

  it('lottery (sends money to winner + resets players[])', async () => {
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei('2', 'ether'),
    });

    const initBalance = await web3.eth.getBalance(accounts[0]);
    await lottery.methods.pickWinner().send({ from: accounts[0] });
    const finalBalance = await web3.eth.getBalance(accounts[0]);
    const difference = finalBalance - initBalance;

    assert(difference > web3.utils.toWei('1.8', 'ether'));

    const players = await lottery.methods
      .getPlayers()
      .call({ from: accounts[0] });
    const contractBalance = await web3.eth.getBalance(lottery.options.address);

    assert.strictEqual(0, players.length);
    assert.strictEqual(0, Number(contractBalance));
  });
});
