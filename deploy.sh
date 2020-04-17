#!/bin/bash

set -e

docker build -t dan-perron/webhook-server .
docker stop webhook-server || true
docker rm webhook-server || true
docker run  --name webhook-server --restart unless-stopped -p 3000:3000 -d dan-perron/webhook-server
sleep 5
curl -X POST -H "Content-Type: application/json" -d '{"text":"Deploy complete"}' http://localhost/webhooks/test
