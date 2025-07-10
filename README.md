# Livestream Overlay Management Application

A professional RTSP livestream application with custom overlay management, built with React and Node.js.

## Features

- **RTSP Video Streaming**: Stream from any RTSP source converted to HLS for web playback
- **Custom Overlays**: Add text, images, and logos with drag-and-drop positioning
- **Real-time Management**: Create, read, update, and delete overlays in real-time
- **Professional Interface**: Modern video player with volume, play/pause, and fullscreen controls
- **API-Driven**: Full REST API for overlay and settings management
- **FFmpeg Integration**: Automatic RTSP to HLS conversion for browser compatibility

## Tech Stack

- **Frontend**: React, Tailwind CSS, Lucide React
- **Backend**: Node.js, Express
- **Video**: RTSP → HLS conversion with HTML5 Video
- **Storage**: JSON file-based storage (easily replaceable with MongoDB)

## Prerequisites

- Node.js (v16 or higher)
- **MediaMTX (INCLUDED)** - Real-time media server for RTSP to HLS conversion
  - MediaMTX binary is included in the project
  - No additional installation required
  - Works in containerized environments

**IMPORTANT**: This application uses MediaMTX to convert RTSP streams to web-compatible HLS format. MediaMTX is a modern, lightweight alternative to FFmpeg that works well in containerized environments.

### Environment Compatibility

**✅ Fully Supported:**
- Local development machines
- VPS/Dedicated servers
- Docker containers
- Cloud instances (AWS EC2, Google Compute, etc.)
- GitHub Codespaces
- WebContainer environments

**MediaMTX provides better compatibility than FFmpeg in restricted environments.**
## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server with MediaMTX:
```bash
npm run dev-with-mediamtx
```

This will start:
- MediaMTX server (RTSP: 8554, HLS: 8888)
- Backend server (port 3001)
- Frontend server (port 5173)

**Alternative start options:**
- `npm run dev` - Start without MediaMTX (frontend + backend only)
- `npm run mediamtx` - Start MediaMTX server only

## API Documentation

### Base URL
```
http://localhost:3001/api
```

### Stream Endpoints

#### MediaMTX Integration

MediaMTX handles RTSP to HLS conversion automatically:

```json
{
  "rtspInput": "rtsp://your-camera:554/stream",
  "hlsOutput": "http://localhost:8888/stream/index.m3u8",
  "workflow": [
    "1. Send RTSP stream to MediaMTX: rtsp://localhost:8554/stream",
    "2. MediaMTX converts to HLS automatically",
    "3. Access HLS stream at: http://localhost:8888/stream/index.m3u8",
    "4. Frontend plays HLS stream using HLS.js"
  ]
}
```

**MediaMTX Ports:**
- RTSP Server: 8554
- HLS Server: 8888
- API: 9997
- Metrics: 9998

#### POST /stream/start
Start RTSP stream conversion
```json
{
  "method": "POST",
  "url": "/api/stream/start",
  "body": {
    "rtspUrl": "rtsp://localhost:8554/stream"
  },
  "response": {
    "message": "Stream started",
    "hlsUrl": "http://localhost:3001/hls/stream.m3u8",
    "mode": "production"
  }
}
```

#### POST /stream/stop
Stop RTSP stream conversion
```json
{
  "method": "POST",
  "url": "/api/stream/stop",
  "response": {
    "message": "Stream stopped"
  }
}
```

#### GET /stream/status
Get stream status
```json
{
  "method": "GET",
  "url": "/api/stream/status",
  "response": {
    "isRunning": true,
    "hlsAvailable": true,
    "hlsUrl": "http://localhost:3001/hls/stream.m3u8",
    "hasMediaMTX": true,
    "mode": "production"
  }
}
```
### Overlay Endpoints

#### GET /overlays
Get all overlays
```json
{
  "method": "GET",
  "url": "/api/overlays",
  "response": [
    {
      "id": "1234567890",
      "name": "Logo Overlay",
      "type": "logo",
      "content": "LIVE",
      "position": { "x": 10, "y": 10 },
      "size": { "width": 100, "height": 50 },
      "color": "#ffffff",
      "fontSize": 16,
      "opacity": 1,
      "rotation": 0,
      "visible": true,
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST /overlays
Create new overlay
```json
{
  "method": "POST",
  "url": "/api/overlays",
  "body": {
    "name": "My Overlay",
    "type": "text",
    "content": "Hello World",
    "position": { "x": 50, "y": 50 },
    "size": { "width": 200, "height": 100 },
    "color": "#ffffff",
    "fontSize": 24,
    "opacity": 1,
    "visible": true
  }
}
```

#### PUT /overlays/:id
Update overlay
```json
{
  "method": "PUT",
  "url": "/api/overlays/1234567890",
  "body": {
    "name": "Updated Overlay",
    "position": { "x": 60, "y": 40 }
  }
}
```

#### DELETE /overlays/:id
Delete overlay
```json
{
  "method": "DELETE",
  "url": "/api/overlays/1234567890"
}
```

### Settings Endpoints

#### GET /settings
Get current settings
```json
{
  "method": "GET",
  "url": "/api/settings",
  "response": {
    "rtspUrl": "rtsp://example.com/stream",
    "volume": 0.5,
    "autoplay": false,
    "quality": "auto",
    "bufferSize": 5,
    "reconnectAttempts": 3
  }
}
```

#### PUT /settings
Update settings
```json
{
  "method": "PUT",
  "url": "/api/settings",
  "body": {
    "rtspUrl": "rtsp://new-stream.com/live",
    "volume": 0.8,
    "autoplay": true
  }
}
```

## Usage Guide

### 1. Setting up RTSP Stream

1. Navigate to the Settings page
2. Enter your RTSP URL in the "RTSP Stream URL" field (e.g., `rtsp://localhost:8554/stream`)
3. Configure other playback settings as needed
4. Click "Save Settings"

