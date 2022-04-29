import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { BigNumber, ethers } from 'ethers';
import { interval, Subscription } from 'rxjs';
import { takeWhile } from 'rxjs/operators';
import { AppState } from 'src/appState';
import { Config } from 'src/config';
import { BigNumberLocalePipe } from 'src/pipe/BigNumberLocale.pipe';
import { NumberLocalePipe } from 'src/pipe/numberLocale.pipe';
import { AddressPoolData, PoolService, PoolState } from 'src/services/pool.service';
import { Web3ModalService } from 'src/services/web3-modal.service';

@Component({
  selector: 'app-pool-element',
  templateUrl: './pool-element.component.html',
  styleUrls: ['./pool-element.component.scss']
})
export class PoolElementComponent implements OnInit, OnDestroy {
  @Input() pool!: PoolState;
  @Input() contractAddress!: string;
  @Output() transactionHash = new EventEmitter<string>();
  @Output() transactionError = new EventEmitter<string>();

  private isApproved: boolean | null = null;
  private initialized: boolean = false;
  pendingTokens: BigNumber | null = null;
  addressPoolDataLoading: number = 0;
  private addressPoolData: AddressPoolData | null = null;
  private multiplier: number = -1;
  approveTransactionHash: string = "";
  approveWaiting: boolean = false;
  subscription: Subscription | null = null;
  tokenPriceValue: number = -1;
  tokenPriceValueLoaded: boolean | null = false;
  numberPipe: NumberLocalePipe;
  bigNumberPipe: BigNumberLocalePipe;

  constructor(private web3ModalSevice: Web3ModalService, private poolService: PoolService) {
    this.numberPipe = new NumberLocalePipe();
    this.bigNumberPipe = new BigNumberLocalePipe();
  }

  ngOnDestroy(): void {
    this.initialized = false;
  }

  ngOnInit() {
    this.initialized = true;
    this.subscription = interval(Config.main.poolUpdateInterval * 1000)
    .pipe(takeWhile(() => this.initialized))
    .subscribe(() => {
      this.refreshData();
    });
    this.refreshData();
    this.pool.tokenDeposit.updateTotalSupply();
    this.tokenPriceValueLoaded = null;
  }

  
  getAPR(totalAllocPoint: number, blockTime: number, tokensPerBlock: number, tokenPrice: number, poolAllocPoint: number, totalValue: number, days: number) {
    if(typeof days == "undefined")
      days = 365;
    var poolWeight = poolAllocPoint / totalAllocPoint;
    var blocksPerYear = this.getBlocksPerDays(days, blockTime);
    var tokenRewardPerBlock = this.toEth(tokensPerBlock) * poolWeight;
    var tokenRewardPerYear = blocksPerYear * tokenRewardPerBlock;
    var apr = (tokenPrice * tokenRewardPerYear / totalValue) * 100;
    return apr;
  }

  toEth(tokens: number){
    return tokens;
  }

  getBlocksPerDays(days: number, blockTime: number) {
    return (60 * 60 * 24 * days) / blockTime;
   }

  walletSigned(): boolean{
    return AppState.walletSigned();
  }

  getMultiplier(): string{
    //if(!this.pool.tokenDeposit.isReady() || !this.pool.tokenEarn.isReady())
    //  return "";
    return "";
    if(this.multiplier == -1){
      this.multiplier = -2;
      this.poolService.getMultiplier(this.pool.tokenEarn.address, this.pool.tokenDeposit.address).then(val => {
        //console.log(val.toString());
        //this.multiplier = val.toNumber();
      });
    }
    if(this.multiplier < 0)
      return "";
    return this.multiplier.toLocaleString();
  }
  
  public tokenPrice() : string{
    if(!this.pool.tokenDeposit.isReady())
      return "-";
    if(this.pool.tokenDeposit.totalSupply >= 0 && this.tokenPriceValueLoaded == null)
    {
      this.tokenPriceValueLoaded = false;
      this.pool.tokenDeposit.updatePrice();
    }
    if(this.tokenPriceValueLoaded == false && this.pool.tokenDeposit.price >= 0){
      this.tokenPriceValue = this.pool.tokenDeposit.price;
      this.tokenPriceValueLoaded = true;
    }
    if(this.tokenPriceValue <= 0)
      return "-";
    return this.numberPipe.transform(this.tokenPriceValue);
  }

  refreshData(){
    this.addressPoolDataLoading = -1;
    this.getAddressPoolData();
    this.pool.pendingTokens().then(val => {
      this.pendingTokens = val;
    });
  }

  getAddressPoolData() : AddressPoolData | null{
    if(this.isApproved != true)
      return null;
    if(this.addressPoolDataLoading == -1){
      this.addressPoolDataLoading = -2;
      const that = this;
      this.pool.tokenDeposit.updateBalance();
      this.pool.addressPoolData().then(value => {
        if(value != null){
          that.addressPoolData = value;
          this.tokenPriceValueLoaded = null;
          this.addressPoolDataLoading = 0;
        }
      })
    }
    return this.addressPoolData; 
  }

