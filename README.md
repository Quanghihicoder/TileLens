# 🧩 TileLens – Zoom In, Stay Sharp

TileLens is a full-stack web app that lets you upload ultra-high-res images and view them seamlessly — no lag, no loss. It breaks down giant images into smart little tiles and serves them up as you zoom and pan.

Think Google Maps... but for your art, photos, or renders.

Give me a ⭐️ if you like this project.

# 🌐 Live Demo

- App (available Mon-Fri, 9AM - 5PM AEST): https://tilelens.quangtechnologies.com
- YouTube Demo Web: https://www.youtube.com/watch?v=XTw7MDPwpAI
- YouTube Demo Mobile: https://www.youtube.com/watch?v=iKnnbLJBktw

# 🚀 TL;DR - How to Run Locally - A Single Container

## Pre-check

Free up these ports on your system:
3306 (MySQL), 6379 (Redis), 27017 (MongoDB), 8000 (Backend), 5173 (Frontend), 2181 (Zookeeper), 9092 (Kafka)

Make sure Docker is installed

## RUN

# 🚀 How to Run Locally (On Mac)

1. Run the script and follow the prompts

`./run.sh`

# 🚀 How to Run Locally (On Windows)

1. Run the script

`docker-compose up --build`

2. If you want to run the mobile version (you must run the first command before this)

On a new terminal

```
cd mobile
npm i
npm run android
```

# 🚀 How to Deploy - AWS

> ⚠️ **IMPORTANT:** On **Windows**, please run the command **as Administrator**.
> ⚠️ **IMPORTANT:** You may need to manually change globally unique service names like S3.

1. Add frontend .env.production

```
VITE_ENV=production
VITE_API_URL=https://api.tilelens.quangtechnologies.com/api
VITE_ASSETS_URL=https://assets.tilelens.quangtechnologies.com/assets
VITE_SOCKET_URL=https://api.tilelens.quangtechnologies.com
```

2. Add required terraform variables in devops/terraform.tfvars

3. Deploy the infrastructure

On Mac\Linux

```
cd devops
./init.sh
./deploy.sh
```

On Windows

```
cd devops
init.bat
deploy.bat
```

4. To cleanup the infrastructure

```
cd devops
./cleanup.sh
```

OR

```
cd devops
cleanup.bat
```

# Keywords

ReactJS, React Native, TailwindCSS, NodeJS, MongoDB, MySQL, Prisma, Redis, BullMQ, Socket.io,Kafka, Docker, Terraform, AWS

Route53, Lambda, SQS, S3 + CloudFront, ALB, ECS (EC2), ECS (Fargate),  RDS (MySQL), DynamoDB, MSK

GitHub Actions, CodePipeline, CodeBuild, CodeDeploy

# 📦 Stack Breakdown

## Frontend

- Lazy loading tiles
- Smooth, accurate zooming (yes, I did the math). Use translate3d(x, y, 0) to grid-display images.
- Dynamic tiling rectangles
- Handles image uploads, token auth, and renders only what’s needed
- Allow users to clip images by drawing shapes. All math, no library.
- Allow users to copy and paste images in an image.
- 3D box view with ThreeJS.
- Map locations with CesiumJS/ResiumJS.
- Mobile version with React Native

## Backend

- Auth with JWT – users only see their uploads
- Serves APIs
- Saves image uploads to /assets/images/{userId}/ or S3
- Pushes image jobs to BullMQ (Redis) or SQS for async tiling
- Uses MongoDB or DynamoDB to track processing status + metadata
- MySQL or RDS MySQL is just for user accounts
- Socket.io + Kafka allow streaming speak to control

## Worker (Node.js/Python Standalone or Lambda)

- Pulls image jobs from Redis or SQS queue
- Does the image tiling, clipping and blending
- Saves tiles to /assets/tiles/{userId}/{imageId}/ or S3
- Shared volume between backend and worker = instant availability
- Updates Mongo or DynamoDB with final width/height and marks as processing: false
- OpenAI Whisper base model for transcribe job

## Cloud Native AWS

- Standalone Node.js Workers -> AWS Lambda
- BullMQ (Redis) -> Amazon SQS
- Frontend -> S3 + CloudFront
- Assets Disk Storage -> S3 + CloudFront
- Backend -> ALB + ECS (EC2)
- MySQL -> Amazon RDS (MySQL)
- MongoDB -> Amazon DynamoDB
- Kafka -> MSK
- OpenAI Whisper model -> ECS (Fargate) 

![Infras](https://github.com/Quanghihicoder/TileLens/blob/master/sample_images/infras.png)

# 🔁 System Flow

## Login

User Logs In -> Frontend Sends Username -> Backend Validates & Returns JWT

## Upload & Use

User Uploads Image -> Backend Saves Image & Pushes Job to Tiling Queue
-> Tiling Worker Picks Job from the Tiling Queue -> Tiling Worker Tiles & Saves Image
-> Tiling Worker Updates Mongo Metadata -> Frontend Fetches & Displays Processed Tiles

## Clip Image

User Draw A Shape -> Call An API With (x,y) Points -> Init A Record In MongoDB -> Push To Clipping Queue
-> Clipping Worker Picks Job From The Clipping Queue -> Clipping Worker Clips And Saves Image -> Push To Tiling Queue
-> Same As Above

## Blend Image

User Copy An Image Id -> Paste The Image In An Image -> Call An API -> Init A Record In MongoDB -> Push To Blending Queue
-> Blending Worker Picks Job From The Blending Queue -> Blending Worker Blends And Saves Image -> Push To Tiling Queue
-> Same As Above

# 🧪 Useful Docker Commands

List all running containers

`docker ps`

Enter backend container shell

`docker exec -it tilelens-backend-1 sh`

`docker exec -it tilelens-mysql-1 mysql -u root -p`

# Final Words

TileLens is built for clarity, speed, and scale.
Upload massive images without massive lag. Zoom in like a boss.

Pull requests welcome. Break the pixels, not the code. 💥🧠
