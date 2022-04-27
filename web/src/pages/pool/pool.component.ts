import { Component, OnDestroy, OnInit } from '@angular/core';
import { BigNumber } from 'ethers';
import { interval, Subscription } from 'rxjs';
import { takeWhile } from 'rxjs/operators';
import { AppComponent } from 'src/app/app.component';
import { AppState, StateToken } from 'src/appState';
import { Config } from 'src/config';
import { PoolService, PoolServiceState } from 'src/services/pool.service';

@Component({
  selector: 'app-pool',
  templateUrl: './pool.component.html',
  styleUrls: ['./pool.component.scss']
})
export class PoolComponent implements OnInit, OnDestroy {
  initialized: boolean = false;

  public transactionHash: string = "";
  public transactionError: string = "";
  public poolServiceState: PoolServiceState;

  subscription: Subscription | null = null;
  public totalEmision: BigNumber | null = null;
  public tokensToBeBurned: BigNumber | null = null;
  public distributedTokens: BigNumber | null = null;
  public distributedTokensValue: BigNumber | null = null;

  public tokensToBeDistributed: BigNumber | null = null;

  constructor(private poolService: PoolService) { 
    this.poolServiceState = this.poolService.getState();
  }

  ngOnInit() {
    this.initialized = true;
    
    this.refreshData();
    this.subscription = interval(Config.main.poolUpdateInterval * 1000)
    .pipe(takeWhile(() => this.initialized))
    .subscribe(() => {
      this.refreshData();
    });
    
  }

  ngOnDestroy(): void {
    this.initialized = false;
  }

  refreshData(){
    this.poolService.getDistributedTokens().then(value => {
      this.distributedTokens = value;
      this.calcValues();
    });
    this.poolService.getTokensToBeDistributed().then(value => {
      this.tokensToBeDistributed = value;
      this.calcValues();
    });
    this.poolService.getTokensToBeBurned().then(value => {
      this.tokensToBeBurned = value;
      this.calcValues();
    });
  }

  calcValues(){
    if(this.distributedTokens == null || this.tokensToBeBurned == null)
      return;
    this.distributedTokensValue = this.distributedTokens.sub(this.tokensToBeBurned);
    
    if(this.tokensToBeDistributed == null)
      return;
    this.totalEmision = this.distributedTokens.add(this.tokensToBeBurned).add(this.tokensToBeDistributed);
  }

  tokenInstance(): StateToken{
    return AppState.token;
  }

  token(): string{
    if(!this.poolServiceState.token.isReady())
      return "";
    return this.poolServiceState.token.name + " (" + this.poolServiceState.token.symbol + ")"
  }

  poolAddress(): string{
    return Config.main.addressPool;
  }

  notifyTransaction(transactionHash: string){
    this.transactionHash = transactionHash;
  }

  notifyTransactionError(transactionError: string){
    this.transactionError = transactionError;
  }
}
