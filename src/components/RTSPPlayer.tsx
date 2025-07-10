import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, AlertCircle, Wifi } from 'lucide-react';

interface RTSPPlayerProps {
  rtspUrl: string;
  volume: number;
  onVolumeChange: (volume: number) => void;
  autoplay?: boolean;
}

const RTSPPlayer: React.FC<RTSPPlayerProps> = ({ 
  rtspUrl, 
  volume, 
  onVolumeChange, 
  autoplay = false 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamMode, setStreamMode] = useState<'hls' | 'error'>('hls');

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (rtspUrl) {
      const hlsUrl = convertRTSPToMediaMTXHLS(rtspUrl);
      loadHLSStream(hlsUrl);
    }
    return () => cleanup();
  }, [rtspUrl]);

  const cleanup = () => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  };

  const convertRTSPToMediaMTXHLS = (rtspUrl: string): string => {
    // If it's already an HLS URL (.m3u8), use it directly
    if (rtspUrl.includes('.m3u8')) {
      return rtspUrl;
    }
    
    // Convert RTSP URL to MediaMTX HLS format
    if (rtspUrl.startsWith('rtsp://')) {
      // Extract stream path from RTSP URL
      // Example: rtsp://example.com:554/stream -> stream
      const urlParts = rtspUrl.split('/');
      const streamPath = urlParts[urlParts.length - 1] || 'stream';
      
      // MediaMTX typically serves HLS on port 8888 with path format
      // Adjust the host and port based on your MediaMTX configuration
      const rtspHost = rtspUrl.split('//')[1].split('/')[0].split(':')[0];
      
      // Default MediaMTX HLS endpoint format
      return `http://${rtspHost}:8888/${streamPath}/index.m3u8`;
    }
    
    // Fallback to original URL
    return rtspUrl;
  };

  const loadHLSStream = (hlsUrl: string) => {
    if (!videoRef.current) return;

    cleanup();
    setIsLoading(true);
    setError(null);
    setStreamMode('hls');

    console.log('Loading MediaMTX HLS stream:', hlsUrl);

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: false,
        lowLatencyMode: true,
        backBufferLength: 10,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        startLevel: -1,
        capLevelToPlayerSize: true,
        debug: false,
        // MediaMTX specific optimizations
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 5,
        liveDurationInfinity: true,
        highBufferWatchdogPeriod: 1
      });
      
      hlsRef.current = hls;
      
      hls.loadSource(hlsUrl);
      hls.attachMedia(videoRef.current);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('MediaMTX HLS manifest parsed successfully');
        setIsLoading(false);
        setError(null);
        if (autoplay) {
          videoRef.current?.play().catch(err => {
            console.log('Autoplay blocked:', err);
          });
        }
      });

      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        console.log('HLS media attached to MediaMTX stream');
      });

      hls.on(Hls.Events.FRAG_LOADED, () => {
        // Fragment loaded successfully
      });
      
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('MediaMTX HLS Error:', data);
        
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setError(`Network error loading MediaMTX HLS stream: ${data.details}. Check if MediaMTX is running and accessible at: ${hlsUrl}`);
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setError(`Media error in MediaMTX HLS stream: ${data.details}. Check RTSP source and MediaMTX configuration.`);
              break;
            default:
              setError(`Fatal MediaMTX HLS error: ${data.details}`);
              break;
          }
          setStreamMode('error');
          setIsLoading(false);
        } else {
          console.warn('Non-fatal MediaMTX HLS error:', data);
        }
      });
      
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS support
      console.log('Using Safari native HLS support for MediaMTX');
      videoRef.current.src = hlsUrl;
      
      videoRef.current.addEventListener('error', (e) => {
        console.error('Safari video error with MediaMTX:', e);
        setError(`Error loading MediaMTX HLS stream in Safari: ${hlsUrl}`);
        setStreamMode('error');
        setIsLoading(false);
      });
      
      videoRef.current.addEventListener('loadeddata', () => {
        console.log('Safari MediaMTX HLS stream loaded');
        setIsLoading(false);
        setError(null);
        if (autoplay) {
          videoRef.current?.play().catch(err => {
            console.log('Autoplay blocked:', err);
          });
        }
      });

      videoRef.current.addEventListener('loadstart', () => {
        setIsLoading(true);
      });
      
    } else {
      setError('HLS not supported in this browser. Please use a modern browser with HLS support.');
      setStreamMode('error');
      setIsLoading(false);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(err => {
          console.error('Play error:', err);
          setError('Failed to play stream. User interaction may be required.');
        });
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    onVolumeChange(newVolume);
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const retryStream = () => {
    setError(null);
    if (rtspUrl) {
      const hlsUrl = convertRTSPToMediaMTXHLS(rtspUrl);
      loadHLSStream(hlsUrl);
    }
  };

  const getStatusColor = () => {
    switch (streamMode) {
      case 'hls': return 'text-green-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusText = () => {
    switch (streamMode) {
      case 'hls': return 'MediaMTX HLS Live';
      case 'error': return 'Stream Error';
      default: return 'Connecting...';
    }
  };

  const currentHLSUrl = rtspUrl ? convertRTSPToMediaMTXHLS(rtspUrl) : '';

  return (
    <div className="relative">
      {/* Stream Status Banner */}
      <div className="bg-green-600 text-white px-4 py-2 text-sm flex items-center">
        <Wifi className="w-4 h-4 mr-2" />
        <strong>RTSP → MediaMTX → HLS:</strong> {rtspUrl}
      </div>
      
      <div className="aspect-video bg-black relative">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted={isMuted}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onLoadStart={() => setIsLoading(true)}
          onCanPlay={() => setIsLoading(false)}
          crossOrigin="anonymous"
          playsInline
        />
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-lg font-semibold">Loading MediaMTX HLS stream...</p>
              <div className="text-sm text-gray-400 mt-2 space-y-1">
                <p>RTSP Source: {rtspUrl}</p>
                <p>HLS Endpoint: {currentHLSUrl}</p>
                <p>Connecting via MediaMTX...</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Error Overlay */}
        {error && streamMode === 'error' && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
            <div className="text-center text-white max-w-md px-4">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">MediaMTX HLS Stream Error</h3>
              <div className="mb-4 text-sm space-y-2">
                <p>{error}</p>
                <div className="text-xs text-gray-400 bg-gray-800 p-2 rounded">
                  <p><strong>MediaMTX Troubleshooting:</strong></p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Check if MediaMTX is running</li>
                    <li>Verify RTSP source is accessible</li>
                    <li>Ensure MediaMTX HLS is enabled</li>
                    <li>Check MediaMTX configuration file</li>
                    <li>Verify port 8888 is accessible</li>
                  </ul>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-gray-400">RTSP: {rtspUrl}</p>
                <p className="text-xs text-gray-400">HLS: {currentHLSUrl}</p>
              </div>
              <button
                onClick={retryStream}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors mt-4"
              >
                Retry MediaMTX Stream
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Video Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={togglePlay}
              disabled={isLoading || (error && streamMode === 'error')}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition-colors disabled:opacity-50"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMute}
                className="text-white hover:text-blue-400 transition-colors"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-24 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className={`text-xs ${getStatusColor()}`}>
              {getStatusText()}
            </div>
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-blue-400 transition-colors"
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RTSPPlayer;