var fs = require('fs');
var file = fs.readFileSync('hardhat.config.ts', 'utf8');
file = file.substring(file.indexOf('networks: {') + 11);
file = file.substring(0, file.indexOf('etherscan: {'));
var arr = file.toString().split('\n');
var result = '';
for (var i = 0; i < arr.length; i++) {
 if (arr[i].includes('{')) {
  if (!arr[i].includes('accounts:')) {
   arr[i] = arr[i].substring(0, arr[i].indexOf(':'));
   arr[i] = arr[i].trim();
   result += arr[i] + ' ';
  }
 }
}
result = result.trim();
console.log(result);
