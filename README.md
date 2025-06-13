# STILL WRITING README

Live Demo: http://3.25.191.70:5173/ 

YouTube Demo: https://youtu.be/NzGQVEXd5Ko

YouTube Install & Run Demo: https://youtu.be/aLDVqkwxHoc


## 1. Run ./environment_setup.sh

Make sure 

port 3306 mysql is free

port 6379 redis is free

port 27017 mongodb is free

port 8000 backend is free

port 5173 frontend is free

How to terminate running db on host machine
`sudo systemctl stop mysql`

## 2. docker-compose up --build

Wait until backend is up!

## 3. Clean

`docker-compose down -v`
