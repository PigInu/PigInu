import { Component, OnInit } from '@angular/core';
import { StateToken } from 'src/appState';
import { Config } from 'src/config';
import { PoolService, PoolServiceState } from 'src/services/pool.service';

@Component({
  selector: 'app-pool',
  templateUrl: './pool.component.html',
  styleUrls: ['./pool.component.scss']
})
export class PoolComponent implements OnInit {

  public transactionHash: string = "";
  public transactionError: string = "";
  public poolServiceState: PoolServiceState;

  constructor(private poolService: PoolService) { 
    this.poolServiceState = this.poolService.getState();
  }

  ngOnInit() {
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
