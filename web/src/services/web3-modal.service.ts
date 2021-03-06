import { Injectable } from '@angular/core';
import Web3Modal, { IProviderOptions } from "web3modal";
import { Config } from 'src/config';
import { BigNumber, Contract, ethers, providers, Signer } from 'ethers'
import WalletConnectProvider from '@walletconnect/web3-provider';
import { AppState } from 'src/appState';
import { Web3Provider, JsonRpcProvider } from '@ethersproject/providers';
import { BigNumberLocalePipe } from 'src/pipe/BigNumberLocale.pipe';

@Injectable({
  providedIn: 'root'
})
export class Web3ModalService {
  public static instance: Web3ModalService | null = null;
  walletProvider: any | null = null;
  web3Provider: Web3Provider | null = null
  signer: Signer | null = null
  airdropContract: Contract | null = null;
  presaleContract: Contract | null = null;

  notLoggedProvider: JsonRpcProvider
  airdropNotLoggedContract: Contract;
  taxTokenNotLoggedContract: Contract | null = null;
  presaleNotLoggedContract: Contract;

  tokenDecimalsPromise: Promise<boolean>;

  constructor() {
    this.notLoggedProvider = new JsonRpcProvider(Config.main.network);
    this.airdropNotLoggedContract = new ethers.Contract(Config.main.addressAirdrop, Config.main.airdropContractInterface, this.notLoggedProvider);
    this.notLoggedProvider.getBlock(this.notLoggedProvider._lastBlockNumber).then(block => {
      AppState.reduceActualTimestamp = (block.timestamp * 1000 - Date.now()) / 1000;
    });
    this.tokenDecimalsPromise = new Promise(async (resolve) => {
      this.airdropNotLoggedContract.token().then(async (value: BigNumber) => {
        AppState.token.address = value.toHexString();
        this.taxTokenNotLoggedContract = new ethers.Contract( AppState.token.address , Config.main.tokenContractInterface, this.notLoggedProvider);
        this.taxTokenNotLoggedContract.name().then((value: string) => {
          AppState.token.name = value;
        });
        this.taxTokenNotLoggedContract.symbol().then((value: string) => {
          AppState.token.symbol = value;
        });
        const decimals: BigNumber = await this.taxTokenNotLoggedContract.decimals();
        AppState.token.decimals = decimals.toNumber();
        resolve(true);
      });
      Web3ModalService.instance = this;
    });

    this.presaleNotLoggedContract = new ethers.Contract(Config.main.addressPresale, Config.main.presaleContractInterface, this.notLoggedProvider);
    this.loadPresaleData();
    this.tryConnect();
  }

