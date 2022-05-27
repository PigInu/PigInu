import { Pipe, PipeTransform } from '@angular/core';
import { BigNumber, ethers } from 'ethers';
import { Settings } from 'http2';
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
    //return ethers.utils.formatEther(value);
    
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
    
    let decimalString = this.formatDecimals(decimalsBigInt, decimals);
    if(reduceFormatDecimals && numberBigInt > BigInt(0))
      decimalString = decimalString.substring(0, 3);
    if(decimalString == "" || decimalString == "000")
      return numberString;
    const decimalPoint = (1.1).toLocaleString(NumberLocalePipe.getLocale()).replace(/1/g , "")
    return numberString + decimalPoint + decimalString;
  }

  private formatDecimals(value: BigInt , decimals: number )
  {
    const input = value.toString();
    return (Math.pow(10, decimals - input.length) + input).substring(1).replace(/0+$/, "");
  }

  public static getBigNumberFromString(value: string, decimal: number): BigNumber{
    let v = value.replace(",", ".").split(".");
    if(v.length == 1)
      v[1] = "";
    v[1] += "000000000000000000000000000000000000000000000000000000000000";
    const val = v[0] + v[1].substring(0, decimal);
    return BigNumber.from(val);
  }

}
