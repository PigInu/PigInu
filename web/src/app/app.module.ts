import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CountdownModule } from 'ngx-countdown';
import { AddTokenToWalletComponent } from 'src/component/add-token-to-wallet/add-token-to-wallet.component';
import { LoaderComponent } from 'src/component/loader/loader.component';
import { PoolElementComponent } from 'src/component/pool-element/pool-element.component';
import { ProgressComponent } from 'src/component/progress/progress.component';
import { OnlyNumbers } from 'src/directive/only-numbers.directive';
import { AirdropComponent } from 'src/pages/airdrop/airdrop.component';
import { HomepageComponent } from 'src/pages/homepage/homepage.component';
import { PoolComponent } from 'src/pages/pool/pool.component';
import { PresaleComponent } from 'src/pages/presale/presale.component';
import { WhitepaperComponent } from 'src/pages/whitepaper/whitepaper.component';
import { AddressLinkPipe } from 'src/pipe/addressLink.pipe';
import { BigNumberLocalePipe } from 'src/pipe/BigNumberLocale.pipe';
import { DateTimeLocalePipe } from 'src/pipe/dateTimeLocale.pipe';
import { NumberLocalePipe } from 'src/pipe/numberLocale.pipe';
import { TransactionLinkPipe } from 'src/pipe/transactionLink.pipe';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgxGoogleAnalyticsModule, NgxGoogleAnalyticsRouterModule } from 'ngx-google-analytics';
import { Config } from 'src/config';

@NgModule({
  declarations: [	
    AppComponent,
    HomepageComponent,
    AirdropComponent,
    PresaleComponent,
    PoolComponent,
    WhitepaperComponent,
    LoaderComponent,
    AddTokenToWalletComponent,
    ProgressComponent,
    PoolElementComponent,
    TransactionLinkPipe,
    AddressLinkPipe,
    NumberLocalePipe,
    DateTimeLocalePipe,
    BigNumberLocalePipe,
    OnlyNumbers
   ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CountdownModule,
    NgxGoogleAnalyticsModule.forRoot(Config.main.analyticsId),
    NgxGoogleAnalyticsRouterModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
