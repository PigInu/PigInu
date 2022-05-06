import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-start-contract',
  templateUrl: './start-contract.component.html',
  styleUrls: ['./start-contract.component.scss']
})
export class StartContractComponent implements OnInit {
  @Input() contractService: any | null = null;
  @Input() functionName: string = "start";
  contractLoading: boolean = false;
  contractSuccess: string = "";
  contractError: string = "";

  constructor() { }

  ngOnInit() {

  }

  start(delayBlock: string, timeBlock: string){
    if(this.contractService != null)
    {
      this.contractService[this.functionName](Number(delayBlock), Number(timeBlock)).then((value: any) => {
        console.info(value);
      }).catch((value: any) => {
        console.error(value);
      });
    }
  } 

}
