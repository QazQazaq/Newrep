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
    // Convert RTSP URL to HLS URL or use direct HLS URL
    const hlsUrl = convertToHLSUrl(rtspUrl);
    loadHLSStream(hlsUrl);
    return () => cleanup();
  }, [rtspUrl]);

  const cleanup = () => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  };

  const convertToHLSUrl = (url: string): string => {
    // If it's already an HLS URL (.m3u8), use it directly
    if (url.includes('.m3u8')) {
      return url;
    }
    
    // If it's an RTSP URL, assume there's an HLS endpoint available
    // You can modify this logic based on your streaming setup
    if (url.startsWith('rtsp://')) {
      // Option 1: Use your backend's HLS endpoint
      return `http://localhost:3001/hls/stream.m3u8`;
      
      // Option 2: If you have a direct RTSP to HLS service
      // return url.replace('rtsp://', 'http://').replace(':554', ':8080') + '/stream.m3u8';
    }
    
    // Default fallback
    return url;
  };

  const loadHLSStream = (hlsUrl: string) => {
    if (!videoRef.current) return;

    cleanup();
    setIsLoading(true);
    setError(null);
    setStreamMode('hls');

    console.log('Loading HLS stream:', hlsUrl);

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: false,
        lowLatencyMode: true,
        backBufferLength: 30,
        maxBufferLength: 60,
        maxMaxBufferLength: 120,
        startLevel: -1,
        capLevelToPlayerSize: true,
        debug: false
      });
      
      hlsRef.current = hls;
      
      hls.loadSource(hlsUrl);
      hls.attachMedia(videoRef.current);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS manifest parsed successfully');
        setIsLoading(false);
        setError(null);
        if (autoplay) {
          videoRef.current?.play().catch(err => {
            console.log('Autoplay blocked:', err);
          });
        }
      });

      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        console.log('HLS media attached');
      });

      hls.on(Hls.Events.FRAG_LOADED, () => {
        console.log('HLS fragment loaded');
      });
      
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS Error:', data);
        
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setError(`Network error loading HLS stream: ${data.details}. Check if the HLS URL is accessible: ${hlsUrl}`);
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setError(`Media error in HLS stream: ${data.details}. The stream format may not be supported.`);
              break;
            default:
              setError(`Fatal HLS error: ${data.details}`);
              break;
          }
          setStreamMode('error');
          setIsLoading(false);
        } else {
          console.warn('Non-fatal HLS error:', data);
        }
      });
      
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS support
      console.log('Using Safari native HLS support');
      videoRef.current.src = hlsUrl;
      
      videoRef.current.addEventListener('error', (e) => {
        console.error('Video error:', e);
        setError(`Error loading HLS stream in Safari: ${hlsUrl}`);
        setStreamMode('error');
        setIsLoading(false);
      });
      
      videoRef.current.addEventListener('loadeddata', () => {
        console.log('Safari HLS stream loaded');
        setIsLoading(false);
        setError(null);
        if (autoplay) {
          videoRef.current?.play().catch(err => {
            console.log('Autoplay blocked:', err);
          });
        }
      });

      videoRef.current.addEventListener('loadstart', () => {
        console.log('Safari HLS stream loading started');
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
    const hlsUrl = convertToHLSUrl(rtspUrl);
    loadHLSStream(hlsUrl);
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
      case 'hls': return 'HLS Live Stream';
      case 'error': return 'Stream Error';
      default: return 'Connecting...';
    }
  };

  return (
    <div className="relative">
      {/* Stream Status Banner */}
      <div className="bg-green-600 text-white px-4 py-2 text-sm flex items-center">
        <Wifi className="w-4 h-4 mr-2" />
        <strong>HLS Stream:</strong> {convertToHLSUrl(rtspUrl)}
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
              <p className="text-lg font-semibold">Loading HLS stream...</p>
              <div className="text-sm text-gray-400 mt-2 space-y-1">
                <p>Stream URL: {convertToHLSUrl(rtspUrl)}</p>
                <p>Connecting to HLS manifest...</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Error Overlay */}
        {error && streamMode === 'error' && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
            <div className="text-center text-white max-w-md px-4">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">HLS Stream Error</h3>
              <div className="mb-4 text-sm space-y-2">
                <p>{error}</p>
                <div className="text-xs text-gray-400 bg-gray-800 p-2 rounded">
                  <p><strong>Troubleshooting:</strong></p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Check if HLS URL is accessible</li>
                    <li>Verify network connectivity</li>
                    <li>Ensure HLS stream is active</li>
                    <li>Check CORS settings if cross-origin</li>
                  </ul>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-gray-400">HLS URL: {convertToHLSUrl(rtspUrl)}</p>
              </div>
              <button
                onClick={retryStream}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors mt-4"
              >
                Retry HLS Stream
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