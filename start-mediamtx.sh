#!/bin/bash

# Start MediaMTX server
echo "Starting MediaMTX server..."
echo "RTSP server will be available on port 8554"
echo "HLS server will be available on port 8888"
echo "API will be available on port 9997"
echo "Metrics will be available on port 9998"
echo ""
echo "To stream RTSP to HLS:"
echo "1. Send RTSP stream to: rtsp://localhost:8554/your-stream-name"
echo "2. Access HLS at: http://localhost:8888/your-stream-name/index.m3u8"
echo ""
echo "Press Ctrl+C to stop MediaMTX"
echo ""

# Make sure MediaMTX is executable
chmod +x ./mediamtx

# Start MediaMTX with configuration
./mediamtx mediamtx.yml