const fetch = require('node-fetch');

var netInfo;
var contracts = [];
var totalCost = ethers.BigNumber.from('0');
var verifyScript = '';
const confirmNum = 1;

async function main() {
 // TOKEN SETTINGS:
 const tokenOurName = 'Test token';
 const tokenOurSymbol = 'TEST';
 const tokenOurSupply = 10000000; // 10 000 000 tokens
 const tokenOurDecimals = 18;
 const tokenOurBurnFee = 2;
 const tokenOurDevFee = 3;
 
 // AIRDROP SETTINGS:
 const airdropAmount = '1000000000000000000'; // 1 token
 const airdropMinBaseCoinBalance = '1000000000000000000' // 0.1 BNB / MATIC / etc...
 const airdropTime = 900; // 15 minutes
 
 // PRESALE SETTINGS:
 const presalePricePresale = '1000000000000000000'; // 1 USD
 const presalePriceLiquidity = '2000000000000000000'; // 2 USD
 const presaleDepositTime = '300'; // 5 minutes
 const presaleClaimTime = '300'; // 5 minutes
 
 // POOL SETTINGS:
 const poolTokensPerBlock = '100000000000000000'; // 0.1 tokens / block
 const poolTokenOurAllocPoint = 1;
 const poolTokenUSDAllocPoint = 2;
 const poolTokenOurUSDLPAllocPoint = 5;
 const poolStartBlock = 1; // maybe start block offest here and used as block.number + poolStartBlock

 // POOL SETTINGS - TEST:
 const poolTokens = '10000000000000000000'; // 10 tokens

 // POOL SETTINGS - RELELASE:
 // const poolTokens = '2000000000000000000000000'; // 2 000 000 tokens

 // OTHER SETTINGS:
 const maxint = '115792089237316195423570985008687907853269984665640564039457584007913129639935';
 const burnAddress = '0x000000000000000000000000000000000000dEaD';
 const devAddress = '0x650E5c6071f31065d7d5Bf6CaD5173819cA72c41';
 const routerAddress = '0x8954AfA98594b838bda56FE4C12a09D7739D179b'; // quickswap.exchange (Polygon Testnet)
 // const routerAddress = '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff'; // quickswap.exchange (Polygon Mainnet)
 // const routerAddress = '0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3'; // pancake.kiemtienonline360.com (BSC Testnet)
 // const routerAddress = '0x10ED43C718714eb63d5aA57B78B54704E256024E'; // pancakeswap.finance (BSC Mainnet)
 
 getWelcomeMessage('Pig Inu');
 netInfo = await getNetworkInfo();
 getNetworkMessage();
 console.log();
 console.log('Deploying smart contracts ...');
 console.log();

 // CONTRACT ATTACH - TEST:
 var TokenTheir = await ethers.getContractFactory('Token');
 var tokenTheir = await TokenTheir.attach('0xF42a4429F107bD120C5E42E069FDad0AC625F615');
 var TokenOur = await ethers.getContractFactory('Token');
 var tokenOur = await TokenOur.attach('0x9b6452d8EE8B79605F3F73d04F5f43D7A9Df59A3');
 var LiquidityManager = await ethers.getContractFactory('LiquidityManager');
 var liquidityManager = await LiquidityManager.attach('0x2AC2b397562441c5dc0c7Df1926bcEBb0f40489a');
 // var Presale = await ethers.getContractFactory('Presale');
 // var presale = await Presale.attach('');
 // var Airdrop = await ethers.getContractFactory('Airdrop');
 // var airdrop = await Airdrop.attach('');
 // var Pool = await ethers.getContractFactory('Pool');
 // var pool = await Pool.attach('');

 // CONTRACT DEPLOY - RELEASE:
 //var tokenOur = await deploy('Token', tokenOurName, tokenOurSymbol, tokenOurSupply, tokenOurDecimals, tokenOurDevFee, tokenOurBurnFee, burnAddress);
 //var liquidityManager = await deploy('LiquidityManager');
 //var presale = await deploy('Presale', tokenOur.address, tokenTheir.address, routerAddress, devAddress, burnAddress, presalePricePresale, presalePriceLiquidity, presaleDepositTime, presaleClaimTime, liquidityManager.address);
 //var airdrop = await deploy('Airdrop', tokenOur.address, burnAddress, airdropAmount, airdropMinBaseCoinBalance);
 var pool = await deploy('Pool', tokenOur.address, burnAddress, devAddress, poolTokensPerBlock, poolStartBlock, poolTokens);

 createVerifyScript();
 getTotalCost();

/*
 // TOKEN FUNCTIONS:
 console.log('TokenOur - approve:');
 await runFunction(tokenOur, 'approve', presale.address, maxint);
 console.log('TokenOur - setTaxExclusion - Presale:');
 await runFunction(tokenOur, 'setTaxExclusion', presale.address, true);
 console.log('TokenOur - setTaxExclusion - Airdrop:');
 await runFunction(tokenOur, 'setTaxExclusion', airdrop.address, true);

 // LIQUIDITY MANAGER FUNCTIONS:
 console.log('LiquidityManager - createPair:');
 await runFunction(liquidityManager, 'createPair', routerAddress, tokenOur.address, tokenTheir.address);

 // PRESALE FUNCTIONS- RELEASE:
 //console.log('Presale - depositOwn:');
 //await runFunction(presale, 'depositOwn', '7500000000000000000000000'); // 7 500 000 tokens
 
 // PRESALE FUNCTIONS - TEST:
 console.log('Presale - depositOwn:');
 await runFunction(presale, 'depositOwn', '20000000000000000000'); // 20 tokens
 console.log('TokenTheir - approve:');
 await runFunction(tokenTheir, 'approve', presale.address, maxint);
 console.log('Presale - deposit:');
 await runFunction(presale, 'deposit', '10000000000000000000'); // 10 USD
 
 // AIRDROP FUNCTIONS - RELEASE:
 //console.log('TokenOur - transfer:');
 //await runFunction(tokenOur, 'transfer', airdrop.address, '500000000000000000000000'); // 500 000 tokens
 
 // AIRDROP FUNCTIONS - TEST:
 console.log('TokenOur - transfer:');
 await runFunction(tokenOur, 'transfer', airdrop.address, '2000000000000000000'); // 2 tokens
 console.log('Airdrop - start:');
 await runFunction(airdrop, 'start', airdropTime);
*/

 // POOL FUNCTIONS:
 console.log('LiquidityManager - getPairAddress:');
 var tokenOurUSDLPAddress = await runFunction(liquidityManager, 'getPairAddress', routerAddress, tokenOur.address, tokenTheir.address);
 console.log('Pair address: ' + tokenOurUSDLPAddress);
 console.log('Pool - createPool - tokenOur:');
 await runFunction(pool, 'createPool', poolTokenOurAllocPoint, tokenOur.address,  0); // Our -> Our
 console.log('Pool - createPool - tokenTheir:');
 await runFunction(pool, 'createPool', poolTokenUSDAllocPoint, tokenTheir.address,  400); // BUSD -> Our
 console.log('Pool - createPool - tokenOurLP:');
 await runFunction(pool, 'createPool', poolTokenOurUSDLPAllocPoint, tokenOurUSDLPAddress,  0); // Our-BUSD -> Our
 console.log('TokenOur - transfer:');
 await runFunction(tokenOur, 'transfer', pool.address, poolTokens);

 // SUMMARY:
 getTotalCost();
 await getSummary();
}