  public loadPresaleData(){
    this.presaleNotLoggedContract.tokenTheir().then((value: BigNumber) => {
      AppState.presale.tokenTheir.address = value.toHexString();
      const contract = new ethers.Contract( AppState.presale.tokenTheir.address, Config.main.tokenContractInterface, this.notLoggedProvider);
      contract.name().then((value: string) => { AppState.presale.tokenTheir.name = value; });
      contract.symbol().then((value: string) => { AppState.presale.tokenTheir.symbol = value; });
      const decimalsPromise =contract.decimals().then((value: BigNumber) => { AppState.presale.tokenTheir.decimals = value.toNumber(); });
      this.presaleNotLoggedContract.tokenPricePresale().then(async (value: BigNumber) => { 
        await decimalsPromise;
        AppState.presale.tokenPrice = AppState.reduceTheirDecimals(value); 
      });
      this.presaleNotLoggedContract.tokenPriceLiquidity().then(async (value: BigNumber) => { 
        await decimalsPromise;
        AppState.presale.tokenPriceLiquidity = AppState.reduceTheirDecimals(value); 
      });
      this.presaleNotLoggedContract.getPresaleTokenTheirMax().then(async (value: BigNumber) => { 
        await decimalsPromise;
        AppState.presale.tokenTheirMax = AppState.reduceTheirDecimals(value); 
      });
      this.presaleNotLoggedContract.totalDeposited().then(async (value: BigNumber) => { 
        await decimalsPromise;
        AppState.presale.totalDeposited = AppState.reduceTheirDecimals(value); 
      });
      this.presaleNotLoggedContract.getLiquidityTokenTheir().then(async (value: BigNumber) => {
        await decimalsPromise;
        AppState.presale.liquidityTokenTheir = AppState.reduceTheirDecimals(value); 
      });
      this.presaleNotLoggedContract.getBalanceTokenTheir().then(async (value: BigNumber) => {
        await decimalsPromise;
         AppState.presale.balanceTokenTheir = AppState.reduceTheirDecimals(value); 
      });
      this.presaleNotLoggedContract.devsFeePercent().then((value: BigNumber) => { 
          AppState.presale.devFeePercent = value.toNumber(); 
      });
    });
    this.presaleNotLoggedContract.tokenOur().then((value: BigNumber) => {
      AppState.presale.tokenOur.address = value.toHexString();
      const contract = new ethers.Contract( AppState.presale.tokenOur.address, Config.main.tokenContractInterface, this.notLoggedProvider);
      contract.name().then((value: string) => { AppState.presale.tokenOur.name = value; });
      contract.symbol().then((value: string) => { AppState.presale.tokenOur.symbol = value; });      
      const decimalsPromise = contract.decimals().then((value: BigNumber) => { AppState.presale.tokenOur.decimals = value.toNumber(); });
      this.presaleNotLoggedContract.totalClaimed().then(async (value: BigNumber) => { 
        await decimalsPromise;
        AppState.presale.totalClaimed = AppState.reduceOurDecimals(value); 
      });
      this.presaleNotLoggedContract.totalClaimableNotDeducted().then(async (value: BigNumber) => { 
        await decimalsPromise;
        AppState.presale.totalClaimableNotDeducted = AppState.reduceOurDecimals(value); 
      });
      this.presaleNotLoggedContract.getLiquidityTokenOur().then(async (value: BigNumber) => { 
        await decimalsPromise;
        AppState.presale.liquidityTokenOur = AppState.reduceOurDecimals(value); 
      });
      this.presaleNotLoggedContract.getBalanceTokenOur().then(async (value: BigNumber) => {
        await decimalsPromise;
        AppState.presale.balanceTokenOur = AppState.reduceOurDecimals(value); 
      });
    });
    this.presaleNotLoggedContract.claimedCount().then((value: BigNumber) => { AppState.presale.claimedCount = Number(value.toString()); });
    this.presaleNotLoggedContract.depositedCount().then((value: BigNumber) => { AppState.presale.depositedCount = Number(value.toString()); });    
    this.presaleNotLoggedContract.startBlock().then((value: BigNumber) => { 
      AppState.presale.startBlock = value.toNumber();
      this.getBlockNumberTimeout(this.presaleNotLoggedContract, AppState.presale.startBlock).then(blockTimeout => {
        AppState.presale.startTime = blockTimeout.timeout;
        AppState.presale.startTimeIsReal = blockTimeout.realTime;
      });
    });
    this.presaleNotLoggedContract.claimTimeOutBlock().then((value: BigNumber) => { 
      AppState.presale.claimBlock = value.toNumber();
      this.getBlockNumberTimeout(this.presaleNotLoggedContract, AppState.presale.claimBlock).then(blockTimeout => {
        AppState.presale.claimTimeOut = blockTimeout.timeout;
        AppState.presale.claimTimeOutIsReal = blockTimeout.realTime;
      });
    });

    this.presaleNotLoggedContract.depositTimeOutBlock().then((value: BigNumber) => { 
      AppState.presale.depositBlock = value.toNumber();
      this.getBlockNumberTimeout(this.presaleNotLoggedContract, AppState.presale.depositBlock).then(blockTimeout => {
        AppState.presale.depositTimeOut = blockTimeout.timeout;
        AppState.presale.depositTimeOutIsReal = blockTimeout.realTime;
      });
    });
    this.presaleNotLoggedContract.totalClaimable().then((ret: BigNumber) => { this.reduceNumberDecimals(ret).then(value =>{ AppState.presale.totalClaimable = value; })});
  }

  public async getBlockNumberTimeout(contract: Contract, blockNumber: number): Promise<BlockTimeout>{
    return contract.provider.getBlock(blockNumber).then(async block => {
      if(block != null)
        return {timeout: Number(block.timestamp), realTime: true};
      const actualBlockNumber = await contract.provider.getBlockNumber();
      const actualBlock = await contract.provider.getBlock(actualBlockNumber);
      const blockTime = await this.getBlockTime(contract);
      let timeout = actualBlock.timestamp + ((blockNumber - actualBlockNumber) * blockTime);
      if(timeout < actualBlock.timestamp + 35)
        timeout = actualBlock.timestamp + 35;
      return {timeout: timeout, realTime: false};        
    });
  }

