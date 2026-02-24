import { Router } from 'express';
import { createStore } from '../store.js';
import { createHash } from 'crypto';

const router = Router();
const store = createStore();

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
    <meta property="og:url" content="https://glotti.app/sessions/${id}/${key}" />
    <!-- Redirect to the actual app -->
    <meta http-equiv="refresh" content="0; url=/#/sessions/${id}/${key}" />
</head>
<body>
    <p>Redirecting to report...</p>
</body>
</html>`;

        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    } catch (err) {
        console.error(`GET /api/shared/og/${id}/${key} error:`, err);
        res.status(500).send('Internal Server Error');
    }
});

export default router;
