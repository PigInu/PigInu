import { Component, OnInit } from '@angular/core';
import { StateToken } from 'src/appState';
import { Config } from 'src/config';
import { PoolService } from 'src/services/pool.service';

@Component({
  selector: 'app-pool',
  templateUrl: './pool.component.html',
  styleUrls: ['./pool.component.scss']
})
export class PoolComponent implements OnInit {

  constructor(private poolService: PoolService) { 

  }

  ngOnInit() {
  }

  getToken() : StateToken{
    return this.poolService.getState().token;
  }

  state(){
    return this.poolService.getState();
  }

  token(): string{
    if(!this.getToken().isReady())
      return "";
    return this.getToken().name + " (" + this.getToken().symbol + ")"
  }

  poolAddress(): string{
    return Config.main.addressPool;
  }
}
