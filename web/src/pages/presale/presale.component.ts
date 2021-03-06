import { Component, OnDestroy, OnInit } from '@angular/core';
import { BigNumber, ethers } from 'ethers';
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
  claimPeriodOver: boolean | null = null;
  startPeriodOver: boolean | null = null;
  depositPeriodOver: boolean | null = null;
  presaleContractOwner: string | null = null;
  devWallets: Array<{address: string, percent: number}> = [];
  devWalletsCount: number = 3;
  
  subscription: any;
  periodInterval: any;
  public presale: IPresale;

  constructor(public web3ModalSevice: Web3ModalService) {
    this.presale = AppState.getPresale();
  }
  ngOnDestroy(): void {
    this.initialized = false;
  }

  ngOnInit() {
    this.initialized = true;
    for(let i = 0; i < this.devWalletsCount;i ++)
      this.loadDevWallets(i);
    this.web3ModalSevice.presaleOwner().then(value => {
      this.presaleContractOwner = value.toHexString();
    });

    this.subscription = interval(Config.main.updateInterval * 1000)
    .pipe(takeWhile(() => this.initialized))
    .subscribe(() => {
      //console.log("load: " + Date.now());
      this.web3ModalSevice.loadPresaleData();
    });
    this.periodInterval = interval(250)
    .pipe(takeWhile(() => (this.initialized) && !(this.claimPeriodOver == true && this.startPeriodOver == true && this.depositPeriodOver == true)))
    .subscribe(() => {
      if(this.presale.startBlock > 0){
        if(this.presale.claimTimeOut > 0 && AppState.presale.claimTimeOutIsReal)
          this.claimPeriodOver = AppState.timestampToTimeout(this.presale.claimTimeOut) <= 0;
        if(this.presale.startTime > 0 && AppState.presale.startTimeIsReal)
          this.startPeriodOver = AppState.timestampToTimeout(this.presale.startTime) <= 0;
        if(this.presale.depositTimeOut > 0 && AppState.presale.depositTimeOutIsReal)
          this.depositPeriodOver = AppState.timestampToTimeout(this.presale.depositTimeOut) <= 0;
      }
    });
  }

  loadDevWallets(input: number){
    this.web3ModalSevice.presaleDevWallets(input).then(value => {
      if(value.length  > 1){  
        this.devWallets.push({
          address: value[0].toHexString(),
          percent: value[1].toNumber() / 100
        });
      }
    });
  }

  startTransactionHash: string = "";
  startTransactionError: string = "";
  start(delayBlock: string, depositBlock: string, claimBlock: string){
    this.startTransactionError = this.startTransactionHash = "";
      this.web3ModalSevice.presaleStart(Number(delayBlock), Number(depositBlock), Number(claimBlock)).then((value: any) => {
        this.startTransactionHash = value.hash;
      }).catch((value: any) => {
        this.startTransactionError = value.data.message;
      });
  } 

  isStartButtonVisible(): boolean{
    if(this.presaleContractOwner != null && 
      AppState.selectedAddress?.toLocaleLowerCase() == this.presaleContractOwner && 
      this.presale.startBlock == 0
    )
      return true;
    return false;
  }

  claimablePercent() : number{
    if(this.presale.totalClaimable == -1 || this.presale.totalClaimed == -1 || !this.presale.tokenOur.isReady())
      return -1;
    if(this.presale.totalClaimed == 0)
      return 100;
    return Math.floor(this.presale.totalClaimable / (this.presale.totalClaimed / 100));
  }

  progressPercent() : number{
    if(this.presale.tokenTheirMax == -1 || this.presale.totalDeposited == -1 || !this.presale.tokenTheir.isReady())
      return -1;
    if(this.presale.tokenTheirMax == 0)
      return 100;
    return Math.floor(this.presale.totalDeposited / (this.presale.tokenTheirMax / 100));
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
    if(this.presale.tokenOur.name == "" || this.presale.tokenOur.symbol == "")
      return "";
    return this.presale.tokenOur.name + " (" + this.presale.tokenOur.symbol + ")"
  }

  theirToken(): string{
    if(this.presale.tokenTheir.name == "" || this.presale.tokenTheir.symbol == "")
      return "";
    return this.presale.tokenTheir.name + " (" + this.presale.tokenTheir.symbol + ")"
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

  checkClaimedResult:  BigNumber | null = null;
  checkClaimedLoading: boolean = false;
  checkClaimedError: string | null = null;
  checkClaimed(address: string){
    if(this.checkClaimedLoading)
      return;
    this.checkClaimedResult = null;
    if(!ethers.utils.isAddress(address)){
      this.checkClaimedError = "Error: Wrong wallet address";
      return;
    }
    this.checkClaimedLoading = true;
    this.checkClaimedError = null;
    this.web3ModalSevice.presaleClaimed(address).then(value => {
      this.checkClaimedResult = value;
      this.checkClaimedLoading = false;
    }, reject => {
      this.checkClaimedError = reject;
      this.checkClaimedLoading = false;
    });
  }

  checkClaimableResult: BigNumber | null = null;
  checkClaimableLoading: boolean = false;
  checkClaimableError: string | null = null;
  checkClaimable(address: string){
    if(this.checkClaimedLoading)
      return;
    this.checkClaimableResult = null;
    if(!ethers.utils.isAddress(address)){
      this.checkClaimableError = "Error: Wrong wallet address";
      return;
    }
    this.checkClaimableLoading = true; 
    this.checkClaimableError = null;
    this.web3ModalSevice.presaleClaimeable(address).then(value => {
      this.checkClaimableResult = value
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

  timeOutConfig(timestamp: number) {
    return AppState.timeOutConfig(timestamp);
  }
  
  depositTransactionHash: string | undefined = "";
  depositError: string | null = null;
  depositLoading: boolean = false;
  deposit(amountString: string){
    this.depositLoading = true;
    this.depositTransactionHash = undefined;
    this.depositError = null;
    this.web3ModalSevice.presaleDeposit(amountString).then(tr => {
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
