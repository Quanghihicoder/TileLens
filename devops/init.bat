@echo off

REM Create ECR
aws ecr create-repository ^
  --repository-name tilelens/backend ^
  --region ap-southeast-2 ^
  --no-cli-pager

aws ecr create-repository ^
  --repository-name tilelens/transcriber ^
  --region ap-southeast-2 ^
  --no-cli-pager

REM Create Terraform bucket
aws s3 mb s3://tilelens-terraform --region ap-southeast-2

REM Create terraform lock table
aws dynamodb create-table ^
  --table-name tilelens-terraform-lock ^
  --attribute-definitions AttributeName=LockID,AttributeType=S ^
  --key-schema AttributeName=LockID,KeyType=HASH ^
  --billing-mode PAY_PER_REQUEST ^
  --region ap-southeast-2 ^
  --no-cli-pager