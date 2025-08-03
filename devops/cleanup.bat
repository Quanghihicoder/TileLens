@echo off

REM Safety destroy
@REM call destroy.bat

REM Delete ECR
aws ecr delete-repository ^
  --repository-name tilelens/backend ^
  --region ap-southeast-2 ^
  --force ^
  --no-cli-pager

aws ecr delete-repository ^
  --repository-name tilelens/transcriber ^
  --region ap-southeast-2 ^
  --force ^
  --no-cli-pager

REM Delete terraform state bucket
aws s3 rb s3://tilelens-terraform --force --region ap-southeast-2

REM Delete terraform lock table
aws dynamodb delete-table ^
  --table-name tilelens-terraform-lock ^
  --region ap-southeast-2 ^
  --no-cli-pager