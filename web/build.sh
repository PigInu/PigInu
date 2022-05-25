#!/bin/bash

if [ "$#" -ne 1 ]; then
 echo ""
 echo "----------------"
 echo "Web build script"
 echo "----------------"
 echo ""
 echo "This script commits changes and pushes it on GitHub."
 echo ""
 echo "Usage: $0 [PATH]"
 echo "Example: $0 /data/www/test/"
 echo ""
 echo "============================================"
 echo "CAUTION: Specified path is DELETED first !!!"
 echo "============================================"
 echo ""
 exit 1
fi

ng build --configuration production --build-optimizer
rm -rf $1*
mv ./dist/airdrop/* $1
rm -rf ./dist