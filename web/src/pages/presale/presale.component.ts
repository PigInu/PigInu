import { Component, OnDestroy, OnInit } from '@angular/core';
import { ethers } from 'ethers';
import { CountdownConfig } from 'ngx-countdown';
import { interval } from 'rxjs';
import { takeWhile } from 'rxjs/operators';
import { AppState, IPresale } from 'src/appState';
import { Config } from 'src/config';
import { Web3ModalService } from 'src/services/web3-modal.service';
import { isNumber } from 'util';

@Component({
  selector: 'app-presale',
  templateUrl: './presale.component.html',
  styleUrls: ['./presale.component.scss']
})
export class PresaleComponent implements OnInit, OnDestroy  {
  initialized: boolean = false;
  subscription: any;

  constructor(private web3ModalSevice: Web3ModalService) { }
  ngOnDestroy(): void {
    this.initialized = false;
  }

  ngOnInit() {
    this.initialized = true;
    this.web3ModalSevice.presaleDevAddress();
    this.web3ModalSevice.presaleDevFeePercent();
    this.subscription = interval(Config.main.updateInterval * 1000)
    .pipe(takeWhile(() => this.initialized))
    .subscribe(() => {
      console.log("load: " + Date.now());
      this.web3ModalSevice.loadPresaleData();
    });
  }

  presale() : IPresale{
    return AppState.getPresale();
  }

  claimablePercent() : number{
    if(this.presale().totalClaimable == -1 || this.presale().totalClaimed == -1 || !this.presale().tokenOur.isReady())
      return -1;
    if(this.presale().totalClaimable == 0)
      return 100;
    return Math.floor(this.presale().totalClaimed / (this.presale().totalClaimable / 100));
  }

  progressPercent() : number{
    if(this.presale().tokenTheirMax == -1 || this.presale().totalDeposited == -1 || !this.presale().tokenTheir.isReady())
      return -1;
    return Math.floor(this.presale().totalDeposited / (this.presale().tokenTheirMax / 100));
  }

  presaleContractAddress(): string{
    return Config.main.addressPresale;
  }

  calcPrice(el: any, el2: any, coef: number){
    let number = Number.parseFloat(el.value.replace(",", "."));
    if(isNaN(number)){
      el2.value = "";
    } else {
      el2.value = number * coef;
    }
  }

  ourToken(): string{
    if(this.presale().tokenOur.name == "" || this.presale().tokenOur.symbol == "")
      return "";
    return this.presale().tokenOur.name + " (" + this.presale().tokenOur.symbol + ")"
  }

  theirToken(): string{
    if(this.presale().tokenTheir.name == "" || this.presale().tokenTheir.symbol == "")
      return "";
    return this.presale().tokenTheir.name + " (" + this.presale().tokenTheir.symbol + ")"
  }

  walletAddress(): string{
    return AppState.selectedAddress == null ? "" : AppState.selectedAddress;
  }

  walletSigned(): boolean{
    const ret = AppState.walletSigned();
    if(!ret){
      this.presaleApproved = null;
      this.presaleApprovedWaiting = this.presaleApproveWaiting = false;
    }
    return ret;
  }

  checkClaimedResult: number = -1;
  checkClaimedLoading: boolean = false;
  checkClaimedError: string | null = null;
  checkClaimed(address: string){
    if(this.checkClaimedLoading)
      return;
    this.checkClaimedResult = -1;
    if(!ethers.utils.isAddress(address)){
      this.checkClaimedError = "Error: Wrong wallet address";
      return;
    }
    this.checkClaimedLoading = true;
    this.checkClaimedError = null;
    this.web3ModalSevice.presaleClaimed(address).then(value => {
      this.checkClaimedResult = AppState.presale.tokenOur.reduceDecimals(value);;
      this.checkClaimedLoading = false;
    }, reject => {
      this.checkClaimedError = reject;
      this.checkClaimedLoading = false;
    });
  }

