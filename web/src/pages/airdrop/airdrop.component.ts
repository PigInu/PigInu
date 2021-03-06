import { Component, OnDestroy, OnInit } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { Config } from 'src/config';
import { takeWhile } from 'rxjs/operators';
import { Web3ModalService } from 'src/services/web3-modal.service';
import { AppState, StateToken } from 'src/appState';
import { BigNumber, ethers } from 'ethers';
import { CountdownConfig } from 'ngx-countdown';

@Component({
  selector: 'app-airdrop',
  templateUrl: './airdrop.component.html',
  styleUrls: ['./airdrop.component.scss']
})
export class AirdropComponent implements OnInit, OnDestroy {

  initialized: boolean = false;
  subscription: Subscription | null = null;
  periodInterval: Subscription | null = null;
  airdropTimeoutOver: boolean | null = null;
  airdropStarted: boolean | null = null;
  notStarted: boolean | null = null;
  contractOwner: string | null = null;
  minBaseCoinBalance: BigNumber | null = null;
  network: ethers.providers.Network | null = null;

  amountOfTokens : number = -1;
  remainingTokens: number = -1;
  airdropsCount: number = -1;
  totalClaimed: number = -1;
  constructor(private web3ModalService: Web3ModalService) { 
  }

  ngOnDestroy(): void {
    this.initialized = false;
  }

  ngOnInit() {
    this.initialized = true;
    this.web3ModalService.airdropOwner().then(value => {
      this.contractOwner = value.toHexString();
    });
    this.web3ModalService.airdropMinBaseCoinBalance().then(value => {
      this.minBaseCoinBalance = value;
    });
    this.web3ModalService.airdropNetwork().then(value => {
      this.network = value;
    });
    this.loadData();
    this.subscription = interval(Config.main.updateInterval * 1000)
    .pipe(takeWhile(() => this.initialized))
    .subscribe(() => {
      this.loadData();
    });

    this.periodInterval = interval(250)
    .pipe(takeWhile(() => 
      (this.initialized) && 
      !(this.airdropTimeoutOver == true && this.airdropStarted == true)
    ))
    .subscribe(() => {
      if(AppState.airDropStartBlock == 0){
          this.notStarted = true;
      } else if(AppState.airDropStartBlock > 0){
        this.notStarted = false;
        if(AppState.airDropTimeout > 0 && AppState.airDropTimeoutIsReal)
          this.airdropTimeoutOver = AppState.timestampToTimeout(AppState.airDropTimeout) <= 0;
        if(AppState.airDropStartTimeout > 0 && AppState.airDropStartTimeoutIsReal)
          this.airdropStarted = AppState.timestampToTimeout(AppState.airDropStartTimeout) <= 0;
      }
    });
  }

  startTransactionHash: string = "";
  startTransactionError: string = "";
  start(delayBlock: string, timeBlock: string){
    this.web3ModalService.airdropStart(Number(delayBlock), Number(timeBlock)).then((value: any) => {
      this.startTransactionHash = value.hash;
    }).catch((value: any) => {
      this.startTransactionError = value.data.message;
    });
  }
  
  isStartButtonVisible(): boolean{
    if(this.contractOwner != null && 
      AppState.selectedAddress?.toLocaleLowerCase() == this.contractOwner && 
      this.notStarted == true
    )
      return true;
    return false;
  }

  tokenInstance(): StateToken{
    return AppState.token;
  }

  token(): string{
    if(!this.tokenInstance().isReady())
      return "";
    return this.tokenInstance().name + " (" + this.tokenInstance().symbol + ")"
  }

  tokenSymbol(): string{
    return this.tokenInstance().symbol;
  }

  tokenDecimals(): number{
    return this.tokenInstance().decimals;
  }

  airdropTokenAddress() : string{
    return Config.main.addressAirdrop;
  }

  walletConnected(): boolean{
    return AppState.walletConnected();
  }

  tokenAddress(): string{
    return this.tokenInstance().address;
  }

  airdropTimeout(): number{
    return AppState.airDropTimeout;
  }

  airdropStartTimeout(): number{
    return AppState.airDropStartTimeout;
  }

  airdropTimeoutIsReal(): boolean | null{
    return AppState.airDropTimeoutIsReal;
  }

  airdropStartTimeoutIsReal(): boolean | null{
    return AppState.airDropStartTimeoutIsReal;
  }  

  airdropsTotal(): null | number{
    if(this.remainingTokens == -1 || this.amountOfTokens == -1 || this.airdropsCount == -1)
      return null;
    return ((this.remainingTokens  / this.amountOfTokens) + this.airdropsCount);
  }

  airdropsCountPercent() : number{
    if(this.airdropsTotal() !== null){
      const t: number = this.airdropsTotal() as number;
      return Math.floor(this.airdropsCount / (t / 100));
    }
    return -1;
  }

  airdropTransctionHash: string | undefined;
  airdropRecieved(): boolean | null{
    if(AppState.badChainId() || this.tokenSymbol() == '')
      return null;
    return AppState.airdropRecieved;
  }

  isAirdropPossible(): boolean{
    return true;
    if(this.airdropRecieved() || 
      this.airdropsTotal() == null || 
      this.remainingTokens < this.amountOfTokens || 
      this.airdropTimeoutOver ||
      this.airdropStarted !== true
    )
      return false;
    return true;
  }
  airdropError : string | null = null;
  airdropLoading: boolean = false;
  airDropClick(){
    if(this.airdropLoading)
      return;
    this.airdropError = null;
    this.airdropLoading = true;
    this.web3ModalService.airdrop().then((transaction: ethers.Transaction) => {
      this.airdropTransctionHash = transaction.hash;
      AppState.airdropRecieved = true;
    }, (error: any) => {
      if(error.data != null && error.data.message != null)
        this.airdropError = error.data.message;
      else if(error.message != null)
        this.airdropError = error.message;
      else
        this.airdropError = error;
      //console.log(error);
    }).finally(() => {
      this.airdropLoading = false;
    });
  }

  timeOutConfig(timestamp: number) {
    return AppState.timeOutConfig(timestamp);
  }

  public startBlock(): number{
    return AppState.airDropStartBlock;
  }

  public endBlock(): number{
    return AppState.airDropEndBlock;
  }

  private loadData(){
    //if(AppState.airDropStartTimeoutIsReal != true || AppState.airDropTimeoutIsReal != true)
    this.web3ModalService.airdropTimeout();
    //this.amountOfTokens = this.remainingTokens = this.totalClaimed = this.airdropsCount = -1;
    this.web3ModalService.getTotalClaimed().then(value => {
      this.totalClaimed = value;
    });
    this.web3ModalService.getAmountOfTokens().then(value => {
      this.amountOfTokens = value;
    });
    this.web3ModalService.getRemainingTokens().then(value => {
      this.remainingTokens = value;
    });
    this.web3ModalService.getAirdropsCount().then(value => {
      this.airdropsCount = value;
    });
  }
}
