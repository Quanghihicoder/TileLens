FROM node:22

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Create .env from template
RUN cp .env.template .env

# Expose application port
EXPOSE 8000

# Default command
CMD ["npm", "start"]