  public async getBlockTime(contract: Contract): Promise<number>{
    const blockNum = 100;
    let blockCurrent: any;
    let blockOld: any;
    let blockNumberCurrent = await contract.provider.getBlockNumber();
    let promises = [];
    promises.push(contract.provider.getBlock(blockNumberCurrent).then(res => blockCurrent = res));
    promises.push(contract.provider.getBlock(blockNumberCurrent - blockNum).then(res => blockOld = res));
    var i;
    for (i = 0; i < promises.length; i++) 
      await promises[i];
    if(blockCurrent == null || blockOld == null)
      return 0;
    var timeDiff = blockCurrent.timestamp - blockOld.timestamp;
    return timeDiff / blockNum;
  }
  
  private async reduceNumberDecimals(number: BigNumber) : Promise<number>{
    await this.tokenDecimalsPromise;
    return AppState.token.reduceDecimals(number);
  }

  public addNetwork(){
    this.walletProvider.request({
      method: 'wallet_addEthereumChain',
      params: [{ 
        chainId: Config.main.getHexChainId(), 
        rpcUrls: [Config.main.network],
        blockExplorerUrls: [Config.main.explorer],
        chainName: Config.main.networkName,
        "nativeCurrency": {
          "name": Config.main.nativeCurrency.name,
          "symbol": Config.main.nativeCurrency.symbol,
          "decimals": Config.main.nativeCurrency.decimals
        },
      }]
    }).then((success: any) => {
      console.log("ok add");
      console.log(success);
      this.switchNetwork();
    }, (reject: any) =>{
      console.log("error add");
      console.log(reject);
    });
  }

