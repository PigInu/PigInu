import { HardhatUserConfig, task } from 'hardhat/config';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';

const fs = require('fs');
const mnemonic = fs.readFileSync('.secret').toString().trim();
const api_key_bscscan = fs.readFileSync('.apikey_bscscan').toString().trim();
const api_key_polygonscan = fs.readFileSync('.apikey_polygonscan').toString().trim();
const api_key_avax = fs.readFileSync('.apikey_avax').toString().trim();
const api_key_optimism = fs.readFileSync('.apikey_optimism').toString().trim();
const api_key_fantom = fs.readFileSync('.apikey_ftmscan').toString().trim();
const api_key_hecoinfo = fs.readFileSync('.apikey_hecoinfo').toString().trim();
const api_key_cronos = fs.readFileSync('.apikey_cronos').toString().trim();

task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();
  for (const account of accounts) console.log(account.address);
});

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.13',
    //settings: {
    //  optimizer: {
    //    enabled: true,
    //    runs: 200
    //  }
    //}
  },
  networks: {
    polygonTestnet: {
      //url: 'https://rpc-mumbai.matic.today',
      url: 'https://matic-mumbai.chainstacklabs.com',
      //url: 'https://rpc-mumbai.maticvigil.com',
      //url: 'https://matic-testnet-archive-rpc.bwarelabs.com',
      chainId: 80001,
      accounts: { mnemonic: mnemonic },
      gasPrice: 35000000000,
    },
    polygonMainnet: {
      url: 'https://polygon-rpc.com',
      //url: 'https://rpc-mainnet.matic.network',
      //url: 'https://matic-mainnet.chainstacklabs.com',
      //url: 'https://rpc-mainnet.maticvigil.com',
      //url: 'https://rpc-mainnet.matic.quiknode.pro',
      //url: 'https://matic-mainnet-full-rpc.bwarelabs.com',
      chainId: 137,
      accounts: { mnemonic: mnemonic },
    },
    bscTestnet: {
      url: 'https://data-seed-prebsc-1-s1.binance.org:8545',
      chainId: 97,
      accounts: { mnemonic: mnemonic },
    },
    bscMainnet: {
      url: 'https://bsc-dataseed2.binance.org',
      chainId: 56,
      accounts: { mnemonic: mnemonic },
    },
    avaxTestnet: {
      url: 'https://api.avax-test.network/ext/bc/C/rpc',
      chainId: 43113,
      accounts: { mnemonic: mnemonic },
    },
    avaxMainnet: {
      url: 'https://api.avax.network/ext/bc/C/rpc',
      chainId: 43114,
      accounts: { mnemonic: mnemonic },
    },
    optimismTestnet: {
      url: 'https://kovan.optimism.io/',
      chainId: 69,
      accounts: { mnemonic: mnemonic },
    },
    optimismMainnet: {
      url: 'https://mainnet.optimism.io',
      chainId: 10,
      accounts: { mnemonic: mnemonic },
    },
    fantomTestnet: {
      url: 'https://rpc.testnet.fantom.network/',
      chainId: 4002,
      accounts: { mnemonic: mnemonic },
    },
    fantomMainnet: {
      url: 'https://rpc.ftm.tools/',
      chainId: 250,
      accounts: { mnemonic: mnemonic },
    },
    hecoTestnet: {
      url: 'https://http-testnet.hecochain.com/',
      chainId: 256,
      accounts: { mnemonic: mnemonic },
    },
    hecoMainnet: {
      url: 'https://http-mainnet.hecochain.com/',
      chainId: 128,
      accounts: { mnemonic: mnemonic },
    },
    cronosTestnet: {
      url: 'https://cronos-testnet-3.crypto.org:8545',
      chainId: 338,
      accounts: { mnemonic: mnemonic },
    },
    cronosMainnet: {
      url: 'https://evm-cronos.org',
      chainId: 25,
      accounts: { mnemonic: mnemonic },
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
      //cronos: api_key_cronos,
      //cronosTestnet: api_key_cronos,
    },
  },
};

export default config;
