#!/bin/bash

# Set up backend environment
cd backend
cp .env.template .env
cd ..

# Set up frontend environment
cd frontend
cp .env.template .env
cd ..

# Set up worker/tiling_image environment
cd worker/tiling_image
cp .env.template .env
cd ../../

# Set up worker/clipping_image environment
cd worker/clipping_image
cp .env.template .env
cd ../../

echo ".env files copied successfully."