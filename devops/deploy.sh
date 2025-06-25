#!/bin/bash

# Authenticate to ECR
aws ecr get-login-password --region ap-southeast-2 | \
  docker login --username AWS --password-stdin 058264550947.dkr.ecr.ap-southeast-2.amazonaws.com

# Build Docker image ( Very important if build from Mac M chip)
docker buildx build --platform linux/amd64 -f ../backend/Dockerfile.prod -t tilelens ../backend --load

# Tag and push
docker tag tilelens:latest 058264550947.dkr.ecr.ap-southeast-2.amazonaws.com/tilelens:latest
docker push 058264550947.dkr.ecr.ap-southeast-2.amazonaws.com/tilelens:latest

# Build and Zip Lambdas
cd ../worker/clipping_image/
./build.sh

cd ../tiling_image/
./build.sh

cd ../../frontend
npm run build

cd ../devops
terraform init
terraform apply -auto-approve

aws s3 sync ../frontend/dist s3://tilelens-frontend --delete
