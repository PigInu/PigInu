import { Pipe, PipeTransform } from '@angular/core';
import { NumberLocalePipe } from './numberLocale.pipe';

@Pipe({
  name: 'dateTimeLocale'
})
export class DateTimeLocalePipe implements PipeTransform {
  
  transform(value: number | string): any {
    const d = new Date(value);
    const l = NumberLocalePipe.getLocale();
    return d.toLocaleDateString(l,  { year: 'numeric', month: '2-digit', day: '2-digit'}) + " " + d.toLocaleTimeString(l);
  }

}
