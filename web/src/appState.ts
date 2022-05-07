import { BigNumber, Contract, ethers } from "ethers";
import { CountdownConfig } from "ngx-countdown";
import { Config } from "./config";
import { Web3ModalService } from "./services/web3-modal.service";

export class StateToken {
    address: string = "";
    name: string = "";
    symbol: string = "";
    decimals: number = -1;
    icon: string = "";

    totalSupplyLoading: number = -1;
    balanceLoading: number = -1;
    burnedLoading: number = -1;
    priceLoading: number = -1;


    totalSupply: number = -1;
    totalSupplyBigNumber: BigNumber | null = null;
    balance: number = -1;
    balanceBigNumber: BigNumber | null = null;
    burned: number = -1;
    price: number = -1;
    lpAdresses: Array<string> | null = null;

    private approvedAddreses: Array<string> = new Array<string>();
    constructor(icon: string = "", address: string = ""){
        for(let i = 0; i < Config.main.tokenAlias.length; i++){
            const t = Config.main.tokenAlias[i];
            if(t.address == address){
                icon = t.icon;
                this.name = t.name;
                this.symbol = t.symbol;
                if(t.lpAdresses)
                    this.lpAdresses = t.lpAdresses;
                break;
            }
        }
        if(icon != "")
            this.icon  = location.protocol + "//" + location.host + icon;
        if(address != "")
            this.initialize(address);
    }

    public initialize(address: string ){
        this.address = address;
        const contract = this.getContract(false);
        if(contract) {
            const that = this
            if(that.name == "")
                contract.name().then((value: string) => { that.name = value; });
            if(that.symbol == "")
                contract.symbol().then((value: string) => { that.symbol = value; });
            contract.decimals().then((value: BigNumber) => { that.decimals = value.toNumber(); });
        }
    }

    private getContract(signed: boolean = true) : Contract | null{
        if(Web3ModalService.instance == null)
            return null;
        if(signed){
            if(Web3ModalService.instance.signer == null || !AppState.walletSigned())
                return null;
            return new ethers.Contract(this.address, Config.main.tokenContractInterface, Web3ModalService.instance.signer);
        }
        if(Web3ModalService.instance.notLoggedProvider == null)
            return null;
        return new ethers.Contract(this.address, Config.main.tokenContractInterface, Web3ModalService.instance.notLoggedProvider);
    }
    private approveKey(contractAddress : string): string{
        return AppState.selectedAddress + contractAddress;
    }
    updateTotalSupply(){
        if(this.totalSupplyLoading == -2)
            return;
        const c= this.getContract(false);
        if(c){
            const that = this;
            that.totalSupplyLoading = -2;
            c.totalSupply().then((value: BigNumber) => {
                that.totalSupply = that.reduceDecimals(value);
                this.totalSupplyBigNumber = value;
                that.totalSupplyLoading = -1;
            }, (reject: any) => {
                that.totalSupplyLoading = -1;
            });
        } else{
            this.totalSupplyLoading = -1;
        }
    }