  share(): number{
    if(this.getAddressPoolData() == null || this.pool.tokenDeposit.balance < 0 || this.amount() <= 0)
      return 0;
    return this.amount() / this.pool.tokenDeposit.balance * 100;
  }

  amount(): number{
    if(this.getAddressPoolData() == null)
      return 0;
    return this.pool.tokenDeposit.reduceDecimals(this.getAddressPoolData()?.amount as ethers.BigNumber);
  }

  getBigNumberValue(value: BigNumber | null, decimals: number){
    return this.bigNumberPipe.transform(value, decimals, false);
  }

  amountBigNumber(): BigNumber | null{
    const ret = this.getAddressPoolData()?.amount;
    return ret ? ret : null;
  }

  rewardDebt(): number{
    if(this.getAddressPoolData() == null)
      return 0;
    return this.pool.tokenDeposit.reduceDecimals(this.getAddressPoolData()?.rewardDebt as ethers.BigNumber);
  }

  isTokenDepositApproved() : boolean | null{
    if(this.isApproved == null && !this.approveWaiting && this.pool.tokenDeposit.isReady()){
      this.approveWaiting = true;
      this.pool.tokenDeposit.isApproved(this.contractAddress).then(val => {
        this.isApproved = val;
        this.approveWaiting = false;
      });
    }
    return this.isApproved;
  }

  approve(){
    if(this.approveWaiting)
      return;
    this.approveWaiting = true;
    this.pool.tokenDeposit.approve(this.contractAddress).then(value => {
      if(value == false) {
        this.isApproved = value;
        this.approveWaiting = false;
      } else {
        const t = value as ethers.Transaction;
        if(t.hash){
          this.approveTransactionHash = t.hash;
          this.transactionHash.emit(t.hash);
          this.web3ModalSevice.notLoggedProvider.waitForTransaction(this.approveTransactionHash).then(value => {
            this.approveWaiting = false;
            this.isApproved = true;
          });
        }
      }
    });
  }

  toogleDepositModal(reloadBalance: boolean = false){
    if(reloadBalance)
      this.pool.tokenDeposit.updateBalance();
    this.depositModal = !this.depositModal;
  }

  getNumberValue(value: string) : number{
    return Number(value);
  }

  depositModal: boolean = false;
  depositTransactionHash: string | undefined;
  depositError: string | null = null;
  depositLoading: boolean = false;
  deposit(amountString: string){
    const amount = Number(amountString);
    if(amount < 0)
      return;
    this.depositLoading = true;
    this.depositTransactionHash = undefined;
    this.depositError = null;
    this.transactionError.emit("");
    this.pool.deposit(amountString).then(tr => {
      this.depositLoading = false;
      this.depositTransactionHash = tr.hash;
      this.transactionHash.emit(tr.hash);
      this.depositModal = false;
    }, (reject) => {
      if(reject.data != null && reject.data.message != null)
        this.depositError = reject.data.message;
      else if(reject.message != null)
        this.depositError = reject.message;
      else
        this.depositError = reject;
      this.transactionError.emit(this.depositError?.toString());
      this.depositLoading = false;
    })
  }
  withdrawModal: boolean = false;
  withdrawTransactionHash: string | undefined;
  withdrawError: string | null = null;
  withdrawLoading: boolean = false;

  toogleWithdrawModal(){
    this.withdrawModal = !this.withdrawModal;
  }

  compound(){
    this.deposit(this.bigNumberPipe.transform(this.pendingTokens, this.pool.tokenDeposit.decimals));
  }

  hasPendingTokens(): boolean{
    if(this.pendingTokens == null || this.pendingTokens == BigNumber.from(0))
      return false;
    return true;
  }

  pendingTokensUsd() : Number | null
  {
    if(!this.pendingTokens || !this.tokenPriceValueLoaded || !this.pool.tokenEarn.isReady())
      return null;
    const pendingTokens = Number(this.bigNumberPipe.transform(this.pendingTokens, this.pool.tokenEarn.decimals, false));
    return pendingTokens * this.tokenPriceValue;
  }

  harvest(){
    this.deposit('0');
  }

  withdraw(amountString: string){
    const amount = Number(amountString);
    if(amount <= 0)
      return;
    this.withdrawLoading = true;
    this.withdrawTransactionHash = undefined;
    this.withdrawError = null;
    this.transactionError.emit("");
    this.withdrawModal = false;
    this.pool.withdraw(amountString).then(tr => {
      this.withdrawLoading = false;
      this.withdrawTransactionHash = tr.hash;
      this.transactionHash.emit(tr.hash);
    }, (reject) => {
      if(reject.data != null && reject.data.message != null)
        this.withdrawError = reject.data.message;
      else if(reject.message != null)
        this.withdrawError = reject.message;
      else
        this.withdrawError = reject;
      this.transactionError.emit(this.withdrawError?.toString());
      this.withdrawLoading = false;
    })
  }
}
