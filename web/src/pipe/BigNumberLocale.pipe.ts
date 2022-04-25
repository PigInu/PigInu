import { Pipe, PipeTransform } from '@angular/core';
import { BigNumber, ethers } from 'ethers';
import { NumberLocalePipe } from './numberLocale.pipe';

@Pipe({
  name: 'BigNumberLocale'
})
export class BigNumberLocalePipe implements PipeTransform {

  transform(value: BigNumber | null, decimals: number, format: boolean = true, reduceFormatDecimals: boolean = true): string {
    //let number = value.div(BigNumber.from(decimalsReducer));
    //console.log(value.mod(BigNumber.from(decimalsReducer)).toBigInt());
    //console.log(value.mod(BigNumber.from(decimalsReducer)).toBigInt() / BigInt(10));
    //"0123123400001231".replace(/0+$/, "") // "400"

    if(value == null)
      return "";

    const decimalsReducer = BigInt(10 ** decimals);
    const numberBigInt = value.div(BigNumber.from(decimalsReducer)).toBigInt();
    let decimalsBigInt = value.mod(BigNumber.from(decimalsReducer)).toBigInt();
    if(!format){
      if(decimalsBigInt == BigInt(0))
        return numberBigInt.toString();
      return numberBigInt.toString() + "." + this.formatDecimals(decimalsBigInt, decimals);
    }

    //return ethers.utils.formatEther(value);

    let numberString = numberBigInt.toLocaleString(NumberLocalePipe.getLocale());
    if(decimalsBigInt == BigInt(0))
      return numberString;

    const decimalPoint = (1.1).toLocaleString(NumberLocalePipe.getLocale()).replace(/1/g , "")
    let decimalString = (reduceFormatDecimals && numberBigInt > 0)  ? (Math.round(Number(decimalsBigInt.toString().substring(0, decimals)) / (10 ** (decimals - 2)))).toString().replace(/0+$/, "") : this.formatDecimals(decimalsBigInt, decimals);
    if(decimalString == "")
      return numberString;
    return numberString + decimalPoint + decimalString;
  }

  private formatDecimals(value: BigInt , decimals: number )
  {
    const input = value.toString();
    return (Math.pow(10, decimals - input.length) + input).substring(1).replace(/0+$/, "");
  }

}
