import { Router } from 'express';
import { createStore } from '../store.js';
import { createHash } from 'crypto';
import React from 'react';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { PerformanceCard } from '../../client/src/components/report/PerformanceCard.js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from '../config.js';

const router = Router();
const store = createStore();

let interRegular: Buffer | null = null;
let interBold: Buffer | null = null;
let interItalic: Buffer | null = null;
let interMediumItalic: Buffer | null = null;
const bgImages: Record<string, string> = {};

try {
    interRegular = readFileSync(join(process.cwd(), 'server/assets/Inter-Regular.ttf'));
    interBold = readFileSync(join(process.cwd(), 'server/assets/Inter-Bold.ttf'));
    interItalic = readFileSync(join(process.cwd(), 'server/assets/Inter-Italic.ttf'));
    interMediumItalic = readFileSync(join(process.cwd(), 'server/assets/Inter-MediumItalic.ttf'));

    const loadBg = (name: string) => `data:image/jpeg;base64,${readFileSync(join(process.cwd(), `client/public/cards/${name}`)).toString('base64')}`;
    bgImages['pitch_perfect'] = loadBg('bg_pitch.jpg');
    bgImages['empathy_trainer'] = loadBg('bg_empathy.jpg');
    bgImages['impromptu'] = loadBg('bg_impromptu.jpg');
} catch (e) {
    console.warn("Could not load assets for Satori:", e);
}

// GET /api/sessions?userId=<id> — list summary for a user
router.get('/', async (req, res) => {
    const userId = req.query.userId as string | undefined;
    if (!userId) {
        res.status(400).json({ error: 'userId query param is required' });
        return;
    }
    try {
        const sessions = await store.listByUser(userId);
        res.json(sessions.map(s => ({
            ...s,
            startedAt: s.startedAt instanceof Date ? s.startedAt.toISOString() : s.startedAt,
        })));
    } catch (err) {
        console.error('GET /api/sessions error:', err);
        res.status(500).json({ error: 'Failed to list sessions' });
    }
});

// GET /api/sessions/:id — full session with transcript and report
// Access via: ?userId=<id> (owner) OR ?key=<shareKey> (shared link)
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const userId = req.query.userId as string | undefined;
    const shareKey = req.query.key as string | undefined;

    try {
        const session = await store.get(id);
        if (!session) {
            res.status(404).json({ error: 'Session not found' });
            return;
        }

        // If a share key is provided, verify SHA-256(sessionId + userId)
        if (shareKey) {
            const expected = createHash('sha256')
                .update(session.id + session.userId)
                .digest('hex')
                .slice(0, 24);
            if (shareKey !== expected) {
                res.status(403).json({ error: 'Invalid share key' });
                return;
            }
            // Key matched — serve the session
        } else if (userId && session.userId !== userId) {
            // No share key — regular ownership check
            res.status(403).json({ error: 'Forbidden' });
            return;
        } else if (!userId) {
            res.status(403).json({ error: 'userId or key required' });
            return;
        }

        // Sanitize data if accessed via share key (remove full transcript, keep metrics/report)
        const sanitizedSession = shareKey ? {
            id: session.id,
            mode: session.mode,
            startedAt: session.startedAt instanceof Date ? session.startedAt.toISOString() : session.startedAt,
            report: session.report,
            metrics: session.metrics,
            voiceName: session.voiceName,
            // Do NOT include user ID or full transcript in shared views
        } : {
            ...session,
            startedAt: session.startedAt instanceof Date ? session.startedAt.toISOString() : session.startedAt,
        };

        res.json(sanitizedSession);
    } catch (err) {
        console.error(`GET /api/sessions/${id} error:`, err);
        res.status(500).json({ error: 'Failed to fetch session' });
    }
});

// GET /api/shared/og/:id/:key — Returns basic HTML with OG tags for social preview
router.get('/shared/og/:id/:key', async (req, res) => {
    const { id, key } = req.params;

    try {
        const session = await store.get(id);
        if (!session || !session.report) {
            res.status(404).send('Not Found');
            return;
        }

        const expected = createHash('sha256')
            .update(session.id + session.userId)
            .digest('hex')
            .slice(0, 24);

        if (key !== expected) {
            res.status(403).send('Forbidden');
            return;
        }

        const score = session.report.overall_score;
        const modeLabel = session.mode.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());

        const baseUrl = config.isDev ? `http://${req.get('host')}` : 'https://glotti.pbartz.net';

        // Return a basic HTML page with OG tags.
        // In the future this could point to a real image URL
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Glotti Report: ${modeLabel} - ${score}/10</title>
    <meta property="og:title" content="Glotti Report: ${modeLabel} - ${score}/10" />
    <meta property="og:description" content="I just completed an AI-powered coaching session. See how I performed!" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${baseUrl}/sessiong/${id}/${key}" />
    <meta property="og:image" content="${req.protocol}://${req.get('host')}/api/sessions/shared/og-image/${id}/${key}" />
    <meta property="og:image:width" content="1080" />
    <meta property="og:image:height" content="1080" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Glotti Report: ${modeLabel} - ${score}/10" />
    <meta name="twitter:description" content="I just completed an AI-powered coaching session. See how I performed!" />
    <meta name="twitter:image" content="${req.protocol}://${req.get('host')}/api/sessions/shared/og-image/${id}/${key}" />
    <!-- Redirect to the actual app -->
    <meta http-equiv="refresh" content="0; url=${baseUrl}/#/sessions/${id}/${key}" />
</head>
<body>
    <p>Redirecting to report...</p>
</body>
</html>`;

        const htmlBuffer = Buffer.from(html, 'utf-8');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Content-Length', htmlBuffer.length);
        res.status(200).end(htmlBuffer);
    } catch (err) {
        console.error(`GET /api/shared/og/${id}/${key} error:`, err);
        res.status(500).send('Internal Server Error');
    }
});

// GET /api/shared/og-image/:id/:key — Renders the OG image using Satori
router.get('/shared/og-image/:id/:key', async (req, res) => {
    const { id, key } = req.params;

    try {
        const session = await store.get(id);
        if (!session || !session.report) {
            res.status(404).send('Not Found');
            return;
        }

        const expected = createHash('sha256').update(session.id + session.userId).digest('hex').slice(0, 24);
        if (key !== expected) {
            res.status(403).send('Forbidden');
            return;
        }

        if (!interRegular || !interBold || !interItalic || !interMediumItalic) {
            res.status(500).send('Fonts not loaded server-side');
            return;
        }

        const svg = await satori(
            React.createElement(PerformanceCard, {
                report: session.report,
                isOgImage: true,
                ogBackgroundImage: bgImages[session.mode]
            }),
            {
                width: 1080,
                height: 1080,
                fonts: [
                    { name: 'Inter', data: interRegular, weight: 400, style: 'normal' },
                    { name: 'Inter', data: interBold, weight: 700, style: 'normal' },
                    { name: 'Inter', data: interItalic, weight: 400, style: 'italic' },
                    { name: 'Inter', data: interMediumItalic, weight: 500, style: 'italic' }
                ],
            }
        );

        const resvg = new Resvg(svg, {
            fitTo: { mode: 'width', value: 1080 }
        });
        const pngData = resvg.render();
        const pngBuffer = pngData.asPng();

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.send(pngBuffer);

    } catch (err) {
        console.error(`GET /api/shared/og-image/${id}/${key} error:`, err);
        res.status(500).send((err as Error).stack || String(err));
    }
});

export default router;