    async updatePrice(){
        if(this.priceLoading == -2)
            return;
        if(Web3ModalService.instance){
            this.priceLoading = -2;
            const c = this.getContract(false);
            const usdc = new ethers.Contract(Config.main.addressUSDToken, Config.main.tokenContractInterface, Web3ModalService.instance.notLoggedProvider);
            if(this.lpAdresses == null){
                if(c && usdc){
                    const price = this.reduceDecimals(await c.balanceOf(Config.main.addressLPToken) as BigNumber);
                    const priceUsd = this.reduceDecimals(await usdc.balanceOf(Config.main.addressLPToken) as BigNumber);
                    //console.log(price);
                    //console.log(priceUsd);
                    this.price = priceUsd / price;
                    this.priceLoading = -1;
                }
            } else {
                if(this.totalSupplyBigNumber == null){
                    this.updateTotalSupply();
                    this.priceLoading = -1;
                    return;
                }

                const contractA = new ethers.Contract(this.lpAdresses[0], Config.main.tokenContractInterface, Web3ModalService.instance.notLoggedProvider);
                const contractB = new ethers.Contract(this.lpAdresses[1], Config.main.tokenContractInterface, Web3ModalService.instance.notLoggedProvider);



                let balTOK1: BigNumber = BigNumber.from(1);
                let balTOK2: BigNumber = BigNumber.from(1);
                let balUsd: BigNumber = BigNumber.from(1);

                let promises = [];
                promises.push(contractA.balanceOf(this.address).then((res: BigNumber) => balTOK1 = res));
                promises.push(contractB.balanceOf(this.address).then((res: BigNumber) => balTOK2 = res));
                promises.push(usdc.balanceOf(this.address).then((res: BigNumber) => balUsd = res));

                //promises.push(c.totalSupply().call().then(res => totalSupplyLP = res));
                for (let i = 0; i < promises.length; i++) 
                    await promises[i];

                let priceTOK1: number = this.reduceDecimals(balUsd) / this.reduceDecimals(balTOK1);
                let priceTOK2: number =  this.reduceDecimals(balUsd) / this.reduceDecimals(balTOK2);

                const balTOK1mul = balTOK1.mul(this.decimals);//this.calcBN(balTOK1, decimalDiv, 'mul');
                const balTOK2mul = balTOK2.mul(this.decimals);// = this.calcBN(balTOK2, decimalDiv, 'mul');

                
                const lpTOK1 = balTOK1mul.div(this.totalSupplyBigNumber);//this.calcBN(balTOK1mul, totalSupplyLP, 'div');
                const lpTOK2 =  balTOK2mul.div(this.totalSupplyBigNumber);//this.calcBN(balTOK2mul, totalSupplyLP, 'div');


                const lpTOK1USD = Number(ethers.utils.formatEther(lpTOK1)) * priceTOK1;
                const lpTOK2USD = Number(ethers.utils.formatEther(lpTOK2)) * priceTOK2;
                this.price = lpTOK1USD + lpTOK2USD;

                this.priceLoading = -1;
            }
        }
    }

    updateBalance(){
        if(AppState.selectedAddress == null || this.balanceLoading == -2)
            return;
        if(Web3ModalService.instance && Web3ModalService.instance.signer){
            const that = this;
            that.balanceLoading = -2;
            const c= this.getContract(false);
            if(c){
                c.balanceOf(AppState.selectedAddress).then((value: BigNumber) => {
                    that.balanceBigNumber = value;
                    that.balance = that.reduceDecimals(value);
                    that.balanceLoading = -1;
                }, (reject: any) => {
                    that.balanceLoading = -1;
                });
            } else{
                that.balanceLoading = -1;
            }
        }
    }

    updateBurned(){
        if(this.burnedLoading == -2)
            return;
        const c = this.getContract(false);
        if(c){
            const that = this;
            that.burnedLoading = -2;
            c.balanceOf("0x000000000000000000000000000000000000dEaD").then((value: BigNumber) => {
                
                that.burned = that.reduceDecimals(value);
                that.burnedLoading = -1;
            }, (reject: any) => {
                that.burnedLoading = -1;
            });
        }else{
            this.burnedLoading = -1;
        }
    }    

    balanceOf(address: string) : Promise<BigNumber> | null{
        const c = this.getContract(false)
        if(c)
            return c.balanceOf(address);
        return null;
    }

    isReady(): boolean{
        return this.address != "" && this.name != "" && this.symbol != "" && this.decimals != -1;
    };
    reduceDecimals(number: BigNumber) : number{
        //return Math.floor(Number(number.toBigInt() * BigInt(10)) / 10) / (10 ** this.decimals);
        return Number(number.toBigInt()) / (10 ** this.decimals);
    };
    isApproved(contractAddress: string) : Promise<boolean>{
        return new Promise(async (resolve) => {
            if(!this.isReady() || !AppState.walletSigned())
                resolve(false);
            if(this.approvedAddreses.includes(this.approveKey(contractAddress)))
                resolve(true);
            let ret = false;
            const contract = this.getContract(false);
            if(contract != null){
                const r : BigNumber = await contract.allowance(AppState.selectedAddress, contractAddress);
                ret = r.toHexString() != ethers.constants.Zero.toHexString();
                if(ret)
                    this.approvedAddreses.push(this.approveKey(contractAddress));
            }
            resolve(ret);
        })
    };
    approve(contractAddress: string) : Promise<false | ethers.Transaction>{
        return new Promise(async (resolve) => {
            const contract = this.getContract();
            let ret: false | ethers.Transaction = false;
            if(contract != null){
                try{
                    ret = await contract.approve(contractAddress, ethers.constants.MaxUint256);
                }catch{
                    ret = false;
                }
            }
            resolve(ret);
        })
    };
    addToWallet(){
        if(Web3ModalService.instance !== null && Web3ModalService.instance.walletProvider !== null){
            Web3ModalService.instance.walletProvider.request({
                method: 'wallet_watchAsset',
                params: {
                    type: 'ERC20',
                    options: {
                        address: this.address,
                        symbol: this.symbol,
                        decimals: this.decimals,
                        image: this.icon
                    }
                }
            }).then((value : any) => {
                console.log(value);
            }, (reject: any) => {
                console.log(reject);
            });
            
        }
      }
}

