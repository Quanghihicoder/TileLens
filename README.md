# 🧩 TileLens – Zoom In, Stay Sharp

TileLens is a full-stack web app that lets you upload ultra-high-res images and view them seamlessly — no lag, no loss. It breaks down giant images into smart little tiles and serves them up as you zoom and pan.

Think Google Maps... but for your art, photos, or renders.

# 🌐 Live Demo

- App: http://3.105.210.13:5173/
- Feature Demo: https://youtu.be/NzGQVEXd5Ko
- Setup & Run Walkthrough: https://youtu.be/aLDVqkwxHoc

# 🚀 TL;DR - How to Run

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

# 📦 Stack Breakdown

## Frontend (Vite + React + Tailwind)

- Lazy loading tiles
- Smooth, accurate zooming (yes, I did the math)
- Dynamic tiling rectangles
- Handles image uploads, token auth, and renders only what’s needed
- Allow clipping image by user drawing shape

## Backend (Node + Express + Prisma + Mongo + MySQL)

- Auth with JWT – users only see their uploads
- Saves image uploads to /assets/images/{userId}/
- Pushes image jobs to BullMQ (Redis) for async tiling
- Uses MongoDB to track processing status + metadata
- MySQL is just for user accounts

## Worker (Node.js Standalone)

- Pulls image jobs from Redis queue
- Does the actual image tiling (takes 20+ sec for big ones)
- Saves tiles to /assets/tiles/{userId}/{imageId}/
- Shared volume between backend and worker = instant availability
- Updates Mongo with final width/height and marks as processing: false

# 🔁 System Flow

## Login

User Logs In -> Frontend Sends Username -> Backend Validates & Returns JWT

## Upload & Use

User Uploads Image -> Backend Saves Image & Pushes Job to Redis
-> Worker Picks Job from Queue -> Worker Tiles & Saves Image
-> Worker Updates Mongo Metadata -> Frontend Fetches & Displays Processed Tiles

# 🧪 Useful Docker Commands

List all running containers

`docker ps`

Enter backend container shell

`docker exec -it tilelens_backend_1 sh`

# 🧠 Why This Design?

- Tiling is heavy — offloaded to a dedicated worker
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
