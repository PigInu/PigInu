
export class Config {
    public static main = {
        project: 'Pig Inu - The cutest Token in The world',
        description: 'Claim your PIG tokens!',
        updateInterval: 10, 
        poolUpdateInterval: 10,
        analyticsId: "G-RJX9XP52DW",
        toplistId: '1811895',
        networkName: "Polygon (MATIC) - Mainnet",
        network: 'https://polygon-rpc.com', // Polygon (MATIC) - Mainnet
        explorer: 'https://polygonscan.com/', // Polygon (MATIC) - Mainnet
        chainID: 137,
        //networkName: "Polygon (MATIC) - Testnet",
        //network: 'https://matic-mumbai.chainstacklabs.com', // Polygon (MATIC) - Testnet
        //explorer: 'https://mumbai.polygonscan.com/', // Polygon (MATIC) - Testnet
        //chainID: 80001,
        nativeCurrency: {
            name: "MATIC",
            symbol: "MATIC",
            decimals: 18
        },
        headerLinks: {
            buyToken: "https://quickswap.exchange/#/swap?inputCurrency=0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063&outputCurrency=PIG",
            buyLiguidity: "https://quickswap.exchange/#/add/0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063/PIG"
        },
        footerLinks:{
            github: 'https://github.com/PigInu/PigInu/',
            twitter: 'https://twitter.com/piginu_com'
        },
        mainMenu: [
            {link: "", text: "About"},
            { text: "Trade", items :[
                {href: "https://quickswap.exchange/#/swap?inputCurrency=0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063&outputCurrency=PIG", text: "Buy PIG for DAI", link: false},
                {href: "https://quickswap.exchange/#/swap?outputCurrency=0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063", text: "Buy DAI for MATIC"},
                {href: "https://quickswap.exchange/#/add/0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063/PIG", text: "Buy PIG-DAI liquidity"}
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
                address: '0xb52a0843530EA8F2ecb5fc30086bFE343a0B94FB',
            }, 
            {
                name: 'PIG-DAI LP',
                symbol: 'PIG-DAI LP',
                icon: '/assets/icons/PIG-DAI.png',
                flag: 'lptoken',
                address: '0x7076ECD482059cAe0297D70650E910a646d1c2b0',
                lpAdresses: ['0xb52a0843530EA8F2ecb5fc30086bFE343a0B94FB', '0x97F3AF0246B59E9e035A9E996eF9779983ed536B'],
            }, 
            {
                name: 'DAI',
                symbol: 'DAI',
                icon: '/assets/icons/DAI.png',
                flag: 'usdtoken',
                address: '0x97F3AF0246B59E9e035A9E996eF9779983ed536B',
            },             
        ],
        getHexChainId() : string{
            return "0x" + Config.main.chainID.toString(16);
        },       
        addressToken: '0xb52a0843530EA8F2ecb5fc30086bFE343a0B94FB',
        addressAirdrop: '0x5B0D04E2DFE0A742ceBC20934A3a183b0e91382b',
        addressPresale: '0x0ECdB58caa6059231F54C11f12AdB8794f0d2d98',
        addressPool: '0x0443EC19D4E439D78d83d7EFE019051cbF826B94',
        addressUSDToken: '0x97F3AF0246B59E9e035A9E996eF9779983ed536B',
        addressLPToken: '0x7076ECD482059cAe0297D70650E910a646d1c2b0',
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
