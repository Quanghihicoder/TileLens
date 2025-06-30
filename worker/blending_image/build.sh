#!/bin/bash
set -e

echo "Building Lambda in Docker..."

# Clean up old builds
rm -rf ../../devops/modules/compute/lambda/build/blending_lambda.zip

# Run the Docker container to build
docker buildx build --platform linux/amd64 -f Dockerfile.lambda-build -t blending-lambda-builder --load .

# Create output folder
mkdir -p ../../devops/modules/compute/lambda/build/blending_lambda

# Copy build artifacts from container
CONTAINER_ID=$(docker create blending-lambda-builder)
docker cp $CONTAINER_ID:/var/task/dist ../../devops/modules/compute/lambda/build/blending_lambda
docker rm $CONTAINER_ID

# Zip it
cd ../../devops/modules/compute/lambda/build/blending_lambda/dist/
zip -r ../../blending_lambda.zip .

cd ../../
rm -rf ./blending_lambda

echo "Build complete: blending_lambda.zip"