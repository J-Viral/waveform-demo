"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, SkipBack, SkipForward } from 'lucide-react';
import { motion } from 'framer-motion';

export const MediaPlayer = ({ 
    audioRef, 
    isPlaying, 
    onPlay, 
    onPause, 
    currentTime, 
    duration,
    onTimeChange,
    volume,
    onVolumeChange,
    fileName
}) => {
    const formatTime = (time) => {
        if (!time || isNaN(time)) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black via-black/80 to-transparent px-6 py-6 border-t border-teal-500/20"
        >
            {/* Progress Bar */}
            <div className="mb-4 flex items-center gap-3">
                <span className="text-xs text-gray-400 w-12">{formatTime(currentTime)}</span>
                <div className="flex-1 bg-gray-700/30 rounded-full h-1.5 cursor-pointer group">
                    <div
                        className="bg-gradient-to-r from-teal-400 to-teal-300 h-1.5 rounded-full transition-all duration-100"
                        style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                    >
                        <div className="float-right h-4 w-4 bg-teal-300 rounded-full -mt-1.25 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </div>
                <span className="text-xs text-gray-400 w-12 text-right">{formatTime(duration)}</span>
            </div>

            {/* Player Controls */}
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm text-gray-200 font-medium truncate">
                        {fileName || 'No file selected'}
                    </p>
                    <p className="text-xs text-gray-400">Audio Player</p>
                </div>

                <div className="flex items-center gap-4 flex-1 justify-center">
                    <button className="hover:text-teal-300 transition-colors">
                        <SkipBack className="h-5 w-5" />
                    </button>
                    
                    <button
                        onClick={isPlaying ? onPause : onPlay}
                        className="p-3 rounded-full bg-teal-500 hover:bg-teal-600 transition-colors shadow-lg"
                    >
                        {isPlaying ? (
                            <Pause className="h-6 w-6 text-black" />
                        ) : (
                            <Play className="h-6 w-6 text-black ml-0.5" />
                        )}
                    </button>

                    <button className="hover:text-teal-300 transition-colors">
                        <SkipForward className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex items-center gap-2 flex-1 justify-end">
                    <Volume2 className="h-5 w-5 text-gray-400" />
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={onVolumeChange}
                        className="w-24 h-1 bg-gray-700/30 rounded-full appearance-none cursor-pointer accent-teal-400"
                    />
                </div>
            </div>
        </motion.div>
    );
};

export default MediaPlayer;
