import { Token } from '@angular/compiler/src/ml_parser/lexer';
import { Injectable } from '@angular/core';
import { BigNumber, ethers } from 'ethers';
import { AppState, StateToken } from 'src/appState';
import { Config } from 'src/config';
import { Web3ModalService } from './web3-modal.service';

@Injectable({
  providedIn: 'root'
})
export class PoolService {

  private notLoggedContract : ethers.Contract;
  private contractInterface = [
    "function token () view returns (uint)",
    "function userInfo(address)",
    "function tokensPerBlock () view returns (uint)",
    "function startBlock () view returns (uint)",
    "function tokenEarn() view returns (address)",
    "function deposit (uint256, uint256)",
    "function withdraw  (uint256, uint256)",
    "function pendingTokens (uint256, address) view returns (uint)",
    "function users (uint256, address) view returns (tuple(uint256 amount,uint256 rewardDebt) addressPoolData)",
    "function pools(uint256) view returns (tuple(address tokenDeposit,uint256 allocPoint,uint256 lastRewardBlock,uint256 accTokenPerShare,uint256 fee) pool)"
  ];
  private state : PoolServiceState = {
    token: new StateToken("/assets/token.png"),
    tokenEarn: "",
    pools: []
  }

  public getState() : PoolServiceState{
    return this.state;
  }

  constructor(private web3ModalService: Web3ModalService) {
    this.notLoggedContract = new ethers.Contract(Config.main.addressPool, this.contractInterface, web3ModalService.notLoggedProvider);
    //this.notLoggedContract.token().then((address : BigNumber) => {
    //  this.state.token.initialize(address.toHexString());
    //});    
    this.notLoggedContract.tokenEarn().then((tokenEarn: string) => {
      this.getState().tokenEarn = tokenEarn;
      this.loadData();
    });
  }

  private getSignedContract() : ethers.Contract{
    if(this.web3ModalService.signer)
      return new ethers.Contract(Config.main.addressPool, this.contractInterface, this.web3ModalService.signer);
    return this.notLoggedContract;
  }

  public loadData() {
    for(var i = 0; i <= 2;i++){
      const that = this;
      const idx = i;
      this.notLoggedContract.pools(idx).then((pool: PoolData) => {
        that.state.pools[idx] = new PoolState(pool, idx, that, this.getState().tokenEarn);
      });
    }
  }
  
  deposit(poolId: number, amount: BigNumber): Promise<ethers.Transaction> {
    return this.getSignedContract().deposit(poolId, amount);
  }

  withdraw(poolId: number, amount: BigNumber): Promise<ethers.Transaction> {
    return this.getSignedContract().withdraw(poolId, amount);
  }

  pendingTokens(poolId: number, address: string): Promise<BigNumber>{
    return this.getSignedContract().pendingTokens(poolId, address);
  }

  users(poolId: number, address: string): Promise<AddressPoolData>{
    return this.getSignedContract().users(poolId, address);
  }
}

export interface PoolServiceState {
  token: StateToken,
  tokenEarn: string,
  pools: Array<PoolState>
}

export class PoolState {
  public poolId: number;
  public data: PoolData
  public tokenDeposit : StateToken;
  public tokenEarn : StateToken;
  private service: PoolService;
  constructor(poolData: PoolData, poolId: number,service: PoolService, tokenEarn: string) {
    this.data = poolData;
    this.poolId = poolId;
    this.service = service;
    this.tokenDeposit = new StateToken("/assets/token.png", poolData.tokenDeposit);
    this.tokenEarn = new StateToken("/assets/token.png", tokenEarn);
  }
  public feePercent() : number{
    return this.data.fee.toNumber() / 100;
  }

  deposit(amount: number): Promise<ethers.Transaction> {
    const b = BigInt(amount * (10 ** this.tokenDeposit.decimals));
    return this.service.deposit(this.poolId, BigNumber.from(b));
  }

  withdraw(amount: number): Promise<ethers.Transaction> {
    const b = BigInt(amount * (10 ** this.tokenDeposit.decimals));
    return this.service.withdraw(this.poolId, BigNumber.from(b));
  }

  async pendingTokens() : Promise<number>{
    return new Promise(async (resolve) => {
      if(AppState.walletSigned() && AppState.selectedAddress != null){
        //console.log(this.poolId + "," + AppState.selectedAddress);
        const ret: BigNumber = await this.service.pendingTokens(this.poolId, AppState.selectedAddress);
        resolve(this.tokenDeposit.reduceDecimals(ret));
      }
      resolve(-1);
    });
   }

   async addressPoolData() : Promise<AddressPoolData | null>{
    return new Promise(async (resolve) => {
      if(AppState.walletSigned() && AppState.selectedAddress != null){
        //console.log(this.poolId + "," + AppState.selectedAddress);
        const ret = await this.service.users(this.poolId, AppState.selectedAddress);
        resolve(ret);
      }
      resolve(null);
    });
   }
   
}

export interface AddressPoolData{
  amount: BigNumber, //   uint256
  rewardDebt : BigNumber, //   uint256
}

interface PoolData {
  tokenDeposit: string, //address
  lastRewardBlock: BigNumber, //   uint256 :  0
  accTokenPerShare: BigNumber, //   uint256 :  0
  fee: BigNumber, //   uint256 :  400
}
