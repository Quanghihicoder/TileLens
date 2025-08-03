@echo off
setlocal enabledelayedexpansion
echo Building Lambda in Docker...

REM Clean up old builds
if exist ..\..\devops\modules\compute\lambda\build\blending_lambda.zip (
    del ..\..\devops\modules\compute\lambda\build\blending_lambda.zip
)

REM Run the Docker container to build
docker buildx build --platform linux/amd64 -f Dockerfile.lambda-build -t tilelens-blending-lambda-builder --load .

REM Create output folder
if not exist ..\..\devops\modules\compute\lambda\build\blending_lambda (
    mkdir ..\..\devops\modules\compute\lambda\build\blending_lambda
)

REM Copy build artifacts from container
for /f "tokens=*" %%i in ('docker create tilelens-blending-lambda-builder') do set CONTAINER_ID=%%i
docker cp !CONTAINER_ID!:/var/task/dist ..\..\devops\modules\compute\lambda\build\blending_lambda
docker rm !CONTAINER_ID!

REM Zip it
cd ..\..\devops\modules\compute\lambda\build\blending_lambda\dist
powershell Compress-Archive -Path * -DestinationPath ..\..\blending_lambda.zip -Force

cd ..\..\
rmdir /s /q blending_lambda

echo Build complete: blending_lambda.zip
endlocal