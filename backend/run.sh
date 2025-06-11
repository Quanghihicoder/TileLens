#!/bin/bash
docker run -it --init -p 8000:8000 --env-file .env node-app