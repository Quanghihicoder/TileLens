#!/bin/bash
set -e

echo "Building Lambda in Docker..."

# Clean up old builds
rm -rf ../../devops/build/tiling_lambda.zip

# Run the Docker container to build
docker buildx build --platform linux/amd64 -f Dockerfile.lambda-build -t tiling-lambda-builder --load .

# Create output folder
mkdir -p ../../devops/build/tiling_lambda

# Copy build artifacts from container
CONTAINER_ID=$(docker create tiling-lambda-builder)
docker cp $CONTAINER_ID:/var/task/dist ../../devops/build/tiling_lambda
docker rm $CONTAINER_ID

# Zip it
cd ../../devops/build/tiling_lambda/dist/
zip -r ../../tiling_lambda.zip .

cd ../../
rm -rf ./tiling_lambda

echo "Build complete: tiling_lambda.zip"
