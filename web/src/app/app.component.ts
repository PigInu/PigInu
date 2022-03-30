import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { interval } from 'rxjs';
import { AppState, StateToken } from 'src/appState';
import { Config } from 'src/config';
import { NumberLocalePipe } from 'src/pipe/numberLocale.pipe';
import { Web3ModalService } from 'src/services/web3-modal.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  title = 'airdrop';
  actualYear: string = "";
  activeMenu: boolean = false;
  activeSubmenu: boolean = false;
  isCopiedVisible: boolean = false;
  tokenPriceValue: number = -1;
  numberPipe: NumberLocalePipe;

  constructor(private router: Router, private web3ModalService: Web3ModalService, private titleService: Title){
    this.actualYear = new Date().getFullYear().toString();
    this.titleService.setTitle(this.projectName());
    this.numberPipe = new NumberLocalePipe();
  }
  ngOnInit(): void {
    interval(Config.main.updateInterval * 1000)
    .subscribe(() => {
      this.loadData();
    });
  }

  private loadData(){
    this.token().updateTotalSupply();
    this.token().updateBalance();
    this.token().updateBurned();
    this.tokenPriceValue = -2;
  }

  public routeName(){
    let name = this.router.url.replace("/", "-");
    if(name == "-")
      name = "-home";
    return "page" + name;
  }

  public projectName(): string{
    return Config.main.project;
  }

  public tokenName(): string{
    return AppState.token.name;
  }

  public mainMenu(){
    return Config.main.mainMenu;
  }

  public token(): StateToken{
    return AppState.token;
  }

  public buyTokenLink(): string{
    if(Config.main.mainMenu.length >= 2 && Config.main.mainMenu[1].items)
      return Config.main.mainMenu[1].items[0].href;
    return "";
  }

  public buyLiguidLink(): string{
    if(Config.main.mainMenu.length >= 2 && Config.main.mainMenu[1].items)
      return Config.main.mainMenu[1].items[1].href;
    return "";
  }

  public tokenPrice() : string{
    if(!this.token().isReady())
      return "-";
    if(this.token().totalSupply >= 0 && this.tokenPriceValue == -2)
    {
      this.tokenPriceValue = -1;
      this.token().updatePrice();
    }
    if(this.tokenPriceValue < 0 && this.token().price >= 0)
      this.tokenPriceValue = this.token().price;
    if(this.tokenPriceValue <= 0)
      return "-";
    return this.numberPipe.transform(this.tokenPriceValue);
  }

  public marketCap(){
    if(this.tokenPrice() == '-' || this.token().totalSupply <= 0 || this.token().burned <= 0)
      return "-";
    return this.numberPipe.transform(this.token().price * (this.token().totalSupply - this.token().burned) );
  }

  public goToHomepage(event: any){
    this.router.navigateByUrl("");
    event.preventDefault();
  }

  public mobileMenuVisible() : boolean{
    return AppState.mobileMenuVisible;
  }
  
  public addNetwork(){
    this.web3ModalService.addNetwork();
  }

  public switchNetwork(){
    this.web3ModalService.switchNetwork();
  }

  public toogleMobileMenuVisible(){
    AppState.mobileMenuVisible = !AppState.mobileMenuVisible;
  }
  
  walletConnected(): boolean{
    if(AppState.token.isReady() && AppState.token.totalSupply == -1)
      this.loadData();
    return AppState.walletConnected();
  }
//
  walletAddress(): string{
    return AppState.selectedAddress == null ? "" : AppState.selectedAddress;
  }

  walletAddressCut(): string{
    return AppState.selectedAddress == null ? "" : AppState.selectedAddress.substring(0, 7) + "..." + AppState.selectedAddress.substring( AppState.selectedAddress.length - 7) ;
  }

  connect(){
    this.web3ModalService.web3Modal();
  }

  disconnect(){
    this.web3ModalService.disconnect();
    location.href = location.href;
  }

  badChainId(): boolean{
    return AppState.badChainId();
  }

  toogleMenu(){
    this.activeMenu = !this.activeMenu;
  }

  toogleSubmenu(){
    this.activeSubmenu = !this.activeSubmenu;
  }

  toogleSubitems(event: MouseEvent){
    const el = event.target as HTMLElement;
    if(el.classList.contains("subitems-open"))
      el.classList.remove("subitems-open");
    else
      el.classList.add("subitems-open")
  }

  copyAddress(){
    const el = document.createElement('textarea');
    el.value = AppState.selectedAddress ? AppState.selectedAddress : "";
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    this.isCopiedVisible = true;
    const that = this;
    setTimeout(function(){
      that.isCopiedVisible = false;
    }, 1000);
  }
}
