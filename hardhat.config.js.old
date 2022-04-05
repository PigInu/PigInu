require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");

const fs = require('fs');
const mnemonic = fs.readFileSync('.secret').toString().trim();
const api_key_bscscan = fs.readFileSync('.apikey_bscscan').toString().trim();
const api_key_polygonscan = fs.readFileSync('.apikey_polygonscan').toString().trim();
const api_key_avax = fs.readFileSync('.apikey_avax').toString().trim();
const api_key_optimism = fs.readFileSync('.apikey_optimism').toString().trim();
const api_key_fantom = fs.readFileSync('.apikey_ftmscan').toString().trim();
const api_key_hecoinfo = fs.readFileSync('.apikey_hecoinfo').toString().trim();

module.exports = {
 solidity: {
  version: '0.8.11',
  settings: {
   optimizer: {
    enabled: true,
    runs: 200
   }
  }
 },
 networks: {
  polygonTestnet: {
   //url: 'https://rpc-mumbai.matic.today',
   url: 'https://matic-mumbai.chainstacklabs.com',
   //url: 'https://rpc-mumbai.maticvigil.com',
   //url: 'https://matic-testnet-archive-rpc.bwarelabs.com',
   chainId: 80001,
   accounts: {mnemonic: mnemonic}
  },
  polygonMainnet: {
   url: 'https://polygon-rpc.com',
   //url: 'https://rpc-mainnet.matic.network',
   //url: 'https://matic-mainnet.chainstacklabs.com',
   //url: 'https://rpc-mainnet.maticvigil.com',
   //url: 'https://rpc-mainnet.matic.quiknode.pro',
   //url: 'https://matic-mainnet-full-rpc.bwarelabs.com',
   chainId: 137,
   accounts: {mnemonic: mnemonic}
  },
  bscTestnet: {
   url: 'https://data-seed-prebsc-1-s1.binance.org:8545',
   chainId: 97,
   accounts: {mnemonic: mnemonic}
  },
  bscMainnet: {
   url: 'https://bsc-dataseed2.binance.org',
   chainId: 56,
   accounts: {mnemonic: mnemonic}
  },
  avaxTestnet: {
   url: 'https://api.avax-test.network/ext/bc/C/rpc',
   chainId: 43113,
   accounts: {mnemonic: mnemonic}
  },
  avaxMainnet: {
   url: 'https://api.avax.network/ext/bc/C/rpc',
   chainId: 43114,
   accounts: {mnemonic: mnemonic}
  },
  optimismTestnet: {
   url: 'https://kovan.optimism.io/',
   chainId: 69,
   accounts: {mnemonic: mnemonic}
  },
  optimismMainnet: {
   url: 'https://mainnet.optimism.io',
   chainId: 10,
   accounts: {mnemonic: mnemonic}
  },
  fantomTestnet: {
   url: 'https://rpc.testnet.fantom.network/',
   chainId: 4002,
   accounts: {mnemonic: mnemonic}
  },
  fantomMainnet: {
   url: 'https://rpc.ftm.tools/',
   chainId: 250,
   accounts: {mnemonic: mnemonic}
  },
  hecoTestnet: {
   url: 'https://http-testnet.hecochain.com/',
   chainId: 256,
   accounts: {mnemonic: mnemonic}
  },
  hecoMainnet: {
   url: 'https://http-mainnet.hecochain.com/',
   chainId: 128,
   accounts: {mnemonic: mnemonic}
  },
  localhost: {
   url: '127.0.0.1:8545',
  },
 },
 etherscan: {
  apiKey: {
   bsc: api_key_bscscan,
   bscTestnet: api_key_bscscan,
   polygon: api_key_polygonscan,
   polygonMumbai: api_key_polygonscan,
   avalanche: api_key_avax,
   avalancheFujiTestnet: api_key_avax,
   optimisticEthereum: api_key_optimism,
   optimisticKovan: api_key_optimism,
   opera: api_key_fantom,
   ftmTestnet: api_key_fantom,
   heco: api_key_hecoinfo,
   hecoTestnet: api_key_hecoinfo,
  }
 }
};

task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
 const accounts = await hre.ethers.getSigners();
 for (const account of accounts) {
  console.log(account.address);
 }
});