  public switchNetwork(){
    this.walletProvider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: Config.main.getHexChainId()}],
    }).then((success: any) => {
      console.log("ok switch");
      console.log(success);
    }, (reject: any) =>{
      console.log("error switch");
      console.log(reject);
      if (reject.code === 4902) {
        this.addNetwork();
      }
    });
  }


  tryConnect(){
    const cahckedproviderJson = localStorage.getItem("WEB3_CONNECT_CACHED_PROVIDER");
    if(cahckedproviderJson){
      this.web3Modal();
    }
  }

  private getWeb3ModalConnector(): Web3Modal{
    const INFURA_ID = 'c22c90a767684c5fbd7257da57802b35'
    const providerOptions : IProviderOptions = {
      walletconnect: {
        package: WalletConnectProvider, // required
        options: {
          infuraId: INFURA_ID,
          rpc: {
            137: 'https://rpc-mainnet.matic.quiknode.pro',
            80001: 'https://matic-mumbai.chainstacklabs.com'
          }
        },
      }
    }
    const web3ModalConnector = new Web3Modal({
      //network: "matic",
      cacheProvider: true, // optional
      providerOptions: providerOptions // required,
    });
    return web3ModalConnector; 
  }

  web3Modal(){
    const web3ModalConnector = this.getWeb3ModalConnector();
    web3ModalConnector.connect().then(provider => {
      this.initializeProvider(provider);
      this.web3Provider = new providers.Web3Provider(provider);
      this.walletProvider = provider;
      this.signer = this.web3Provider.getSigner();
      
      this.airdropContract = new ethers.Contract(Config.main.addressAirdrop, Config.main.airdropContractInterface, this.signer);
      this.presaleContract = new ethers.Contract(Config.main.addressPresale, Config.main.presaleContractInterface, this.signer);
      let network : ethers.providers.Network;
      
      const networkPromise = this.web3Provider?.getNetwork().then( value => {
        network = value;
      });

      this.signer?.getAddress().then( async address => {
        await networkPromise;
        AppState.selectedAddress = address;  
        AppState.chainId = network.chainId;
        if(AppState.chainId == Config.main.chainID){     
          this.airdropNotLoggedContract.addressReceived(AppState.selectedAddress).then((value: boolean) => {
            AppState.airdropRecieved = value;
          });
        }
      });
    }, reason => {
      console.log(reason);
    });
  }

  disconnect(){
    if(this.walletProvider){
      if(typeof this.walletProvider.disconnect == "function")
        this.walletProvider.disconnect();
      else if(typeof this.walletProvider._handleDisconnect == "function")
        this.walletProvider._handleDisconnect();
    }
  }

  airdrop(): Promise<ethers.Transaction> {
    return this.airdropContract?.claim();
  }

  airdropOwner() : Promise<BigNumber>{
    return this.airdropNotLoggedContract?.owner(); 
  }

  private initializeProvider(provider: any){
    provider.on("accountsChanged", (accounts: string[]) => {
      location.reload();
    });
    
    // Subscribe to chainId change
    provider.on("chainChanged", (chainId: number) => {
      location.reload();
    });
    
    // Subscribe to provider connection
    provider.on("connect", (info: { chainId: number }) => {
      console.log("connect" + info.chainId);
    });
    
    // Subscribe to provider disconnection
    provider.on("disconnect", (error: { code: number; message: string }) => {
      this.getWeb3ModalConnector().clearCachedProvider();
      AppState.selectedAddress = null;
      AppState.chainId = null;
      AppState.airdropRecieved = null;
      this.walletProvider = null;
      this.airdropContract = null
    });
  }
  
   getCurrentBlock():  Promise<Number> {
    return this.notLoggedProvider.getBlockNumber();
   }
  
   async getAmountOfTokens() : Promise<number>{
    return new Promise(async (resolve) => {
      const ret: BigNumber = await this.airdropNotLoggedContract.amountToClaim();
      resolve(this.reduceNumberDecimals(ret));
    });
   }

   async getRemainingTokens() : Promise<number>{
    return new Promise(async (resolve) => {
      const ret: BigNumber  = await this.airdropNotLoggedContract.getRemainingTokens();
      resolve(this.reduceNumberDecimals(ret));
    });
   }

   async getTotalClaimed() : Promise<number>{
    return new Promise(async (resolve) => {
      const ret: BigNumber  = await this.airdropNotLoggedContract.totalClaimed();
      resolve(this.reduceNumberDecimals(ret));
    });
   }

   async getAirdropsCount() : Promise<number>
   {
    return new Promise(async (resolve) => {
      const ret: BigNumber = await this.airdropNotLoggedContract.claimCount();
      resolve(ret.toNumber());
    });
   }

   presaleClaimed(address: string) : Promise<BigNumber>{
     return this.presaleNotLoggedContract.claimed(address);
   }

   presaleDevWallets(input: number): Promise<Array<BigNumber>>{
    return this.presaleNotLoggedContract.devWallets(input);
  }

  presaleClaimeable(address: string): Promise<BigNumber>{
    return this.presaleNotLoggedContract.claimable(address);
  }

  airdropMinBaseCoinBalance(): Promise<BigNumber>{
    return this.airdropNotLoggedContract.minBaseCoinBalance();
  }
   
  airdropNetwork(): Promise<ethers.providers.Network>{
    return this.airdropNotLoggedContract.provider.getNetwork();
  }

  airdropTimeout(){
    this.airdropNotLoggedContract.timeOutBlock().then((ret: BigNumber) => {
      AppState.airDropEndBlock = ret.toNumber();
      this.getBlockNumberTimeout(this.airdropNotLoggedContract, ret.toNumber()).then(blockTimeout => {
        AppState.airDropTimeout = blockTimeout.timeout;
        AppState.airDropTimeoutIsReal = blockTimeout.realTime;
      });
    });
    this.airdropNotLoggedContract.startBlock().then((ret: BigNumber) => {
      AppState.airDropStartBlock = ret.toNumber();
      this.getBlockNumberTimeout(this.airdropNotLoggedContract, ret.toNumber()).then(blockTimeout => {
        AppState.airDropStartTimeout = blockTimeout.timeout;
        AppState.airDropStartTimeoutIsReal = blockTimeout.realTime;
        console.log("start");
        console.log(AppState.airDropStartTimeout);
        console.log(AppState.airDropStartTimeoutIsReal );
      });
    });
  }

  airdropStart(delayBlocks: number, timeBlocks: number){
    return this.airdropContract?.start(BigNumber.from(delayBlocks), BigNumber.from(timeBlocks));
  }

  presaleStart(delayBlocks: number, depositBlocks: number, claimBlocks: number){
    return this.presaleContract?.start(BigNumber.from(delayBlocks), BigNumber.from(depositBlocks), BigNumber.from(claimBlocks));
  }

  presaleOwner() : Promise<BigNumber>{
    return this.presaleNotLoggedContract?.owner();
  }

   presaleDeposited(address: string) : Promise<number>{
    return new Promise(async (resolve, reject) => {
      try{
        const ret: BigNumber = await this.presaleNotLoggedContract.deposited(address);
        resolve(AppState.reduceTheirDecimals(ret));
      } catch(e){
        reject(e);
      }
    });
  }

  presaleDeposit(amountString: string): Promise<ethers.Transaction> {
    const bn = BigNumberLocalePipe.getBigNumberFromString(amountString,  AppState.presale.tokenTheir.decimals);
    return this.presaleContract?.deposit(bn);
  }

  presaleClaim(): Promise<ethers.Transaction> {
    return this.presaleContract?.claim();
  }
}

export interface BlockTimeout{
  timeout: number;
  realTime: boolean;
}