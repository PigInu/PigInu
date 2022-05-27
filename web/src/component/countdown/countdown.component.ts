import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { AppState } from 'src/appState';

@Component({
  selector: 'countdown',
  templateUrl: './countdown.component.html',
  styleUrls: ['./countdown.component.scss']
})
export class CountdownComponent implements OnInit, OnDestroy {
  @Input() config: number | null = null;
  private interval: any | null = null;
  days: number = 0;
  hours: number = 0;
  minutes: number = 0;
  seconds: number = 0;

  constructor() { }
  ngOnInit() {
    this.interval = setInterval(() =>{
      let seconds = Math.floor(this.config == null ? 0 : this.config - (Date.now() / 1000) + AppState.reduceActualTimestamp);

      this.days = Math.floor(seconds / (3600*24));
      this.hours = Math.floor(seconds % (3600*24) / 3600);
      this.minutes = Math.floor(seconds % 3600 / 60);
      this.seconds = Math.floor(seconds % 60);

    }, 1000);
  }

  ngOnDestroy(): void {
    if(this.interval != null)
      clearInterval(this.interval);
  }

}
