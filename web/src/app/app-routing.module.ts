import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AirdropComponent } from 'src/pages/airdrop/airdrop.component';
import { HomepageComponent } from 'src/pages/homepage/homepage.component';
import { PoolComponent } from 'src/pages/pool/pool.component';
import { PresaleComponent } from 'src/pages/presale/presale.component';
import { WhitepaperComponent } from 'src/pages/whitepaper/whitepaper.component';

const routes: Routes = [
  { path: '', component: HomepageComponent },
  { path: 'airdrop', component: AirdropComponent},
  { path: 'presale', component: PresaleComponent},
  { path: 'whitepaper', component: WhitepaperComponent},
  { path: 'pool', component: PoolComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
