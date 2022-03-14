import { Component, Input, OnInit } from '@angular/core';
import { AppState, StateToken } from 'src/appState';

@Component({
  selector: 'app-add-token-to-wallet',
  templateUrl: './add-token-to-wallet.component.html',
  styleUrls: ['./add-token-to-wallet.component.scss']
})
export class AddTokenToWalletComponent implements OnInit {

  @Input() token!: StateToken;
  
  constructor() { }

  ngOnInit() {

  }

  addToWalket(){
    this.token.addToWallet();
  }

  walletConnected(): boolean{
    return AppState.walletConnected() && this.token.isReady();
  }

}
