
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
                icon: '/assets/icons/PIG.png',
                flag: 'token',
                address: '0xc4915f44280B5E3bc7115e229A272172Ad4A57b8',
            }, 
            {
                name: 'PIG-DAI LP',
                symbol: 'PIG-DAI LP',
                icon: '/assets/icons/PIG-DAI.png',
                flag: 'lptoken',
                address: '0x218BdcfF3ba546F3802d17777883DaB5286e9017',
                lpAdresses: ['', 'ypings'],
            }, 
            {
                name: 'DAI',
                symbol: 'DAI',
                icon: '/assets/icons/DAI.png',
                flag: 'usdtoken',
                address: '0xF42a4429F107bD120C5E42E069FDad0AC625F615',
            },             
        ],
        explorer: 'https://mumbai.polygonscan.com/', // Polygon (MATIC) - Testnet
        chainID: 80001,
        getHexChainId() : string{
            return "0x" + Config.main.chainID.toString(16);
        },       
        addressToken: '0xc4915f44280B5E3bc7115e229A272172Ad4A57b8',
        addressAirdrop: '0x2BC911a1a09897DbA816E22fd2A4eE4ECE694615',
        addressPresale: '0xA23Fe879925EC21e6823657603dd3A738138e84D',
        addressPool: '0x1a4D1365A64f40eDA835807E117F7a943F81fd02',
        addressUSDToken: '0xF42a4429F107bD120C5E42E069FDad0AC625F615',
        addressLPToken: '0x218BdcfF3ba546F3802d17777883DaB5286e9017',
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