async function getNetworkInfo() {
 var arr = [];
 const account = (await ethers.getSigners())[0];
 arr['chainID'] = (await ethers.provider.getNetwork()).chainId;
 arr['name'] = 'Unknown';
 arr['rpc'] = 'Unknown';
 arr['currency'] = 'Unknown';
 arr['symbol'] = 'ETH';
 arr['explorer'] = 'https://etherscan.io';
 arr['walletAddress'] = account.address;
 arr['walletBalance'] = ethers.utils.formatEther(await account.getBalance());
 var response = await fetch('https://chainid.network/chains.json');
 var json = await response.json();
 json = JSON.stringify(json);
 var arrJSON = JSON.parse(json);
 for (var i = 0; i < arrJSON.length; i++) {
  if (arrJSON[i].chainId == arr['chainID']) {
   if (!!arrJSON[i].name) arr['name'] = arrJSON[i].name;
   if (!!arrJSON[i].nativeCurrency.name) arr['currency'] = arrJSON[i].nativeCurrency.name;
   if (!!arrJSON[i].nativeCurrency.symbol) arr['symbol'] = arrJSON[i].nativeCurrency.symbol;
   if (!!arrJSON[i].explorers[0].url) arr['explorer'] = arrJSON[i].explorers[0].url;
  }
 }
 return arr;
}

function getWelcomeMessage(name) {
 const eq = '='.repeat(arguments[0].length + 16);
 console.log();
 console.log(eq);
 console.log(name + ' - deploy script');
 console.log(eq);
 console.log();
 console.log('Start time: ' + new Date(Date.now()).toLocaleString());
 console.log();
}

function getNetworkMessage() {
 console.log('Network info:');
 console.log();
 console.log('Chain name:      ' + netInfo['name']);
 console.log('Chain ID:        ' + netInfo['chainID']);
 console.log('Currency:        ' + netInfo['currency'] + ' (' + netInfo['symbol'] + ')');
 console.log('Block explorer:  ' + netInfo['explorer']);
 console.log('Wallet address:  ' + netInfo['walletAddress']);
 console.log('Wallet balance:  ' + netInfo['walletBalance'] + ' ' + netInfo['symbol']);
 console.log();
}

