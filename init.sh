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
AWS_ACCOUNT_ID=$(jq -r '.AWS_ACCOUNT_ID' config.json)
CLI_PROFILE=$(jq -er '.CLI_PROFILE' config.json)
# Get jq return code set by the -e option
REGION=$(jq -r '.REGION' config.json)
WWW_BUCKET=$(jq -r '.WWW_BUCKET' config.json)
DDB_PRODUCT_SCHEME_TABLE=$(jq -r '.DDB_PRODUCT_SCHEME_TABLE' config.json)

if [[ $CLI_PROFILE != 0 ]]; then
  echo "Setting session CLI profile to $CLI_PROFILE"
  export AWS_PROFILE=$CLI_PROFILE
fi

# Create DynamoDB Tables
echo "Creating DynamoDB Table $DDB_PRODUCT_SCHEME_TABLE begin..."
aws dynamodb create-table --table-name $DDB_PRODUCT_SCHEME_TABLE \
    --attribute-definitions AttributeName=product_category_id,AttributeType=N \
    --key-schema AttributeName=product_category_id,KeyType=HASH \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region $REGION
echo "Creating DynamoDB Table $DDB_PRODUCT_SCHEME_TABLE end (creation still in progress)"

cd iam
if [ -d "edit" ]; then
  rm edit/*
else
  mkdir edit
fi

cp Policy_Trust_Lambda.json edit/Policy_Trust_Lambda.json

# Create IAM Roles for Lambda Function
for f in $(ls -1 trumpTwitter*); do
  role="${f%.*}"
  echo "Creating role $role from $f begin..."
  sed -e "s/<AWS_ACCOUNT_ID>/$AWS_ACCOUNT_ID/g" \
      -e "s/<REGION>/$REGION/g" \
      -e "s/<DDB_PRODUCT_SCHEME_TABLE>/$DDB_PRODUCT_SCHEME_TABLE/g" \
      $f > edit/$f
  trust="Policy_Trust_Lambda.json"
  aws iam create-role --role-name $role --assume-role-policy-document file://edit/$trust
  aws iam update-assume-role-policy --role-name $role --policy-document file://edit/$trust
  aws iam put-role-policy --role-name $role --policy-name $role --policy-document file://edit/$f
  echo "Creating role $role end"
done

cd ..

cd lambda
pwd

# Create Lambda Functions
for f in $(ls -1); do
  echo "Creating function $f begin..."
  cp ../config.json $f/
  cp -R ../node_modules/ $f/node_modules
  cd $f
  zip -r $f.zip index.js config.json node_modules/
  aws lambda create-function --function-name ${f} \
      --runtime nodejs6.10 \
      --role arn:aws:iam::"$AWS_ACCOUNT_ID":role/${f} \
      --handler index.handler \
      --zip-file fileb://${f}.zip \
      --region $REGION
  sleep 1 # To avoid errors
  cd ..
  echo "Creating function $f end"
done

cd ..

# ./deploy.sh
