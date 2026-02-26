import { useRef, useEffect } from 'react';
import { VisualizerProps } from '../../types';

export function ClassicWaveform({ userAnalyserRef, aiAnalyserRef, status }: VisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const timeRef = useRef<number>(0);

    // Maintain a scrolling history of volume across frames
    const NUM_POINTS = 50;
    const userHistoryRef = useRef<number[]>(new Array(NUM_POINTS).fill(0));
    const aiHistoryRef = useRef<number[]>(new Array(NUM_POINTS).fill(0));

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Handle high-DPI displays
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const width = rect.width;
        const height = rect.height;

        function draw() {
            animationRef.current = requestAnimationFrame(draw);
            timeRef.current += 0.05;

            const userAnalyser = userAnalyserRef.current;
            const aiAnalyser = aiAnalyserRef.current;

            if (!ctx) return;

            const bufferLength = userAnalyser ? userAnalyser.fftSize : (aiAnalyser ? aiAnalyser.fftSize : 2048);
            
            // Note: We don't actually use bufferLength to create buffers here 
            // because we are getting time domain data inside getVolume
            // We just need it to ensure Analysers are ready.

            ctx.clearRect(0, 0, width, height);
            const centerY = height / 2;

            // --- Draw Center Line / Ripple ---
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(91, 135, 130, 0.3)';
            ctx.beginPath();

            if (status === 'connecting' || status === 'listening') {
                // Soft sine wave ripple when idle
                ctx.moveTo(0, centerY);
                for (let i = 0; i <= width; i += 5) {
                    const amplitude = status === 'listening' ? 4 : 2;
                    const frequency = status === 'listening' ? 0.02 : 0.01;
                    const y = centerY + Math.sin(i * frequency + timeRef.current) * amplitude * Math.sin(i * Math.PI / width);
                    ctx.lineTo(i, y);
                }
            } else {
                ctx.moveTo(0, centerY);
                ctx.lineTo(width, centerY);
            }
            ctx.stroke();

            // Compute Volume and update history
            const getVolume = (analyser: AnalyserNode) => {
                const data = new Float32Array(analyser.fftSize);
                analyser.getFloatTimeDomainData(data);
                let sumSquares = 0;
                for (let i = 0; i < data.length; i++) {
                    sumSquares += data[i] * data[i];
                }
                const rms = Math.sqrt(sumSquares / data.length);
                return isNaN(rms) ? 0 : rms;
            };

            // Ignore actual waves if disconnected or connecting, but keep history flowing
            const isActive = (status !== 'disconnected' && status !== 'connecting' && status !== 'ending');

            if (userAnalyser) {
                const targetVol = (isActive && status !== 'speaking') ? getVolume(userAnalyser) : 0;
                const arr = userHistoryRef.current;
                const smoothed = arr[arr.length - 1] + (targetVol - arr[arr.length - 1]) * 0.4; // ease factor
                arr.push(smoothed);
                arr.shift();
            }

            if (aiAnalyser) {
                const targetVol = (isActive && status === 'speaking') ? getVolume(aiAnalyser) : 0;
                const arr = aiHistoryRef.current;
                const smoothed = arr[arr.length - 1] + (targetVol - arr[arr.length - 1]) * 0.4; // ease factor
                arr.push(smoothed);
                arr.shift();
            }

            if (!isActive) return;

            const drawArea = (history: number[], isUser: boolean) => {
                const points: { x: number, y: number }[] = [];
                const sliceWidth = width / (NUM_POINTS - 1);

                const MAX_RMS = 0.25;
                let hasSignal = false;

                for (let i = 0; i < NUM_POINTS; i++) {
                    if (history[i] > 0.005) hasSignal = true;

                    let normalizedVol = Math.pow(Math.min(history[i] / MAX_RMS, 1), 1.2);

                    const direction = isUser ? -1 : 1;
                    const y = centerY + (direction * normalizedVol * (height / 2) * 0.95);
                    points.push({ x: i * sliceWidth, y });
                }

                if (!hasSignal) return;

                // Geometric smoothing of the timeline curve itself
                const smoothedPoints = points.map((p, i, arr) => {
                    if (i === 0 || i === arr.length - 1) return p;
                    const prev = arr[i - 1];
                    const next = arr[i + 1];
                    return { x: p.x, y: (prev.y + p.y * 2 + next.y) / 4 };
                });

                ctx.shadowBlur = isUser ? 10 : 15;
                ctx.shadowColor = isUser ? 'rgba(91, 135, 130, 0.5)' : 'rgba(196, 154, 108, 0.6)';
                ctx.lineWidth = isUser ? 2 : 2.5;
                ctx.strokeStyle = isUser ? '#5b8782' : '#c49a6c';
                ctx.fillStyle = isUser ? 'rgba(91, 135, 130, 0.2)' : 'rgba(196, 154, 108, 0.2)';

                // Draw filled area
                ctx.beginPath();
                ctx.moveTo(smoothedPoints[0].x, centerY);
                ctx.lineTo(smoothedPoints[0].x, smoothedPoints[0].y);

                for (let i = 1; i < smoothedPoints.length - 1; i++) {
                    const xc = (smoothedPoints[i].x + smoothedPoints[i + 1].x) / 2;
                    const yc = (smoothedPoints[i].y + smoothedPoints[i + 1].y) / 2;
                    ctx.quadraticCurveTo(smoothedPoints[i].x, smoothedPoints[i].y, xc, yc);
                }

                const lastPoint = smoothedPoints[smoothedPoints.length - 1];
                ctx.lineTo(lastPoint.x, lastPoint.y);
                ctx.lineTo(lastPoint.x, centerY);
                ctx.closePath();
                ctx.fill();

                // Draw glowing stroke only on the outer edge
                ctx.beginPath();
                ctx.moveTo(smoothedPoints[0].x, smoothedPoints[0].y);
                for (let i = 1; i < smoothedPoints.length - 1; i++) {
                    const xc = (smoothedPoints[i].x + smoothedPoints[i + 1].x) / 2;
                    const yc = (smoothedPoints[i].y + smoothedPoints[i + 1].y) / 2;
                    ctx.quadraticCurveTo(smoothedPoints[i].x, smoothedPoints[i].y, xc, yc);
                }
                ctx.lineTo(lastPoint.x, lastPoint.y);
                ctx.stroke();
            };

            // --- Draw User Waveform (Top Half) ---
            drawArea(userHistoryRef.current, true);

            // --- Draw AI Waveform (Bottom Half) ---
            drawArea(aiHistoryRef.current, false);

            // Reset shadow
            ctx.shadowBlur = 0;
        }

        draw();

        return () => {
            cancelAnimationFrame(animationRef.current);
        };
    }, [userAnalyserRef, aiAnalyserRef, status]);

    return <canvas ref={canvasRef} className="waveform" />;
}
