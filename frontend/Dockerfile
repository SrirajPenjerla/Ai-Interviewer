# frontend/Dockerfile
FROM node:20.16.0-alpine

WORKDIR /app
COPY . .
RUN npm install && npm run build 


EXPOSE 3000
CMD ["npm", "start"] 