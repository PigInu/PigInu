
export class Config {
    public static main = {
        project: 'Pig Inu - The cutest Token in The world',
        description: 'Claim your PIG tokens!',
        updateInterval: 10, 
        poolUpdateInterval: 10,
       
        // network: 'https://rpc-mainnet.matic.quiknode.pro', // Polygon (MATIC) - Mainnet
        // explorer: 'https://polygonscan.com/', // Polygon (MATIC) - Mainnet
        // chainID: '137',
        networkName: "Polygon (MATIC) - Testnet",
        network: 'https://matic-mumbai.chainstacklabs.com', // Polygon (MATIC) - Testnet,
        nativeCurrency: {
            name: "MATIC",
            symbol: "MATIC",
            decimals: 18
        },
        headerLinks: {
            buyToken: "https://quickswap.exchange/#/swap?inputCurrency=0xF42a4429F107bD120C5E42E069FDad0AC625F615&outputCurrency=0x9b6452d8EE8B79605F3F73d04F5f43D7A9Df59A3",
            buyLiguidity: "https://quickswap.exchange/#/swap?outputCurrency=0xF42a4429F107bD120C5E42E069FDad0AC625F615"
        },
        footerLinks:{
            github: 'https://github.com/PigInu/PigInu/',
            twitter: 'https://twitter.com/piginu_com'
        },
        mainMenu: [
            {link: "", text: "About"},
            { text: "Trade", items :[
                {href: "https://quickswap.exchange/#/swap?inputCurrency=0xF42a4429F107bD120C5E42E069FDad0AC625F615&outputCurrency=0x9b6452d8EE8B79605F3F73d04F5f43D7A9Df59A3", text: "Buy PIG for DAI", link: false},
                {href: "https://quickswap.exchange/#/swap?outputCurrency=0xF42a4429F107bD120C5E42E069FDad0AC625F615", text: "Buy DAI for MATIC"},
                {href: "https://quickswap.exchange/#/add/0xF42a4429F107bD120C5E42E069FDad0AC625F615/0x9b6452d8EE8B79605F3F73d04F5f43D7A9Df59A3", text: "Buy PIG-DAI liquidity"}
            ]},
            {link: "presale", text: "Presale"},
            {link: "airdrop", text: "Airdrop"},
            {link: "pool", text: "Staking pools"},
            { text: "Community", items :[
                {href: "https://t.me/piginu_ann", text: "Telegram Announcements", link: false},
                {href: "https://t.me/piginu_group", text: "Telegram Chat Group", link: false},
                {href: "https://t.me/piginu_com", text: "Telegram Support", link: false},
                {href: "https://twitter.com/piginu_com", text: "Twitter", link: false},
                {href: "https://discord.com/invite/Z3Sp4Yxhex", text: "Discord", link: false},
                {href: "mailto:info@piginu.com", text: "E-mail", link: false},
            ]},
            { text: "Other links", items :[
                {href: "https://github.com/PigInu/PigInu/", text: "GitHub sources", link: false},
            ]},
            {href: "/assets/whitepaper.pdf", text: "Whitepaper"},
        ],
        tokenAlias: [
            {
                name: 'PIG',
                symbol: 'PIG',
                icon: "/assets/icons/PIG.png",
                address: '0x9b6452d8EE8B79605F3F73d04F5f43D7A9Df59A3',
            }, 
            {
                name: 'PIG-DAI LP',
                symbol: 'PIG-DAI LP',
                icon: "/assets/icons/PIG-DAI.png",
                address: '0xc5dc2247c891bFC3Ba2F9378c428C30199e5a194',
                lpAdresses: ['0x9b6452d8EE8B79605F3F73d04F5f43D7A9Df59A3', '0xF42a4429F107bD120C5E42E069FDad0AC625F615']
            }, 
            {
                name: 'DAI',
                symbol: 'DAI',
                icon: "/assets/icons/DAI.png",
                address: '0xF42a4429F107bD120C5E42E069FDad0AC625F615',
            },             
        ],
        explorer: 'https://mumbai.polygonscan.com/', // Polygon (MATIC) - Testnet
        chainID: 80001,
        getHexChainId() : string{
            return "0x" +Config.main.chainID.toString(16);
        },       
        addressToken: '0xD82053731eb6Df34C55e1C8Cd7b48e5C1814da43',
        addressAirdrop: '0x8D35acD9Ab5289927f83D08E835D2cA3b8024049',
        addressPresale: '0x0bebFc05f9544C4F00330a9E4557FDEbF6186478',
        addressPool: '0xeA6A49F53AFD71EF9a405B497363202cf5a3fbf3',
        addressUSDToken: '0xf42a4429f107bd120c5e42e069fdad0ac625f615',
        addressLPToken: '0x0000000000000000000000000000000000000000',
        airdropContractInterface: [] = [
            "function claimCount () view returns (uint)",
            //"event Transfer(address indexed from, address indexed to, uint amount)",
            "function addressReceived(address) view returns (bool)",
            "function claim()",
            "function amountToClaim () view returns (uint)",
            "function getRemainingTokens () view returns (uint)",
            "function totalClaimed () view returns (uint)",
            "function token () view returns (uint)",
            "function timeOutBlock () view returns (uint)",
            "function startBlock () view returns (uint)",
            "function start (uint256, uint256)",
            "function owner() view returns (uint256)",
            "function minBaseCoinBalance() view returns (uint256)",
        ],
        presaleContractInterface: [] = [
            "function totalClaimableNotDeducted () view returns (uint)",
            "function getLiquidityTokenOur () view returns (uint)",
            "function getLiquidityTokenTheir () view returns (uint)",
            "function getBalanceTokenOur () view returns (uint)",
            "function getBalanceTokenTheir () view returns (uint)",
            "function tokenOur () view returns (uint)",
            "function tokenTheir () view returns (uint)",
            "function claimedCount () view returns (uint)",
            "function depositedCount () view returns (uint)",
            "function tokenPricePresale () view returns (uint)",
            "function tokenPriceLiquidity () view returns (uint)",
            "function getPresaleTokenTheirMax () view returns (uint)",
            "function totalDeposited () view returns (uint)",
            "function totalClaimed () view returns (uint)",
            "function totalClaimable () view returns (uint)",
            "function startBlock () view returns (uint)",
            "function claimTimeOutBlock () view returns (uint)",
            "function depositTimeOutBlock () view returns (uint)",
            "function claimed(address) view returns (uint)",
            "function claimable(address) view returns (uint)",
            "function deposited(address) view returns (uint)",
            "function deposit(uint)",
            "function claim()",
            "function devsFeePercent() view returns (uint)",
            "function devAddress() view returns (uint)",
            "function start (uint256, uint256, uint256)",
            "function owner() view returns (uint256)",
            "function devWallets(uint256) view returns (uint256, uint256)",
        ],
        tokenContractInterface: [] = [
            "function name () view returns (string)",
            "function symbol () view returns (string)",
            "function decimals () view returns (uint)",
            "function allowance (address, address) view returns (uint)",
            "function approve (address, uint)",
            "function totalSupply () view returns (uint)",
            "function balanceOf (address) view returns (uint)",  
            "function owner() view returns (uint256)",          
        ],
    } 
}