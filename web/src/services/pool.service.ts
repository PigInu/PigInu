import { Token } from '@angular/compiler/src/ml_parser/lexer';
import { Injectable } from '@angular/core';
import { BigNumber, ethers } from 'ethers';
import { AppState, StateToken } from 'src/appState';
import { Config } from 'src/config';
import { BigNumberLocalePipe } from 'src/pipe/BigNumberLocale.pipe';
import { Web3ModalService } from './web3-modal.service';

@Injectable({
  providedIn: 'root'
})
export class PoolService {

  private notLoggedContract : ethers.Contract;
  private contractInterface = [
    "function token () view returns (uint)",
    "function userInfo(address)",
    "function started () view returns (bool)",
    "function startBlock () view returns (uint256)",
    "function tokenEarn() view returns (address)",
    "function deposit (uint256, uint256)",
    "function withdraw  (uint256, uint256)",
    "function pendingTokens (uint256, address) view returns (uint)",
    "function users (uint256, address) view returns (tuple(uint256 amount,uint256 rewardDebt) addressPoolData)",
    "function pools(uint256) view returns (tuple(address tokenDeposit,uint256 allocPoint,uint256 lastRewardBlock,uint256 accTokenPerShare,uint256 fee) pool)",
    "function getMultiplier (uint256, uint256) view returns (uint256)",
    "function getTokensToBeBurned() view returns (uint256)",
    "function getDistributedTokens() view returns (uint256)",
    "function getTokensToBeDistributed() view returns (uint256)",    
    "function tokenPerBlock () view returns (uint)",
    "function totalAllocPoint () view returns (uint)",
    "function start (uint256)",
    "function owner() view returns (uint256)",
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

  owner() : Promise<BigNumber>{
    return this.getSignedContract().owner(); 
  }

  started(): Promise<Boolean> {
    return this.getSignedContract().started();
  }

  startBlock(): Promise<BigNumber> {
    return this.getSignedContract().startBlock();
  }
  
  deposit(poolId: number, amount: BigNumber): Promise<ethers.Transaction> {
    return this.getSignedContract().deposit(poolId, amount);
  }

  start(offsetBlocks: number): Promise<ethers.Transaction> {
    return this.getSignedContract().start(BigNumber.from(offsetBlocks));
  }

  withdraw(poolId: number, amount: BigNumber): Promise<ethers.Transaction> {
    return this.getSignedContract().withdraw(poolId, amount);
  }

  pendingTokens(poolId: number, address: string): Promise<BigNumber>{
    return this.getSignedContract().pendingTokens(poolId, address);
  }

  getTokensToBeBurned(): Promise<BigNumber>{
    return this.getSignedContract().getTokensToBeBurned();
  }
  
  getDistributedTokens(): Promise<BigNumber>{
    return this.getSignedContract().getDistributedTokens();
  }

  getTokensToBeDistributed(): Promise<BigNumber>{
    return this.getSignedContract().getTokensToBeDistributed();
  }

  users(poolId: number, address: string): Promise<AddressPoolData>{
    return this.getSignedContract().users(poolId, address);
  }

  getMultiplier(from: string, to: string): Promise<BigNumber>{
    //console.log(from + "|" + to);
    return this.getSignedContract().getMultiplier(from, to);
  }

  getBlockNumber(): Promise<any>{
    return this.getSignedContract().provider.getBlockNumber();
  }

  getBlockTime(): Promise<number>{
    return this.web3ModalService.getBlockTime(this.getSignedContract());
  }

  getBlockNumberTimeout(blockNumber: number): Promise<number>{
    return this.web3ModalService.getBlockNumberTimeout(this.getSignedContract(), blockNumber);
  }

  tokenPerBlock(): Promise<BigNumber>{
    return this.getSignedContract().tokenPerBlock();
  }

  totalAllocPoint(): Promise<BigNumber>{
    return this.getSignedContract().totalAllocPoint();
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

  deposit(amount: string): Promise<ethers.Transaction> {
    return this.service.deposit(this.poolId, BigNumberLocalePipe.getBigNumberFromString(amount, this.tokenDeposit.decimals));
  }

  withdraw(amount: string): Promise<ethers.Transaction> {
    return this.service.withdraw(this.poolId, BigNumberLocalePipe.getBigNumberFromString(amount, this.tokenDeposit.decimals));
  }

  async pendingTokens() : Promise<BigNumber | null>{
    return new Promise(async (resolve) => {
      if(AppState.walletSigned() && AppState.selectedAddress != null){
        //console.log(this.poolId + "," + AppState.selectedAddress);
        const ret: BigNumber = await this.service.pendingTokens(this.poolId, AppState.selectedAddress);
        resolve(ret);
      }
      resolve(null);
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
  allocPoint: BigNumber
}
