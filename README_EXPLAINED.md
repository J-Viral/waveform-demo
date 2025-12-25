# Project Explanation — Media Player

This file explains the project's purpose, folder structure, dependencies, and how the code works in simple language. Use this as a single reference for understanding the app.

---

## Overview
- Project type: Next.js app (React) implementing an audio player with a real-time canvas waveform visualizer.
- Main features: load local audio files, play/pause, volume control, hidden audio element connected to Web Audio API, animated visual waveform that reacts to audio (basic beat detection + mouse interaction).

## Folder structure (key files)
- `package.json` — project dependencies and scripts.
- `public/` — static assets.
- `src/`
  - `app/`
    - `layout.js` — root layout and fonts.
    - `page.jsx` — main page: audio state, audio context setup, wiring components.
    - `globals.css` — global styles (Tailwind utilities expected).
  - `components/`
    - `MediaPlayer.jsx` — UI controls (play/pause, progress bar, volume slider).
    - `SonicWaveform.jsx` — canvas-based visualizer and hero overlay.

Files to open for quick reading: [src/app/page.jsx](src/app/page.jsx), [src/components/SonicWaveform.jsx](src/components/SonicWaveform.jsx), [src/components/MediaPlayer.jsx](src/components/MediaPlayer.jsx).

## Dependencies and their roles
- `next` — the framework: routing, dev server, and build tooling.
- `react`, `react-dom` — UI library for components and rendering.
- `framer-motion` — handles UI animations for smooth entrance and transitions (`motion.div` etc.).
- `lucide-react` — icon components (Play, Pause, Volume, Skip icons).
- `tailwindcss` and `@tailwindcss/postcss` — utility CSS framework used via class names for styling.
- `eslint`, `eslint-config-next` — dev linting tools.

Browser APIs used (no deps):
- Web Audio API (`AudioContext`, `AnalyserNode`, `GainNode`, `createMediaElementSource`).
- Canvas 2D API and `requestAnimationFrame` for drawing animation.

## High-level data flow
1. User chooses an audio file using the file input in the waveform hero.
2. `page.jsx` sets the `<audio>` element `src` to an object URL created with `URL.createObjectURL(file)`.
3. On first play, `AudioContext` is created and a `MediaElementAudioSourceNode` is created from the `<audio>` element.
4. A `GainNode` routes audio to an `AnalyserNode`, which produces frequency data consumed by the canvas visualizer.
5. The canvas visualizer reads `analyser.getByteFrequencyData(...)` each frame and draws waveform lines that react to audio energy and detected beats.
6. The visible controls in `MediaPlayer.jsx` control playback, volume and display progress/time.

## File-by-file explanation (simple)

### `src/app/layout.js`
- Loads Google fonts via Next helpers and applies font CSS variables to the `<body>`.
- Exports `metadata` used by Next and a `RootLayout` component wrapping the app.

### `src/app/page.jsx`
- Purpose: central state and wiring. Main responsibilities:
  - Manage a hidden `<audio>` element via `audioElementRef`.
  - Create and manage `audioContextRef` (AudioContext), `analyserRef` (AnalyserNode), and `sourceRef` (MediaElementAudioSourceNode).
  - Keep React state for `isPlaying`, `currentTime`, `duration`, `volume`, `fileName`, and `analyserReady`.
  - Functions:
    - `initAudioContext()` — creates `AudioContext`, `AnalyserNode`, and `GainNode`; connects nodes and the media source; sets `analyserReady`.
    - `handleFileSelect(event)` — when a file is chosen, create object URL and set it to the hidden audio element; reset playback state.
    - `handlePlay()` — initializes audio context (if needed), resumes it if suspended, and calls `audio.play()`.
    - `handlePause()` — calls `audio.pause()` and updates state.
    - `handleVolumeChange(event)` — updates `volume` state and sets `audio.volume`.
    - `handleTimeChange(newTime)` — seeks the audio element to a new time.
  - Hooks:
    - `useEffect` attaches `timeupdate`, `loadedmetadata`, `durationchange`, and `ended` handlers to update state and clean up on unmount.
  - Renders `SonicWaveformHero` (visualizer + file picker), `MediaPlayer` (controls), and the hidden `<audio>` element.

### `src/components/MediaPlayer.jsx`
- A presentational control bar which accepts props from `page.jsx`.
- Key parts:
  - `formatTime(time)` — turn seconds into `M:SS` string.
  - Progress bar — inner div width based on `currentTime / duration`.
  - Play/Pause button — toggles `onPlay`/`onPause`.
  - Volume slider — a range input 0..100 that calls `onVolumeChange`.
- Notes: The progress bar is visual only in the current code (no click-to-seek implemented yet). The component uses `framer-motion` for entry animation and `lucide-react` icons for UI.

### `src/components/SonicWaveform.jsx`
- Consists of `SonicWaveformCanvas` (canvas drawing and audio reaction) and `SonicWaveformHero` (overlay UI with title and file picker).
- `SonicWaveformCanvas` details:
  - Props: `analyser`, `isPlaying`, `lengthScale`, `widthScale`, `speedScale`.
  - On mount: sets canvas to `window.innerWidth` × `window.innerHeight`, attaches `resize` and `mousemove` listeners.
  - If `analyser` present, allocates `Uint8Array` sized `analyser.frequencyBinCount` and reads frequency data every frame with `getByteFrequencyData`.
  - Computes `lowEnergy` by averaging the lowest ~12% of frequency bins — this biases to bass.
  - Keeps a short `energyHistory` to compute a recent average; triggers a simple beat when current energy is significantly above that average with a cooldown.
  - Draws multiple horizontal waveform lines across the canvas. Each line loops over segments across the width and computes a y offset using sin/cos noise mixed with `energy` and `beatLevel`.
  - `widthScale` controls how far the waveform spreads horizontally (0.5 = narrow, 1.0 = full width).
  - `lengthScale` increases vertical amplitude; `speedScale` changes how quickly `time` advances (animation speed).

## Key functions and why they are used (short)
- `initAudioContext()` — to enable analyzing audio from an HTML audio element using the Web Audio API.
- `createMediaElementSource(audio)` — connects the `<audio>` element to the audio processing graph.
- `getByteFrequencyData(array)` — fills `array` with frequency magnitudes (0..255) for visualization.
- `requestAnimationFrame(draw)` — create smooth canvas animation synced with display refresh.

## Glossary (plain)
- AudioContext: main object for audio processing in the browser.
- AnalyserNode: node that provides frequency/time-domain data used for drawing visualizations.
- GainNode: node that controls volume inside the audio graph.
- FFT (`fftSize`): size for frequency analysis — bigger gives more detail but costs CPU.
- `Uint8Array`: typed array used to receive analyser data.

## Running the app locally (quick)
1. Install deps (from project root):
```bash
npm install
```
2. Start dev server:
```bash
npm run dev
```
3. Open `http://localhost:3000` in your browser.

Notes: Browsers often block autoplay and require a user gesture to start audio. The app creates `AudioContext` on first play which satisfies this requirement.

## Potential improvements (practical)
- Add click-to-seek on the progress bar in `MediaPlayer.jsx`.
- Use `gainNode.gain.value` for the volume slider instead of `audio.volume` for smoother integration into the audio graph.
- Revoke object URLs with `URL.revokeObjectURL` when replacing or clearing a file to free memory.
- Expose debug visuals (show raw energy values or bin graphs) for tuning beat detection.

---


