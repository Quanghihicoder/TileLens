#!/bin/bash
set -e

echo "Building Lambda in Docker..."

# Clean up old builds
rm -rf ../../devops/build/clipping_lambda.zip

# Run the Docker container to build
docker buildx build --platform linux/amd64 -f Dockerfile.lambda-build -t clipping-lambda-builder --load .

# Create output folder
mkdir -p ../../devops/build/clipping_lambda

# Copy build artifacts from container
CONTAINER_ID=$(docker create clipping-lambda-builder)
docker cp $CONTAINER_ID:/var/task/dist ../../devops/build/clipping_lambda
docker rm $CONTAINER_ID

# Zip it
cd ../../devops/build/clipping_lambda/dist/
zip -r ../../clipping_lambda.zip .

cd ../../
rm -rf ./clipping_lambda

echo "Build complete: clipping_lambda.zip"