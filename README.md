# Pig Inu - smart contracts and website

<p align="center">
 <img src="piginu.png" alt="Pig Inu" width="100px" height="100px">
</p>

- Website: https://piginu.com
- E-mail: info@piginu.com
- Telegram: https://t.me/piginu_com
- Telegram Chat Group: https://t.me/piginu_group
- Telegram Announcements: https://t.me/piginu_ann
- Twitter: https://twitter.com/piginu_com
- Discord: https://discord.gg/Z3Sp4Yxhex

# Smart contracts
If you'd like to deploy our smart contracts for test reasons:

1. Edit .secret and put there a wallet mnemonic phrase (24 words) - you need to have some gas on it
2. Register on polygonscan.com, bscscan.com or other etherscan-like website and create a new API keys
3. Edit .apikey_* files and add your api keys on the first line of each file (* means block explorer name, e.g.: polygonscan, bscscan ...)
4. Edit ./scripts/deploy.js and set variables
5. If you'd like to deploy website too, edit ./deploy.sh and set WEB variable with deploy path
6. Install dependencies and run deploy script:
```console
yarn install
./deploy.sh
```

# Unit tests
You can run unit tests using:
```console
npx hardhat clean && npx hardhat compile && npx hardhat test
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

If you'd like to run development version of Pig Inu website, you can run (default port: 4001):

```console
cd ./web
./runweb.sh
```

Then open browser: http://localhost:4001

This requires screen package.

You can watch log file using:

```console
screen -x PigInu
```

You can proxy pass test version to port 80 using Nginx:

```console
server {
    listen 80;
    listen [::]:80;
    root /data/www/test.piginu.com;
    index index.html index.htm;
    server_name test.piginu.com;
    access_log /data/log/nginx/test.piginu.com.access.log;
    error_log /data/log/nginx/test.piginu.com.error.log;

    location / {
        proxy_pass http://127.0.0.1:4001;
        #try_files $uri /index.html;
    }

    location ~ /\.ht {
        deny all;
    }
}
```