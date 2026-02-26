import { useRef, useEffect } from 'react';
import { VisualizerProps } from '../../types';

interface Props extends VisualizerProps {
    variant: 'tides_overlay' | 'tides_clash';
}

export function TidesVisualizer({ userAnalyserRef, aiAnalyserRef, status, variant }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const timeRef = useRef<number>(0);
    const battlegroundRef = useRef<number>(0.5); // 0.5 = center (range 0 to 1)

    // Maintain a scrolling history of volume across frames
    const NUM_POINTS = 80; // More points for smoother horizontal flow
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

            ctx.clearRect(0, 0, width, height);
            
            // Compute Volume
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

            const isActive = (status !== 'disconnected' && status !== 'connecting' && status !== 'ending');

            let userVol = 0;
            let aiVol = 0;

            if (userAnalyser) {
                const targetVol = (isActive && status !== 'speaking') ? getVolume(userAnalyser) : 0;
                // Add tiny noise for life even when silent
                userVol = targetVol + (status === 'listening' ? 0.002 : 0);
                
                const arr = userHistoryRef.current;
                const smoothed = arr[0] + (userVol - arr[0]) * 0.3; // ease factor
                arr.unshift(smoothed); // Add to front (Left side origin)
                arr.pop();
            }

            if (aiAnalyser) {
                const targetVol = (isActive && status === 'speaking') ? getVolume(aiAnalyser) : 0;
                 // Add tiny noise for life even when silent
                aiVol = targetVol + (status === 'speaking' ? 0.002 : 0);

                const arr = aiHistoryRef.current;
                const smoothed = arr[0] + (aiVol - arr[0]) * 0.3; // ease factor
                arr.unshift(smoothed); // Add to front (Right side origin after flip)
                arr.pop();
            }

            // --- Battleground Logic (Clash Mode) ---
            if (variant === 'tides_clash') {
                const momentum = 0.02;
                // Push battleground based on relative volume
                // User louder -> pushes right (> 0.5)
                // AI louder -> pushes left (< 0.5)
                
                // Amplify differences to make it feel responsive
                const userForce = userHistoryRef.current[0] * 3;
                const aiForce = aiHistoryRef.current[0] * 3;
                
                // Natural restoration to center when silence
                const centerForce = (0.5 - battlegroundRef.current) * 0.05; 
                
                let shift = (userForce - aiForce) * momentum;
                
                // Add center restoration
                if (userForce < 0.01 && aiForce < 0.01) {
                    shift += centerForce;
                }

                battlegroundRef.current += shift;
                
                // Clamp battleground to avoid going off screen fully (keep between 10% and 90%)
                battlegroundRef.current = Math.max(0.1, Math.min(0.9, battlegroundRef.current));
            } else {
                // In overlay mode, battleground is irrelevant or just center
                battlegroundRef.current = 0.5;
            }


            const drawWave = (history: number[], isUser: boolean) => {
                const points: { x: number, y: number }[] = [];
                // Stretch points across the screen based on mode
                // In Clash mode, User goes from 0 to Battleground, AI goes from Width to Battleground
                
                const battleX = battlegroundRef.current * width;
                
                // Determine the drawing width for this specific wave
                // User: 0 -> battleX
                // AI: 0 -> (Width - battleX) (since we flip coordinates)
                const waveWidth = isUser 
                    ? (variant === 'tides_clash' ? battleX : width) 
                    : (variant === 'tides_clash' ? (width - battleX) : width);

                const sliceWidth = waveWidth / (NUM_POINTS - 1);
                
                const MAX_RMS = 0.3;

                for (let i = 0; i < NUM_POINTS; i++) {
                    let vol = history[i];
                    
                    // Fall off volume as it travels further from source
                    const decay = 1 - (i / NUM_POINTS); 
                    vol *= decay;

                    let normalizedVol = Math.pow(Math.min(vol / MAX_RMS, 1), 0.8);
                    
                    // Add sine wave modulation for "rippling" look
                    const waveMod = Math.sin((i * 0.2) - (timeRef.current * (isUser ? 2 : 1.5))) * 0.3;
                    
                    // Calculate amplitude height
                    const h = (normalizedVol * (height / 2.5)) * (1 + waveMod);

                    points.push({ x: i * sliceWidth, y: h });
                }

                // Bezier smoothing
                const centerY = height / 2;
                
                // Setup styling
                // User: #5b8782 (Sage Green)
                // AI: #c49a6c (Soft Gold)
                if (isUser) {
                    ctx.shadowColor = 'rgba(91, 135, 130, 0.5)';
                    ctx.fillStyle = variant === 'tides_overlay' ? 'rgba(91, 135, 130, 0.15)' : 'rgba(91, 135, 130, 0.25)';
                    ctx.strokeStyle = '#5b8782';
                } else {
                    ctx.shadowColor = 'rgba(196, 154, 108, 0.6)';
                    ctx.fillStyle = variant === 'tides_overlay' ? 'rgba(196, 154, 108, 0.15)' : 'rgba(196, 154, 108, 0.25)';
                    ctx.strokeStyle = '#c49a6c';
                }
                
                ctx.shadowBlur = 15;
                ctx.lineWidth = 2;
                if (variant === 'tides_overlay') ctx.globalCompositeOperation = 'screen';

                // We draw the shape by creating a top path and a bottom path mirrored around centerY
                
                ctx.beginPath();
                ctx.moveTo(points[0].x, centerY - points[0].y); // Start Top

                // Draw Top Curve
                for (let i = 1; i < points.length - 2; i++) {
                    const xc = (points[i].x + points[i + 1].x) / 2;
                    const yc = (centerY - points[i].y + centerY - points[i + 1].y) / 2;
                    ctx.quadraticCurveTo(points[i].x, centerY - points[i].y, xc, yc);
                }
                // Connect to end
                const last = points[points.length - 1];
                ctx.lineTo(last.x, centerY); // End at generic center

                // Draw Bottom Curve (Mirror) backwards
                for (let i = points.length - 2; i >= 0; i--) {
                    const p = points[i];
                    ctx.lineTo(p.x, centerY + p.y);
                }
                
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                
                ctx.globalCompositeOperation = 'source-over';
                ctx.shadowBlur = 0;
            };

            // 1. Draw User (Left -> Right)
            ctx.save();
            // In clash mode, we want a clip region or just careful drawing. 
            // The logic inside drawWave handles width.
            drawWave(userHistoryRef.current, true);
            ctx.restore();

            // 2. Draw AI (Right -> Left)
            // We translate and flip coordinate system so 0 is Right Edge
            ctx.save();
            ctx.translate(width, 0); 
            ctx.scale(-1, 1);       
            drawWave(aiHistoryRef.current, false);
            ctx.restore();

            // 3. Draw Battle Line (Clash Mode only)
            if (variant === 'tides_clash') {
                const battleX = battlegroundRef.current * width;
                
                ctx.beginPath();
                ctx.moveTo(battleX, 0);
                ctx.lineTo(battleX, height);
                ctx.lineWidth = 2; // Thin subtle line
                
                // Color depends on who is winning slightly
                const userForce = userHistoryRef.current[0];
                const aiForce = aiHistoryRef.current[0];
                
                // White hot center if both loud
                if (userForce > 0.1 && aiForce > 0.1) {
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                    ctx.shadowColor = 'white';
                    ctx.shadowBlur = 20;
                } else {
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                    ctx.shadowBlur = 0;
                }
                
                ctx.stroke();
            }
        }

        draw();

        return () => {
            cancelAnimationFrame(animationRef.current);
        };
    }, [userAnalyserRef, aiAnalyserRef, status, variant]);

    return <canvas ref={canvasRef} className="waveform" />;
}
