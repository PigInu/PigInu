import { Component, Input, OnInit } from '@angular/core';
import { ethers } from 'ethers';
import { AppState } from 'src/appState';
import { AddressPoolData, PoolService, PoolState } from 'src/services/pool.service';
import { Web3ModalService } from 'src/services/web3-modal.service';

@Component({
  selector: 'app-pool-element',
  templateUrl: './pool-element.component.html',
  styleUrls: ['./pool-element.component.scss']
})
export class PoolElementComponent implements OnInit {
  @Input() pool!: PoolState;
  @Input() contractAddress!: string;

  private isApproved: boolean | null = null;
  private pendingTokens: number = -1;
  private addressPoolData: AddressPoolData | number = -1;
  approveTransactionHash: string= "";
  approveWaiting: boolean = false;

  constructor(private web3ModalSevice: Web3ModalService, private poolService: PoolService) { }

  ngOnInit() {

  }

  walletSigned(): boolean{
    return AppState.walletSigned();
  }

  getPendingTokens() : number {
    if(this.pendingTokens == -1)
    {
      this.pendingTokens = -2;
      this.pool.pendingTokens().then(val => {
        this.pendingTokens = val;
      });
    }
    return this.pendingTokens;
  }

  getAddressPoolData() : AddressPoolData | null{
    if(this.isApproved != true)
      return null;
    if(this.addressPoolData == -1){
      this.addressPoolData  = -2;
      const that = this;
      this.pool.addressPoolData().then(value => {
        if(value != null)
          that.addressPoolData = value;
      })
    }
    if(this.addressPoolData < 0)
      return null;
    return this.addressPoolData as AddressPoolData; 
  }

  amount(): number{
    if(this.getAddressPoolData() == null)
      return 0;
    return this.pool.tokenDeposit.reduceDecimals(this.getAddressPoolData()?.amount as ethers.BigNumber);
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
          this.web3ModalSevice.notLoggedProvider.waitForTransaction(this.approveTransactionHash).then(value => {
            this.approveWaiting = false;
            this.isApproved = true;
          });
        }
      }
    });
  }

  depositTransactionHash: string | undefined;
  depositError: string | null = null;
  depositLoading: boolean = false;
  deposit(amountString: string){
    const amount = Number(amountString);
    this.depositLoading = true;
    this.depositTransactionHash = undefined;
    this.depositError = null;
    this.pool.deposit(amount).then(tr => {
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

  withdrawTransactionHash: string | undefined;
  withdrawError: string | null = null;
  withdrawLoading: boolean = false;
  withdraw(amountString: string){
    const amount = Number(amountString);
    this.withdrawLoading = true;
    this.withdrawTransactionHash = undefined;
    this.withdrawError = null;
    this.pool.withdraw(amount).then(tr => {
      this.withdrawLoading = false;
      this.withdrawTransactionHash = tr.hash;
    }, (reject) => {
      if(reject.data != null && reject.data.message != null)
        this.withdrawError = reject.data.message;
      else if(reject.message != null)
        this.withdrawError = reject.message;
      else
        this.withdrawError = reject;
      this.withdrawLoading = false;
    })
  }
}
