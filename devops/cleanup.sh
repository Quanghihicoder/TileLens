#!/bin/bash

# Safety destroy
./destroy.sh

# Delete terraform state bucket
aws s3 rb s3://tilelens-terraform --force --region ap-southeast-2

# Delete terraform lock table
aws dynamodb delete-table \
  --table-name tilelens-terraform-lock \
  --region ap-southeast-2 \
  --no-cli-pager