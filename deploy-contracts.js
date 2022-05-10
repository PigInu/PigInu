var fs = require('fs');
var file = fs.readFileSync('deploy.log', 'utf8');
var fil = file;
while (fil.indexOf('Contract: ') != -1) {
 fil = fil.substring(fil.indexOf('Contract: ') + 10);
 var name = fil.substring(0, fil.indexOf("\n"));
 var address = fil.substring(fil.indexOf('Contract address:'));
 address = address.substring(address.indexOf('0x'));
 address = address.substring(0, address.indexOf("\n"));
 console.log(name + ' ' + address);
}
var address = file.substring(file.indexOf("Pair address:") + 14 );
address = address.substring(0, address.indexOf("\n"));
console.log('LPToken ' + address);
