#!/bin/bash

LOG=deploy.log
WEB=/data/www/piginu.com/
DEPLOY_SCRIPT=scripts/deploy.testnet.js
NETWORKS=`node deploy-networks.js`
echo ''
echo '--------------'
echo 'Deploy script:'
echo '--------------'
echo ''
echo '1. scripts/deploy.testnet.js'
echo '2. scripts/deploy.mainnet.js'
echo ''
echo 'Select the deploy script (default: [1]):'
read DEPLOY_CHOICE
if [ "$DEPLOY_CHOICE" = '' ]; then
 DEPLOY_CHOICE=1
fi
if [ "$NET" = '1' ]; then
 DEPLOY_SCRIPT=scripts/deploy.testnet.js
fi
if [ "$NET" = '2' ]; then
 DEPLOY_SCRIPT=scripts/deploy.mainnet.js
fi
echo ''
echo '---------------------------'
echo 'List of available networks:'
echo '---------------------------'
echo ''
ARRAY=($NETWORKS)
for i in "${!ARRAY[@]}"
do
 echo [$((i + 1))] - ${ARRAY[$i]}
done
echo ''
echo 'Select the network where would you like to deploy your contracts (default: [1]):'
read NET
echo ''
if [ "$NET" = '' ]; then
 NET=1
fi
NETWORK=${ARRAY[$((NET - 1))]}
if [ "$NETWORK" = '' ] || [ "$((NET - 1))" = -1 ]; then
 echo 'Wrong network selected.'
 echo ''
 exit 0
fi
echo 'Deploying on:' $NETWORK '...'
echo ''
npx hardhat run --network $NETWORK $DEPLOY_SCRIPT 2>&1 | tee $LOG
./verify.sh $NETWORK
rm -f ./verify.sh

CONTRACTS=`node deploy-contracts.js`
ARRAY=($CONTRACTS)
CONFIGPATH='./web/src/config.ts'
sw=false
for i in "${!ARRAY[@]}"
 do
  if [ $sw = false ]; then
   NAME=${ARRAY[$i]}
   ADDR=${ARRAY[$i+1]}
   echo 'Change address of '$NAME' contract in web config (Y/N, default: N):'
   read CHANGE
   if [ "$CHANGE" = 'Y' ] || [ "$CHANGE" = 'y'  ]; then
    sed -i '/address'$NAME'/c\        address'$NAME': '\'$ADDR\'',' $CONFIGPATH
    if [ "$NAME" = 'Token' ]; then
     LN=$(($(grep -n "flag: 'token'" $CONFIGPATH | cut -f1 -d":")+1))
     sed -i "$((LN))s/.*/                address: '$ADDR',/g" $CONFIGPATH
    fi
    if [ "$NAME" = 'USDToken' ]; then
     LN=$(($(grep -n "flag: 'usdtoken'" $CONFIGPATH | cut -f1 -d":")+1))
     sed -i "$((LN))s/.*/                address: '$ADDR',/g" $CONFIGPATH
    fi
    if [ "$NAME" = 'LPToken' ]; then
     LN=$(($(grep -n "flag: 'lptoken'" $CONFIGPATH | cut -f1 -d":")+1))
     sed -i "$((LN))s/.*/                address: '$ADDR',/g" $CONFIGPATH
     LNA=$(($LN+1))
     LPA=''
     LPB=''
     for j in "${!ARRAY[@]}"
     do
      if [ ${ARRAY[$j]} = 'Token' ]; then
       LPA=${ARRAY[$j+1]}
      fi
      if [ ${ARRAY[$j]} = 'USDToken' ]; then
       LPB=${ARRAY[$j+1]}
      fi
     done
     sed -i "$((LNA))s/.*/                lpAdresses: ['$LPA', '$LPB'],/g" $CONFIGPATH
    fi
   fi
   sw=true
  else
   sw=false
  fi
 done

echo 'Run web build script? (Y/N, default: N):'
read BUILD
if [ "$BUILD" = 'Y' ] || [ "$BUILD" = 'y'  ]; then
 cd web
 ./build.sh "$WEB"
 cd ..
fi
