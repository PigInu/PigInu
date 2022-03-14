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
    totalSupply: number = -1;
    balance: number = -1;
    burned: number = -1;

    private approvedAddreses: Array<string> = new Array<string>();
    constructor(icon: string = "", address: string = ""){
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
            contract.name().then((value: string) => { that.name = value; });
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
        if(this.totalSupply == -2)
            return;
        const c= this.getContract(false);
        if(c){
            const that = this;
            that.totalSupply = -2;
            c.totalSupply().then((value: BigNumber) => {
                that.totalSupply = that.reduceDecimals(value);
            }, (reject: any) => {
                that.totalSupply = -1;
            });
        } else{
            this.totalSupply = -1;
        }
    }
    updateBalance(){
        if(AppState.selectedAddress == null || this.balance == -2)
            return;
        if(Web3ModalService.instance && Web3ModalService.instance.signer){
            const that = this;
            that.balance = -2;
            const c= this.getContract(false);
            if(c){
                c.balanceOf(AppState.selectedAddress).then((value: BigNumber) => {
                    that.balance = that.reduceDecimals(value);
                }, (reject: any) => {
                    that.balance = -1;
                });
            } else{
                that.balance = -1;
            }
        }
    }

    updateBurned(){
        if(this.burned == -2)
            return;
        const c = this.getContract(false);
        if(c){
            const that = this;
            that.burned = -2;
            c.balanceOf("0x000000000000000000000000000000000000dEaD").then((value: BigNumber) => {
                that.burned = that.reduceDecimals(value);
            }, (reject: any) => {
                that.burned = -1;
            });
        }else{
            this.burned = -1;
        }
    }    

    isReady(): boolean{
        return this.address != "" && this.name != "" && this.symbol != "" && this.decimals != -1;
    };
    reduceDecimals(number: BigNumber) : number{
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
}

export class AppState {
    public static selectedAddress: string | null = null;
    public static chainId: number | null = null;
    public static airdropRecieved: boolean | null = null;
    public static airDropTimeout: number = -1;
    public static reduceActualTimestamp: number = -1;
     
    public static token : StateToken = new StateToken("/assets/token.png");
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
        tokenOur: new StateToken("/assets/token.png"),
        tokenTheir: new StateToken("/assets/XUSD.png"),
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
        balanceTokenTheir: -1
    }
}

