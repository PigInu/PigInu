import { Component, OnDestroy, OnInit } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { Config } from 'src/config';
import { takeWhile } from 'rxjs/operators';
import { Web3ModalService } from 'src/services/web3-modal.service';
import { AppState, StateToken } from 'src/appState';
import { ethers } from 'ethers';
import { CountdownConfig } from 'ngx-countdown';

@Component({
  selector: 'app-airdrop',
  templateUrl: './airdrop.component.html',
  styleUrls: ['./airdrop.component.scss']
})
export class AirdropComponent implements OnInit, OnDestroy {

  initialized: boolean = false;
  subscription: Subscription | null = null;
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
    this.web3ModalService.airdropTimeout();
    this.loadData();
    this.subscription = interval(Config.main.updateInterval * 1000)
    .pipe(takeWhile(() => this.initialized))
    .subscribe(() => {
      this.loadData();
    });
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
    if(this.airdropRecieved() || 
      this.airdropsTotal() == null || 
      this.remainingTokens < this.amountOfTokens || 
      this.timestampToTimeout(this.airdropTimeout()) <= 0 ||
      this.airdropTimeout() == 0
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

  timestampToTimeout(timestamp: number) : number{
    return AppState.timestampToTimeout(timestamp);
  }

  timeOutConfig(timestamp: number): CountdownConfig {
    return AppState.timeOutConfig(timestamp);
  }

  private loadData(){
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
