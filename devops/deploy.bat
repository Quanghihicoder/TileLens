@echo off

REM Authenticate to ECR
aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin 058264550947.dkr.ecr.ap-southeast-2.amazonaws.com

REM Build Docker image (Very important if build from Mac M chip)
docker buildx build --platform linux/amd64 -f ..\backend\Dockerfile.prod -t tilelens/backend ..\backend --load
docker tag tilelens/backend:latest 058264550947.dkr.ecr.ap-southeast-2.amazonaws.com/tilelens/backend:latest
docker push 058264550947.dkr.ecr.ap-southeast-2.amazonaws.com/tilelens/backend:latest

docker buildx build --platform linux/amd64 -f ../worker/transcriber/Dockerfile -t tilelens/transcriber ../worker/transcriber --load
docker tag tilelens/transcriber:latest 058264550947.dkr.ecr.ap-southeast-2.amazonaws.com/tilelens/transcriber:latest
docker push 058264550947.dkr.ecr.ap-southeast-2.amazonaws.com/tilelens/transcriber:latest

cd ..\worker\msk_topic_creator\
call build.bat

cd ..\clipping_image\
call build.bat

cd ..\tiling_image\
call build.bat

cd ..\blending_image\
call build.bat

cd ..\..\frontend
call npm install --no-fund --no-audit
call npm run build

cd ..\devops
terraform init
terraform apply -auto-approve

aws s3 sync ..\frontend\dist s3://tilelens-frontend --delete