import { useRef, useEffect } from 'react';

interface Props {
    analyserRef: React.RefObject<AnalyserNode | null>;
}

export function Waveform({ analyserRef }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);

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

            const analyser = analyserRef.current;
            if (!analyser || !ctx) {
                // Draw idle waveform
                ctx!.clearRect(0, 0, width, height);
                ctx!.strokeStyle = 'rgba(91, 135, 130, 0.4)'; /* Sage green, semitransparent */
                ctx!.lineWidth = 2;
                ctx!.beginPath();
                ctx!.moveTo(0, height / 2);
                ctx!.lineTo(width, height / 2);
                ctx!.stroke();
                return;
            }

            const bufferLength = analyser.fftSize;
            const dataArray = new Float32Array(bufferLength);
            analyser.getFloatTimeDomainData(dataArray);

            ctx.clearRect(0, 0, width, height);

            // Glow effect
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(91, 135, 130, 0.5)';

            // Draw waveform
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#5b8782';
            ctx.beginPath();

            const sliceWidth = width / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i];
                const y = (v * height * 2) + (height / 2);

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
                x += sliceWidth;
            }

            ctx.lineTo(width, height / 2);
            ctx.stroke();

            // Reset shadow
            ctx.shadowBlur = 0;
        }

        draw();

        return () => {
            cancelAnimationFrame(animationRef.current);
        };
    }, [analyserRef]);

    return <canvas ref={canvasRef} className="waveform" />;
}
