#!/bin/bash

LOG=deploy.log
WEB=/data/www/airdrop.piginu.com/
DEPLOY_SCRIPT=scripts/deploy.js
NETWORKS=`node deploy-networks.js`
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
sw=false
for i in "${!ARRAY[@]}"
 do
  if [ $sw = false ]; then
   NAME=${ARRAY[$i]}
   ADDR=${ARRAY[$i+1]}
   echo 'Change address of '$NAME' contract in web config (Y/N, default: N):'
   read CHANGE
   if [ "$CHANGE" = 'Y' ] || [ "$CHANGE" = 'y'  ]; then
    sed -i '/address'$NAME'/c\        address'$NAME': '\'$ADDR\'',' ./web/src/config.ts
   fi
   sw=true
  else
   sw=false
  fi
 done

#echo 'Run web build script? (Y/N, default: N):'
#read BUILD
#if [ "$BUILD" = 'Y' ] || [ "$BUILD" = 'y'  ]; then
# cd web
# ./build.sh "$WEB"
# cd ..
#fi
