# 🧩 TileLens – Zoom In, Stay Sharp

TileLens is a full-stack web app that lets you upload ultra-high-res images and view them seamlessly — no lag, no loss. It breaks down giant images into smart little tiles and serves them up as you zoom and pan.

Think Google Maps... but for your art, photos, or renders.

# 🌐 Live Demo

- App: https://tilelens.quangtechnologies.com
- Feature Demo: https://www.youtube.com/watch?v=ha4Pr96QHzM
- Setup & Run Walkthrough: https://youtu.be/aLDVqkwxHoc

# 🚀 TL;DR - How to Run Locally - A Single Container

## Pre-check 

Free up these ports on your system:
3306 (MySQL), 6379 (Redis), 27017 (MongoDB), 8000 (Backend), 5173 (Frontend)
Make sure Docker is installed

## RUN 

1. Run the setup script

`./environment_setup.sh`

2. Start the whole stack

`docker-compose up --build`

- Wait for backend to finish booting (localhost:8000)
- Open http://localhost:5173 to start uploading and zooming!

# 🚀 TL;DR - How to Run Cloud Native - AWS

1. Add frontend .env.production

```
VITE_ENV=production
VITE_API_URL=https://api.tilelens.quangtechnologies.com/api
VITE_ASSETS_URL=https://assets.tilelens.quangtechnologies.com/assets
```

2. Add required terraform variables in devops/terraform.tfvars

3. Deploy the infras

`cd devops`
`./deploy.sh`

# Keywords

ReactJS, Redux, TailwindCSS, NodeJS, MongoDB, MySQL, Prisma, Redis, BullMQ, Docker, Terraform, AWS, JWT token, queue FIFO processing

AWS Route53, Lambda, SQS, S3 + CloudFront, ALB, ECS (EC2), RDS (MySQL), DynamoDB

# For Propeller Recuiters

“Cooked” all the tech assessments and combined them all into a single project 😄

My application to the "history book" of the company 😄

## Breakdown of the tech assessments:

+ Frontend challenge: Built the UI
+ Backend challenge: Created the tiling worker
+ Infrastructure challenge: Implemented JWT authentication
+ QA challenge: Figured out that using translate3d(x, y, 0) to grid-display images is the optimal solution

## Bonus extras 😄:

1. Merged everything into one cohesive app
2. Integrated multiple databases: MySQL, NoSQL, and in-memory
3. Added FIFO queue processing
4. Containerized with Docker and deployed on AWS
5. Included advanced image clipping — nothing less than what a top-tier candidate would show
6. Cloud Native solution

# 📦 Stack Breakdown

## Frontend (Vite + React + Tailwind)

- Lazy loading tiles
- Smooth, accurate zooming (yes, I did the math). Use translate3d(x, y, 0) to grid-display images.
- Dynamic tiling rectangles
- Handles image uploads, token auth, and renders only what’s needed
- Allow users to clip images by drawing shapes. All math, no library.

## Backend (Node + Express + Prisma + Mongo + MySQL)

- Auth with JWT – users only see their uploads
- Saves image uploads to /assets/images/{userId}/
- Pushes image jobs to BullMQ (Redis) for async tiling
- Uses MongoDB to track processing status + metadata
- MySQL is just for user accounts

## Worker (Node.js Standalone)

- Pulls image jobs from Redis queue
- Does the actual image tiling and clipping (takes 20+ sec for big ones)
- Saves tiles to /assets/tiles/{userId}/{imageId}/
- Shared volume between backend and worker = instant availability
- Updates Mongo with final width/height and marks as processing: false

## Cloud Native AWS

- Standalone Node.js Workers -> AWS Lambda
- BullMQ (Redis) -> Amazon SQS
- Frontend -> S3 + CloudFront
- Assets Disk Storage -> S3 + CloudFront
- Backend -> ALB + ECS (EC2)
- MySQL -> Amazon RDS (MySQL)
- MongoDB -> Amazon DynamoDB

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

# 🧪 Useful Docker Commands

List all running containers

`docker ps`

Enter backend container shell

`docker exec -it tilelens-backend-1 sh`

`docker exec -it tilelens-mysql-1 mysql -u root -p`

# 🧠 Why This Design?

- Tiling and clipping is heavy — offloaded to a dedicated worker
- MongoDB is perfect for flexible image metadata (status, dimensions)
- Frontend & backend don’t touch raw image data — the worker owns that flow
- Shared volume keeps tile data immediately available post-processing

# 🧰 Tips & Tricks

Kill local MySQL if it’s already running:

`sudo systemctl stop mysql`

# Final Words

TileLens is built for clarity, speed, and scale.
Upload massive images without massive lag. Zoom in like a boss.

Pull requests welcome. Break the pixels, not the code. 💥🧠
