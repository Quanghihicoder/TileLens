@echo off
setlocal enabledelayedexpansion
echo Building Lambda in Docker...

REM Clean up old builds
if exist ..\..\devops\modules\compute\lambda\build\msk_topic_creator_lambda.zip (
    del ..\..\devops\modules\compute\lambda\build\msk_topic_creator_lambda.zip
)

REM Run the Docker container to build
docker buildx build --platform linux/amd64 -f Dockerfile.lambda-build -t tilelens-msk-topic-creator-lambda-builder --load .

REM Create output folder
if not exist ..\..\devops\modules\compute\lambda\build\msk_topic_creator_lambda (
    mkdir ..\..\devops\modules\compute\lambda\build\msk_topic_creator_lambda
)

REM Copy build artifacts from container
for /f "tokens=*" %%i in ('docker create tilelens-msk-topic-creator-lambda-builder') do set CONTAINER_ID=%%i
docker cp !CONTAINER_ID!:/var/task ..\..\devops\modules\compute\lambda\build\msk_topic_creator_lambda
docker rm !CONTAINER_ID!

REM Zip it
cd ..\..\devops\modules\compute\lambda\build\msk_topic_creator_lambda\task\
powershell Compress-Archive -Path * -DestinationPath ..\..\msk_topic_creator_lambda.zip -Force

cd ..\..\
rmdir /s /q msk_topic_creator_lambda

echo Build complete: msk_topic_creator_lambda.zip
endlocal