  checkClaimableResult: number = -1;
  checkClaimableLoading: boolean = false;
  checkClaimableError: string | null = null;
  checkClaimable(address: string){
    if(this.checkClaimedLoading)
      return;
    this.checkClaimableResult = -1;
    if(!ethers.utils.isAddress(address)){
      this.checkClaimableError = "Error: Wrong wallet address";
      return;
    }
    this.checkClaimableLoading = true; 
    this.checkClaimableError = null;
    this.web3ModalSevice.presaleClaimeable(address).then(value => {
      this.checkClaimableResult = AppState.presale.tokenOur.reduceDecimals(value);
      this.checkClaimableLoading = false;
    }, reject => {
      this.checkClaimableError = reject;
      this.checkClaimableLoading = false;
    });
  }

  checkDepositedResult: number = -1;
  checkDepositedLoading: boolean = false;
  checkDepositedError: string | null = null;
  checkDeposited(address: string){
    if(this.checkDepositedLoading)
      return;
    this.checkDepositedResult = -1;
    if(!ethers.utils.isAddress(address)){
      this.checkDepositedError = "Error: Wrong wallet address";
      return;
    }
    this.checkDepositedLoading = true;
    this.checkDepositedError = null;
    this.web3ModalSevice.presaleDeposited(address).then(value => {
      this.checkDepositedResult = value;
    }).catch(reson => {
      this.checkDepositedError = reson;
    }).finally(() => {
      this.checkDepositedLoading = false;
    });
  }

  timestampToTimeout(timestamp: number) : number{
    return AppState.timestampToTimeout(timestamp);
  }

  timeOutConfig(timestamp: number): CountdownConfig {
    return AppState.timeOutConfig(timestamp);
  }
  
  depositTransactionHash: string | undefined;
  depositError: string | null = null;
  depositLoading: boolean = false;
  deposit(amountString: string){
    const amount = Number(amountString);
    this.depositLoading = true;
    this.depositTransactionHash = undefined;
    this.depositError = null;
    this.web3ModalSevice.presaleDeposit(amount).then(tr => {
      this.depositLoading = false;
      this.depositTransactionHash = tr.hash;
    }, (reject) => {
      if(reject.data != null && reject.data.message != null)
        this.depositError = reject.data.message;
      else if(reject.message != null)
        this.depositError = reject.message;
      else
        this.depositError = reject;
      this.depositLoading = false;
    })
  }

  claimTransactionHash: string | undefined;
  claimError: string | null = null;
  claimLoading: boolean = false;
  claim(){
    this.claimLoading = true;
    this.claimTransactionHash = undefined;
    this.claimError = null;
    this.web3ModalSevice.presaleClaim().then(tr => {
      this.claimLoading = false;
      this.claimTransactionHash = tr.hash;
    }, (reject) => {
      if(reject.data != null && reject.data.message != null)
        this.claimError = reject.data.message;
      else if(reject.message)
        this.claimError = reject.message;
      else
        this.claimError = reject;
      this.claimLoading = false;
    })
  }

  presaleApprovedWaiting: boolean = false;
  presaleApproved: boolean | null = null;
  ispresaleApproved() : boolean | null{
    if(!this.walletSigned())
      return false;
    if(this.presaleApproved == null && !this.presaleApprovedWaiting){
      this.presaleApprovedWaiting = true;
      AppState.presale.tokenTheir.isApproved(Config.main.addressPresale).then(value => {
        this.presaleApproved = value;
        this.presaleApprovedWaiting = false;
        this.presaleApproveWaiting = false;
      });
    }
    return this.presaleApproved;
  }

  presaleApproveWaiting: boolean = false;
  presaleApprove(){
    if(this.presaleApproveWaiting)
      return;
    this.presaleApproveWaiting = true;
    AppState.presale.tokenTheir.approve(Config.main.addressPresale).then(value => {
      console.log(value);
      if(value == false) {
        this.presaleApproved = value;
        this.presaleApproveWaiting = false;
      } else {
        const t = value as ethers.Transaction;
        if(t.hash){
          this.depositTransactionHash = t.hash;
          this.web3ModalSevice.notLoggedProvider.waitForTransaction(this.depositTransactionHash).then(value => {
            this.presaleApprovedWaiting = false;
            this.presaleApproved = true;
            this.ispresaleApproved();
          });
        }
      }
    });
  }
}
