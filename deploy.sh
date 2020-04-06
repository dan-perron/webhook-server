docker build -t dan-perron/webhook-server .
docker stop webhook-server
docker rm webhook-server
docker run  --name webhook-server --restart unless-stopped -p 3000:3000 -d dan-perron/webhook-server