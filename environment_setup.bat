@echo off

REM Set up backend environment
cd backend
copy .env.template .env
cd ..

REM Set up frontend environment
cd frontend
copy .env.template .env
cd ..

REM Set up worker/tiling_image environment
cd worker\tiling_image
copy .env.template .env
cd ..\..

REM Set up worker/clipping_image environment
cd worker\clipping_image
copy .env.template .env
cd ..\..

REM Set up worker/blending_image environment
cd worker\blending_image
copy .env.template .env
cd ..\..

echo .env files copied successfully.
