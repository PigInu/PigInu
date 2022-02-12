# Pig Inu - smart contracts and website

https://piginu.com

1. Edit .secret and put there a wallet mnemonic phrase (24 words) - you need to have some gas on it
2. Register on polygonscan.com, bscscan.com and create a new API keys
3. Edit .apikey_* files and add your api keys on the first line of each file (* means block explorer name, e.g.: polygonscan, bscscan ...)
4. edit ./migrations/2_deploy_contracts.js and set variables
5. edit ./web/build.sh and set a different web root where you'd like to deploy your web page
6. Install dependencies and run deploy script:
```console
yarn install
./deploy.sh
```

# Used dependencies
- Hardhat
- Solidity
- Node v16.x (do not use 17.x!)
- NPM
- Yarn

# Web page
You can also build web page manualy without deploying new smart contracts using:
```console
cd ./web
./build.sh
```
