import { Pipe, PipeTransform } from '@angular/core';
import { Config } from 'src/config';

@Pipe({
  name: 'addressLink'
})
export class AddressLinkPipe implements PipeTransform {

  transform(hash: string, args?: any): any {
    return Config.main.explorer + "address/" + hash;
  }

}
