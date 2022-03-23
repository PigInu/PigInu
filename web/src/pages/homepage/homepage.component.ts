import { Component, OnDestroy, OnInit } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { Config } from 'src/config';
import { takeWhile } from 'rxjs/operators';
import { Web3ModalService } from 'src/services/web3-modal.service';
import { AppState, IPresale, StateToken } from 'src/appState';
import { ethers } from 'ethers';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.scss']
})
export class HomepageComponent implements OnInit, OnDestroy {
  initialized: boolean = false;
  subscription: Subscription | null = null;
  stateToken : StateToken;

  constructor() { 
    this.stateToken = new StateToken("/assets/icons/PIG.png", Config.main.addressToken);
  }

  ngOnInit(): void {
    /*
    this.subscription = interval(Config.main.updateInterval * 1000)
    .pipe(takeWhile(() => this.initialized))
    .subscribe(() => {
      this.loadData();
    });
    */
  }

  ngOnDestroy(): void {
    this.initialized = false;
  }

  walletConnected(): boolean{
    return AppState.walletConnected();
  }

  tokenInstance(): StateToken{
    return this.stateToken;
  }

  public config(){
    return Config.main;
  }

  token(): string{
    if(!this.tokenInstance().isReady())
      return "";
    if(this.tokenInstance().totalSupply == -1 || (this.tokenInstance().balance == -1 && this.walletConnected()))
      this.loadData();
    return this.tokenInstance().name + " (" + this.tokenInstance().symbol + ")"
  }

  private loadData(){
    if(this.tokenInstance().totalSupply == -1)
      this.tokenInstance().updateTotalSupply();
    this.tokenInstance().updateBalance();
    this.tokenInstance().updateBurned();
  }

  copyText(address: string){
    const el = document.createElement('textarea');
    el.value = address;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    /*
    this.isCopiedVisible = true;
    const that = this;
    setTimeout(function(){
      that.isCopiedVisible = false;
    }, 1000);
    */
  }
}

