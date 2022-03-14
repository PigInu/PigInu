
export class Config {
    public static main = {
        project: 'Test Token Airdrop',
        description: 'Claim your Test tokens!',
        updateInterval: 30,
       
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
        explorer: 'https://mumbai.polygonscan.com/', // Polygon (MATIC) - Testnet
        chainID: 80001,
        getHexChainId() : string{
            return "0x" +Config.main.chainID.toString(16);
        },       
        addressToken: '0x7284517b7c0346bD39c2a2ddDD0d8CE86304728D',
        addressAirdrop: '0x2ef8da53b94A4630621F5A633ced975466F6Bb15',
        addressPresale: '0x84A4b4aC0d9975d79f16556cb46D3251a1c64616',
        addressPool: '0xC6637E0141A6fF2504924baE105990D2e30D3895',
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