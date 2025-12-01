#!/bin/bash

# Safety destroy
./destroy.sh

# Delete ECR
aws ecr delete-repository \
  --repository-name tilelens/backend \
  --region ap-southeast-2 \
  --force \
  --no-cli-pager \

aws ecr delete-repository \
  --repository-name tilelens/transcriber \
  --region ap-southeast-2 \
  --force \
  --no-cli-pager

# Delete terraform state bucket
aws s3 rb s3://tilelens-terraform --force --region ap-southeast-2

# Delete terraform lock table
aws dynamodb delete-table \
  --table-name tilelens-terraform-lock \
  --region ap-southeast-2 \
  --no-cli-pager