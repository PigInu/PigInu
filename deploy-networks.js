var fs = require('fs');
var file = fs.readFileSync('hardhat.config.js', 'utf8');
file = file.substr(file.indexOf('networks: {') + 11);
file = file.substr(0, file.indexOf('etherscan: {'));
var arr = file.toString().split('\n');
var result = '';
for (var i = 0; i < arr.length; i++) {
 if (arr[i].includes('{')) {
  if (!arr[i].includes('accounts:')) {
   arr[i] = arr[i].substr(0, arr[i].indexOf(':'));
   arr[i] = arr[i].trim();
   result += arr[i] + ' ';
  }
 }
}
result = result.trim();
console.log(result);