async function deploy() {
 if (arguments.length == 0) {
  console.log('Error: Missing smart contract name');
  console.log();
  return;
 }
 var params = [];
 if (arguments.length > 1) for (var i = 1; i < arguments.length; i++) params.push(arguments[i]);
  const dash = '-'.repeat(arguments[0].length + 10);
 console.log(dash);
 console.log('Contract: ' + arguments[0]);
 console.log(dash);
 console.log();
 const Contract = await ethers.getContractFactory(arguments[0]);
 const contract = await Contract.deploy(...params);
 console.log('Contract TX ID:   ' + contract.deployTransaction.hash);
 console.log('Contract address: ' + contract.address);
 var balance = ethers.utils.formatEther(await (await ethers.getSigners())[0].getBalance()) + ' ' + netInfo['symbol'];
 console.log('Wallet balance:   ' + balance);
 var result = await contract.deployed();
 var receipt = await ethers.provider.getTransactionReceipt(contract.deployTransaction.hash);
 var blockTimestamp = (await ethers.provider.getBlock(receipt.blockNumber)).timestamp;
 console.log('Block number:     ' + receipt.blockNumber.toString());
 console.log('Block timestamp:  ' + blockTimestamp.toString());
 console.log('Gas limit:        ' + result.deployTransaction.gasLimit.toString());
 console.log('Gas used:         ' + receipt.gasUsed);
 console.log('Gas price:        ' + ethers.utils.formatUnits(result.deployTransaction.gasPrice.toString(), 'gwei') + ' gwei');
 console.log('Value sent:       ' + ethers.utils.formatEther(result.deployTransaction.value.toString()) + ' ' + netInfo['symbol']);
 var cost = contract.deployTransaction.gasPrice.mul(receipt.gasUsed);
 totalCost = totalCost.add(cost);
 console.log('Deploy cost:      ' + ethers.utils.formatEther(cost.toString()) + ' ' + netInfo['symbol']);
 console.log();
 var cont = [];
 cont['name'] = arguments[0];
 cont['address'] = contract.address;
 contracts.push(cont);
 console.log('Waiting for ' + confirmNum + ' confirmations...');
 console.log();
 var confirmations = 0;
 var lastConfirmation = -1;
 while (confirmations < confirmNum) {
  confirmations = (await contract.deployTransaction.wait(1)).confirmations;
  if (lastConfirmation != confirmations) console.log('Confirmation: ' + confirmations);
  lastConfirmation = confirmations;
 }
 console.log();
 verifyScript += 'npx hardhat verify --network $1 --contract contracts/' + arguments[0] + '.sol:' + arguments[0] + ' ' + contract.address;
 if (arguments.length > 1) for (var i = 1; i < arguments.length; i++) verifyScript += ' "' + arguments[i] + '"';
 verifyScript += "\n";
 return result;
}

function getTotalCost() {
 var total = 'Total cost: ' + ethers.utils.formatEther(totalCost.toString()) + ' ' + netInfo['symbol'];
 const eq = '='.repeat(total.length);
 console.log(eq);
 console.log(total);
 console.log(eq);
 console.log();
}

function createVerifyScript() {
 const fs = require('fs');
 var verifyFile = './verify.sh';
 if (fs.existsSync(verifyFile)) fs.unlinkSync(verifyFile);
 fs.writeFileSync(verifyFile, '#!/bin/sh' + "\n\n" + verifyScript);
 fs.chmodSync(verifyFile, 0o755);
}

async function getSummary() {
 console.log('===================');
 console.log('Deployed contracts:');
 console.log('===================');
 console.log();
 for (var i = 0; i < contracts.length; i++) console.log(contracts[i]['name'] + ': ' + netInfo['explorer'] + '/address/' + contracts[i]['address']);
 console.log();
 console.log('End time: ' + new Date(Date.now()).toLocaleString());
 console.log();
}

async function runFunction() {
 if (arguments.length < 2) {
  console.log('Error: Missing parameters');
  console.log();
  return;
 }
 var params = [];
 if (arguments.length > 2) for (var i = 2; i < arguments.length; i++) params.push(arguments[i]);
 var res = await arguments[0][arguments[1]](...params);
 if (typeof res === 'object') {
  console.log('Waiting for 1 confirmation...');
  await res.wait(1);
  console.log('Done.');
  var receipt = await ethers.provider.getTransactionReceipt(res.hash);
  var cost = res.gasPrice.mul(receipt.gasUsed);
  console.log('Transaction cost: ' + ethers.utils.formatEther(cost.toString()) + ' ' + netInfo['symbol']);
  totalCost = totalCost.add(cost);
  console.log();
 } else return res;
}

main()
 .then(() => process.exit(0))
 .catch((error) => {
  console.error(error);
  process.exit(1);
 });
