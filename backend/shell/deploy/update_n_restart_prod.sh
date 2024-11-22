#!/bin/bash

#declare variables 
NEW_BRANCH="branch_$(date "+%y"_%m_%d__%H_%M_%S)" ;  # get current date to make new branch
SYMBOL=" ------> "  ; 
PROJECT_ROOT_PATH="/home/ubuntu/qd-backend"
URL="https://api.querydeck.io" 
# URL="http://localhost:3001/" 
LAST_HEAD_ID=$(git rev-parse HEAD)

# any future command that fails will exit the script
# set -e

echo "${SYMBOL} Current director"
pwd ;  

# echo "${SYMBOL}moving to project root path"
# cd $PROJECT_ROOT_PATH ; 

# # # create new branch  save changes 
# echo "${SYMBOL} saving current branch"
# git checkout master 
# git checkout -b    $NEW_BRANCH;
# git commit -am "saving  branch"
# git checkout master 




# sync  branch to last head of local repo and then pull ( to prevent merge conflict )
echo "${SYMBOL}Pulling updates"
git checkout prod 
git fetch origin prod
git reset --hard HEAD
git pull  origin prod



# #install npm packages
echo "${SYMBOL}Installing packages"
npm install


# start temporary server  and check status
echo "${SYMBOL} kill all previous server "
pm2 kill

echo "${SYMBOL} start temporary server"
PORT=4000 PROJECT_ENV=dev pm2 -f start server.js
echo "${SYMBOL} checking temporary server status..."
sleep 25
TEMP_URL="http://localhost:4000"
echo "${SYMBOL} requesting to : $TEMP_URL"  
RESPONSE_TEMP="$(curl -s -o /dev/null -w "%{http_code}" $TEMP_URL)"

echo "${SYMBOL} RESPONSE CODE :  $RESPONSE_TEMP"
 

if [   $RESPONSE_TEMP != "200"  ]; then
    echo "${SYMBOL} No Response from  temporary server" ;
    pm2 kill
    git reset --hard $LAST_HEAD_ID
    echo "${SYMBOL} Exiting!!!" ;
    exit 1
else
    echo "${SYMBOL}  temporary server running succesfully !!!" ;
    pm2 kill
fi





# stop the previous pm2
echo "${SYMBOL}stop the previous pm2!" 
sudo pm2 kill



# start server 
echo "${SYMBOL}starting  server " 
sudo pm2 -f start server.js



# check status code
echo "${SYMBOL} checking server status...."  
sleep 25
echo "${SYMBOL} requesting to : $URL"  
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $URL)
echo "-------- RESPONSE --------- "
echo "$RESPONSE"
if [   $RESPONSE != "200"  ]; then
    git reset --hard $LAST_HEAD_ID
    echo "${SYMBOL} No Response from  server" ; 
    echo "${SYMBOL} Exiting!!!" ;
    exit 1
else
    echo "${SYMBOL}Server is Running now !!!"
    echo "${SYMBOL}Deployment No: "
    cat  "config/deployment.txt"

fi




