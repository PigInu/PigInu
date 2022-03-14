import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'numberLocale'
})
export class NumberLocalePipe implements PipeTransform {
  constructor() {}
  transform(value: string | Number | null): any {
    let maximumDigits = 2;
    if(value && typeof value === "number" && value < 1){
      maximumDigits = 0;
      let tmp = value;
      while(tmp < 9){
        tmp = tmp * 10;
        maximumDigits += 1;
      }
      const digits = (10 ** maximumDigits);
      value = Math.round(value * digits) / digits;
    }
    return value?.toLocaleString(NumberLocalePipe.getLocale(),  { maximumFractionDigits: maximumDigits });
  }

  public static getLocale(): string
  {
    const browserLocales = navigator.languages === undefined ? [navigator.language] : navigator.languages;
    if (!browserLocales)
      return "en-US";
    return browserLocales[0];
  }
}
