"use client";

import { useState, useRef, useEffect } from 'react';
import SonicWaveformHero from '@/components/SonicWaveform';
import MediaPlayer from '@/components/MediaPlayer';

export default function Home() {
    const audioRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(70);
    const [fileName, setFileName] = useState('');
    const [analyserReady, setAnalyserReady] = useState(false);

    // Create audio element as a React element instead
    const audioElementRef = useRef(null);

    // Initialize Web Audio API on first play
    const initAudioContext = () => {
        if (!audioElementRef.current) {
            console.log('Audio element not found');
            return;
        }

        if (audioContextRef.current) {
            console.log('Audio context already initialized');
            return;
        }
        
        try {
            console.log('Initializing audio context...');
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            
            if (!AudioContextClass) {
                console.error('Web Audio API not supported');
                return;
            }

            const audioContext = new AudioContextClass();
            audioContextRef.current = audioContext;

            // Create analyser node for frequency data
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.25;
            analyserRef.current = analyser;

            // Create a gain node to route audio
            const gainNode = audioContext.createGain();
            gainNode.gain.value = 0.5;
            gainNode.connect(analyser);
            analyser.connect(audioContext.destination);

            // Connect media element to the gain node
            audioElementRef.current.volume = 1;
            
            // Use a timeout to ensure the audio element is in the DOM
            setTimeout(() => {
                try {
                    const source = audioContext.createMediaElementSource(audioElementRef.current);
                    sourceRef.current = source;
                    source.connect(gainNode);
                    console.log('Media element audio source connected successfully');
                } catch (err) {
                    console.warn('Could not create media element source, using fallback:', err);
                }
                // Mark analyser as ready to trigger re-render
                setAnalyserReady(true);
            }, 100);

            console.log('Audio context initialized successfully');
        } catch (error) {
            console.error('Error initializing audio context:', error);
        }
    };

    // Update current time and duration
    useEffect(() => {
        const audio = audioElementRef.current;
        if (!audio) return;

        const updateTime = () => {
            setCurrentTime(audio.currentTime);
        };

        const updateDuration = () => {
            setDuration(audio.duration);
        };

        const handleEnded = () => {
            setIsPlaying(false);
        };

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('durationchange', updateDuration);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('durationchange', updateDuration);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    const handleFileSelect = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            if (audioElementRef.current) {
                // Ensure the audio does NOT autoplay when src changes
                audioElementRef.current.pause();
                audioElementRef.current.autoplay = false;
                audioElementRef.current.preload = 'metadata';
                audioElementRef.current.src = url;
                audioElementRef.current.currentTime = 0;
                setFileName(file.name);
                setIsPlaying(false);
                setCurrentTime(0);
            }
        }
    };

    const handlePlay = () => {
        if (audioElementRef.current) {
            // Initialize audio context on first play
            initAudioContext();
            
            // Resume audio context if suspended
            if (audioContextRef.current?.state === 'suspended') {
                audioContextRef.current.resume();
            }
            audioElementRef.current.play();
            setIsPlaying(true);
        }
    };

    const handlePause = () => {
        if (audioElementRef.current) {
            audioElementRef.current.pause();
            setIsPlaying(false);
        }
    };

    const handleVolumeChange = (event) => {
        const newVolume = parseFloat(event.target.value);
        setVolume(newVolume);
        if (audioElementRef.current) {
            audioElementRef.current.volume = newVolume / 100;
        }
    };

    const handleTimeChange = (newTime) => {
        if (audioElementRef.current) {
            audioElementRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    return (
        <div className="w-full h-screen bg-black overflow-hidden">
            <SonicWaveformHero 
                audioContext={analyserReady ? audioContextRef.current : null}
                analyser={analyserReady ? analyserRef.current : null}
                isPlaying={isPlaying}
                onFileSelect={handleFileSelect}
                lengthScale={1.5}
                widthScale={1.0}
                speedScale={0.5}
            />
            
            <MediaPlayer
                audioRef={audioElementRef}
                isPlaying={isPlaying}
                onPlay={handlePlay}
                onPause={handlePause}
                currentTime={currentTime}
                duration={duration}
                onTimeChange={handleTimeChange}
                volume={volume}
                onVolumeChange={handleVolumeChange}
                fileName={fileName}
            />
            
            {/* Hidden audio element for Web Audio API */}
            <audio
                ref={audioElementRef}
                crossOrigin="anonymous"
                style={{ display: 'none' }}
            />
        </div>
    );
}
