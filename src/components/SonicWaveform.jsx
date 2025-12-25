"use client";

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BarChart2 } from 'lucide-react';

// A utility function for class names
const cn = (...classes) => classes.filter(Boolean).join(' ');

// Sonic Waveform Canvas Component
const SonicWaveformCanvas = ({ analyser, isPlaying, lengthScale = 1, widthScale = 1, speedScale = 1 }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let animationFrameId;
        const mouse = { x: canvas.width / 2, y: canvas.height / 2 };
        let time = 0;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            // reset mouse origin to center after resize
            mouse.x = canvas.width / 2;
            mouse.y = canvas.height / 2;
        };
        
        // Prepare buffer for analyser if available
        let freqData = null;
        if (analyser) {
            freqData = new Uint8Array(analyser.frequencyBinCount);
        }

        // For simple beat detection
        const energyHistory = [];
        let lastBeatTime = 0;
        let beatLevel = 0;

        const draw = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Calculate an energy value biased to low frequencies (bass)
            let energy = 0;
            if (analyser && freqData) {
                analyser.getByteFrequencyData(freqData);

                const lowCount = Math.max(3, Math.floor(freqData.length * 0.12));
                let sumLow = 0;
                for (let i = 0; i < lowCount; i++) sumLow += freqData[i];
                const lowEnergy = (sumLow / lowCount) / 255; // 0..1

                // maintain short history for average
                energyHistory.push(lowEnergy);
                if (energyHistory.length > 60) energyHistory.shift();
                const avg = energyHistory.reduce((a, b) => a + b, 0) / energyHistory.length;

                // detect beat: current energy significantly above recent average
                const now = performance.now();
                if (lowEnergy > Math.max(0.02, avg * 1.6) && (now - lastBeatTime) > 140) {
                    lastBeatTime = now;
                    beatLevel = 1.0; // flash/boost on beat
                }

                // decay beat level
                beatLevel *= 0.92;

                energy = lowEnergy;
                if (!isPlaying) {
                    energy = 0; // only allow reaction while playing
                    beatLevel = 0;
                }
            }

            const lineCount = 60;
            const segmentCount = 80;
            const height = canvas.height / 2;

            for (let i = 0; i < lineCount; i++) {
                ctx.beginPath();
                const progress = i / lineCount;
                const colorIntensity = Math.sin(progress * Math.PI);
                ctx.strokeStyle = `rgba(0, 255, 192, ${Math.min(1, colorIntensity * (0.45 + energy * 0.9 + beatLevel * 0.8))})`;
                ctx.lineWidth = 1.5 + energy * 2 + beatLevel * 2;

                for (let j = 0; j < segmentCount + 1; j++) {
                    // normalized -0.5..0.5 then scale around center for width control
                    const norm = (j / segmentCount) - 0.5;
                    const x = canvas.width / 2 + norm * canvas.width * widthScale;

                    // Mouse influence
                    const distToMouse = Math.hypot(x - mouse.x, (height) - mouse.y);
                    const mouseEffect = Math.max(0, 1 - distToMouse / 400);

                    // Wave calculation with energy and beat modulation
                    const baseNoise = Math.sin(j * 0.1 + time + i * 0.2) * 20 * lengthScale;
                    const spike = Math.cos(j * 0.2 + time + i * 0.1) * Math.sin(j * 0.05 + time) * ((50 + energy * 160 + beatLevel * 240) * lengthScale);
                    const y = height + baseNoise + spike * (1 + mouseEffect * 2);

                    if (j === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.stroke();
            }

            // advance time scaled by speedScale (smaller -> slower)
            time += (0.02 + energy * 0.08 + beatLevel * 0.12) * speedScale;
            animationFrameId = requestAnimationFrame(draw);
        };

        const handleMouseMove = (event) => {
            mouse.x = event.clientX;
            mouse.y = event.clientY;
        };

        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('mousemove', handleMouseMove);
        
        resizeCanvas();
        draw();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, [analyser, isPlaying, lengthScale, widthScale, speedScale]);

    return <canvas ref={canvasRef} className="absolute inset-0 z-0 w-full h-full bg-black" />;
};


// The main hero component
const SonicWaveformHero = ({ onFileSelect, isPlaying, analyser, lengthScale = 1, widthScale = 1, speedScale = 1 }) => {
    const fadeUpVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: (i) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.2 + 0.5,
                duration: 0.8,
                ease: "easeInOut",
            },
        }),
    };

    return (
        <div 
            className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden"
        >
            <SonicWaveformCanvas analyser={analyser} isPlaying={isPlaying} lengthScale={lengthScale} widthScale={widthScale} speedScale={speedScale} />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent z-10"></div>

            {/* Overlay HTML Content */}
            <div className="relative z-20 text-center p-6">
                <motion.div
                    custom={0} variants={fadeUpVariants} initial="hidden" animate="visible"
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 mb-6 backdrop-blur-sm"
                >
                    <BarChart2 className="h-4 w-4 text-teal-300" />
                    <span className="text-sm font-medium text-gray-200">
                        Real-Time Data Sonification
                    </span>
                </motion.div>

                <motion.h1
                    custom={1} variants={fadeUpVariants} initial="hidden" animate="visible"
                    className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400"
                >
                    Sonic Waveform
                </motion.h1>

                <motion.p
                    custom={2} variants={fadeUpVariants} initial="hidden" animate="visible"
                    className="max-w-2xl mx-auto text-lg text-gray-400 mb-10"
                >
                    Translate complex data streams into intuitive, interactive soundscapes. Hear the patterns, feel the insights.
                </motion.p>

                <motion.div
                    custom={3} variants={fadeUpVariants} initial="hidden" animate="visible"
                >
                    <label className="cursor-pointer px-8 py-4 bg-white text-black font-semibold rounded-lg shadow-lg hover:bg-gray-200 transition-colors duration-300 flex items-center gap-2 mx-auto">
                        {isPlaying ? 'Change Song' : 'Select Audio File'}
                        <ArrowRight className="h-5 w-5" />
                        <input
                            type="file"
                            accept="audio/*"
                            onChange={onFileSelect}
                            className="hidden"
                        />
                    </label>
                </motion.div>
            </div>
        </div>
    );
};

export default SonicWaveformHero;