export interface IPresale {
    balanceTokenTheir: number;
    liquidityTokenTheir: number;
    balanceTokenOur: number;
    liquidityTokenOur: number;
    totalClaimableNotDeducted: number;
    tokenOur : StateToken,
    tokenTheir: StateToken,
    depositedCount: number,
    claimedCount: number,
    tokenPrice: number,
    totalDeposited: number,
    totalClaimed: number,
    startTime: number,
    depositTimeOut: number,
    claimTimeOut: number,
    totalClaimable: number,
    devFeePercent: number;
    devAddress: string,
    tokenPriceLiquidity: number,
    tokenTheirMax: number,
    startBlock: number;
}

export class AppState {
    public static selectedAddress: string | null = null;
    public static chainId: number | null = null;
    public static airdropRecieved: boolean | null = null;
    public static airDropTimeout: number = -1;
    public static airDropStartBlock: number = -1;
    public static airDropStartTimeout: number = -1;    
    public static reduceActualTimestamp: number = -1;
     
    public static token : StateToken = new StateToken("/assets/icons/PIG.png");
    public static walletConnected(): boolean {
        return AppState.selectedAddress != null;
    }
    public static badChainId(): boolean {
        return AppState.selectedAddress != null && this.chainId != Config.main.chainID;
    }

    public static walletSigned(): boolean{
        return AppState.walletConnected() && !AppState.badChainId();
    }

    public static mobileMenuVisible : boolean = false;

    public static getPresale() : IPresale{
        return this.presale;
    }

    public static reduceTheirDecimals(number: BigNumber) : number{
        return Number(number.toBigInt()) / (10 ** AppState.presale.tokenTheir.decimals);
    }

    public static reduceOurDecimals(number: BigNumber) : number{
        return Number(number.toBigInt()) / (10 ** AppState.presale.tokenOur.decimals);
    }

    public static timestampToTimeout(timestamp: number) : number{
        return timestamp - (Date.now() / 1000) + AppState.reduceActualTimestamp;
    }

    public static timeOutConfig(timestamp: number): CountdownConfig {
    return {
        leftTime: this.timestampToTimeout(timestamp),
        format: 'dd:HH:mm:ss',
        prettyText: (text) => {
        let ret = "";
        const sp = text.split(':');
        const symbols = ["d","h","m","s"];
        sp.forEach((val, idx) => {
            if(idx == 0)
            val = (Number(val) - 1).toLocaleString( undefined, {minimumIntegerDigits: 2})
            if(ret != "" || val != "00")
            ret += '<span class="item">' + val + '' + symbols[idx] + '</span>'
        });
        return ret;
        }
    };
    }

    public static presale : IPresale = {
        tokenOur: new StateToken("/assets/icons/PIG.png"),
        tokenTheir: new StateToken("/assets/icons/DAI.png"),
        depositedCount: -1,
        claimedCount: -1,
        tokenPrice: -1,
        totalDeposited: -1,
        totalClaimed: -1,
        startTime: -1,
        depositTimeOut: -1,
        claimTimeOut: -1,
        devFeePercent: -1,
        totalClaimable: -1,
        devAddress: "",
        tokenPriceLiquidity: -1,
        tokenTheirMax: -1,
        balanceTokenOur: -1,
        liquidityTokenOur: -1,
        totalClaimableNotDeducted: -1,
        liquidityTokenTheir: -1,
        balanceTokenTheir: -1,
        startBlock: -1
    }
}

