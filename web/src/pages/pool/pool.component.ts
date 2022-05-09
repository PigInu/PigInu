import { Component, ComponentFactoryResolver, OnDestroy, OnInit } from '@angular/core';
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
  
  contractOwner: string | null = null;

  public transactionHash: string = "";
  public transactionError: string = "";
  public poolServiceState: PoolServiceState;

  subscription: Subscription | null = null;
  public totalEmision: BigNumber | null = null;
  public tokensToBeBurned: BigNumber | null = null;
  public distributedTokens: BigNumber | null = null;
  public distributedTokensValue: BigNumber | null = null;

  public tokensToBeDistributed: BigNumber | null = null;

  public started: Boolean | null = null;
  public startBlock: number | null = null;
  public startDate: number | null = null;
  public totalAllocPoint: number | null = null;
  public tokenPerBlock: BigNumber | null = null;

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
    this.poolService.tokenPerBlock().then(value => {
      this.tokenPerBlock = value;
    });
    this.poolService.totalAllocPoint().then(value => {
      this.totalAllocPoint = value.toNumber();
    });
    this.poolService.owner().then(value => {
      this.contractOwner = value.toHexString();
    });
  }

  ngOnDestroy(): void {
    this.initialized = false;
  }

  startTransactionHash: string = "";
  startTransactionError: string = "";
  start(offsetBlocks: string){
    this.poolService.start(Number(offsetBlocks)).then((value: any) => {
      this.startTransactionHash = value.hash;
    }).catch((value: any) => {
      this.startTransactionError = value.data.message;
    });
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
    if(this.started != true){
      this.poolService.started().then(value => {
        this.started = value;
        if(this.started){
          this.poolService.startBlock().then(value => {
            this.startBlock = value.toNumber();
            this.poolService.getBlockNumberTimeout( this.startBlock ).then(value => {
              this.startDate = value * 1000;
            });
          });
        }
      });
    }
  }

  isStartButtonVisible(): boolean{
    if(this.contractOwner != null && 
      AppState.selectedAddress?.toLocaleLowerCase() == this.contractOwner && 
      this.started == false
    )
      return true;
    return false;
  }

  calcValues(){
    if(this.distributedTokens == null || this.tokensToBeBurned == null)
      return;
    this.distributedTokensValue = this.distributedTokens.sub(this.tokensToBeBurned);
    
    if(this.totalEmision != null || this.tokensToBeDistributed == null)
      return;
    this.totalEmision = this.distributedTokensValue.add(this.tokensToBeBurned).add(this.tokensToBeDistributed);
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
