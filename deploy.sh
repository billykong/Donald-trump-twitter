#!/bin/bash

# Check if the AWS CLI is in the PATH
found=$(which aws)
if [ -z "$found" ]; then
  echo "Please install the AWS CLI under your PATH: http://aws.amazon.com/cli/"
  exit 1
fi

# Check if jq is in the PATH
found=$(which jq)
if [ -z "$found" ]; then
  echo "Please install jq under your PATH: http://stedolan.github.io/jq/"
  exit 1
fi

# Read other configuration from config.json
REGION=$(jq -r '.REGION' config.json)
CLI_PROFILE=$(jq -er '.CLI_PROFILE' config.json)
# Get jq return code set by the -e option
CLI_PROFILE_RC=$?
WWW_BUCKET=$(jq -r '.WWW_BUCKET' config.json)


#if a CLI Profile name is provided... use it.
if [[ $CLI_PROFILE_RC == 0 ]]; then
  echo "Setting session CLI profile to $CLI_PROFILE"
  export AWS_DEFAULT_PROFILE=$CLI_PROFILE
fi

echo "Updating Lambda functions..."

cd lambda

# Updating Lambda Functions
for f in $(ls -1); do
  echo $f
  pwd
  echo "Updating function $f begin..."
  cp ../config.json $f/
  cp -R ../node_modules/ $f/node_modules
  cd $f
  zip -r $f.zip index.js config.json node_modules/
  aws lambda update-function-code --function-name ${f} \
      --zip-file fileb://${f}.zip \
      --region $REGION
  cd ..
  echo "Updating function $f end"
done

cd ..



