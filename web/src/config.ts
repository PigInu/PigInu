
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
        addressToken: '0x6411f12168f6ed7375dDD38Dd68A9130a9De7f91',
        addressAirdrop: '0x86541beBa4888f306fb47bc7064314d638Cb4B14',
        addressPresale: '0x409f4779c09a76d23c63d2F6aBd819EACA8D801C',
        addressPool: '0x903A155A7B3601B63dC42b476c6f8AE463eA4204',
        addressUSDToken: '0xf42a4429f107bd120c5e42e069fdad0ac625f615',
        addressLPToken: '0xc5dc2247c891bFC3Ba2F9378c428C30199e5a194',
        airdropContractInterface: [] = [
            "function claimCount () view returns (uint)",
            //"event Transfer(address indexed from, address indexed to, uint amount)",
            "function addressReceived(address) view returns (bool)",
            "function claim()",
            "function amountToClaim () view returns (uint)",
            "function getRemainingTokens () view returns (uint)",
            "function totalClaimed () view returns (uint)",
            "function token () view returns (uint)",
            "function timeOut () view returns (uint)",
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
            "function startTime () view returns (uint)",
            "function claimTimeOut () view returns (uint)",
            "function depositTimeOut () view returns (uint)",
            "function claimed(address) view returns (uint)",
            "function claimable(address) view returns (uint)",
            "function deposited(address) view returns (uint)",
            "function deposit(uint)",
            "function claim()",
            "function devFeePercent() view returns (uint)",
            "function devAddress() view returns (uint)",
        ],
        tokenContractInterface: [] = [
            "function name () view returns (string)",
            "function symbol () view returns (string)",
            "function decimals () view returns (uint)",
            "function allowance (address, address) view returns (uint)",
            "function approve (address, uint)",
            "function totalSupply () view returns (uint)",
            "function balanceOf (address) view returns (uint)",            
        ],
    } 
}