**Note**: The application automatically converts RTSP streams to HLS format using MediaMTX for web browser compatibility.

**MediaMTX Integration**: RTSP streams cannot be played directly in web browsers. This application uses MediaMTX to convert RTSP to HLS (HTTP Live Streaming) format in real-time.

### 2. Managing Overlays

1. Go to the Overlay Manager page
2. Click "Create Overlay" to add a new overlay
3. Choose overlay type (Text, Image, or Logo)
4. Configure position, size, and appearance
5. Save the overlay

### 3. Watching Stream

1. Visit the Stream Player page
2. The RTSP stream will automatically start converting to HLS format via MediaMTX
3. Click play to start watching the livestream
4. Use the video controls for playback management
4. Overlays will appear automatically on the stream

### 4. Stream Conversion Process (MediaMTX)

The application uses MediaMTX to convert RTSP streams to HLS (HTTP Live Streaming) format:

1. **RTSP Input**: Receives video from RTSP source
2. **MediaMTX Processing**: Converts to H.264/AAC with HLS segmentation
3. **HLS Output**: Generates .m3u8 playlist and .ts segments
4. **Web Playback**: Uses HLS.js for browser compatibility

**MediaMTX Benefits**: More reliable than FFmpeg in containerized environments, easier configuration, and better performance for streaming applications.

### 5. Overlay Types

- **Text**: Custom text with font size, color, and positioning
- **Image**: External images loaded from URLs
- **Logo**: Simple text-based logos with background styling

### 6. Overlay Properties

- **Position**: X and Y coordinates as percentages
- **Size**: Width and height in pixels
- **Opacity**: Transparency level (0-1)
- **Rotation**: Rotation angle in degrees
- **Visibility**: Show/hide overlay

## Development

### File Structure
```
src/
├── components/
│   ├── Navigation.tsx
│   ├── OverlayEditor.tsx
│   └── OverlayRenderer.tsx
├── pages/
│   ├── LandingPage.tsx
│   ├── OverlayManager.tsx
│   ├── Settings.tsx
│   └── StreamPlayer.tsx
├── services/
│   └── api.js
└── App.tsx

server/
├── index.js
└── data.json
```

### Adding New Overlay Types

1. Update the overlay type options in `OverlayEditor.tsx`
2. Add rendering logic in `OverlayRenderer.tsx`
3. Update the API schema if needed

### Database Integration

To replace the JSON file storage with MongoDB:

1. Install MongoDB driver: `npm install mongodb`
2. Replace file operations in `server/index.js` with MongoDB operations
3. Update connection settings in environment variables

## Testing RTSP Streams

For testing purposes, you can use these public RTSP streams:

- `rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mp4`
- `rtsp://localhost:8554/test` (configured in MediaMTX for testing)

**MediaMTX Setup**: 
- MediaMTX will automatically handle RTSP to HLS conversion
- Public RTSP streams may not always be available
- For production use, configure your own RTSP source in MediaMTX

**Testing with MediaMTX**:
1. Start MediaMTX: `npm run mediamtx`
2. Send RTSP stream to: `rtsp://localhost:8554/your-stream-name`
3. Access HLS at: `http://localhost:8888/your-stream-name/index.m3u8`

## Deployment

1. Build the project: `npm run build`
2. Deploy the frontend build files to your web server
3. Deploy the backend server to your Node.js hosting service
4. Update API endpoints in the frontend if needed

## Support

For issues or questions:
1. Check the console for error messages
2. **Verify MediaMTX is running** (check port 8888 for HLS)
3. Verify RTSP stream URL is accessible
4. Ensure both frontend and backend servers are running
5. Check network connectivity and CORS settings
6. Monitor MediaMTX logs for stream conversion issues
7. Check if RTSP source supports the required codecs (H.264/AAC preferred)
8. Check MediaMTX API at http://localhost:9997 for stream status