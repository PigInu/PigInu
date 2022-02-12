var fs = require('fs');
var file = fs.readFileSync('deploy.log', 'utf8');
while (file.indexOf('Contract: ') != -1) {
 file = file.substring(file.indexOf('Contract: ') + 10);
 var name = file.substring(0, file.indexOf("\n"));
 var address = file.substring(file.indexOf('Contract address:'));
 address = address.substring(address.indexOf('0x'));
 address = address.substring(0, address.indexOf("\n"));
 console.log(name + ' ' + address);
}
