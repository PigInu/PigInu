import { Pipe, PipeTransform } from '@angular/core';
import { Config } from 'src/config';

@Pipe({
  name: 'transactionLink'
})
export class TransactionLinkPipe implements PipeTransform {
  transform(hash: string, args?: any): any {
    return Config.main.explorer + "tx/" + hash;
  }
}
