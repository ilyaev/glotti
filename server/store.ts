export interface MetricSnapshot {
  filler_words: Record<string, number>;
  words_per_minute: number;
  tone: string;
  key_phrases: string[];
  improvement_hint: string;
  timestamp: number;
  talk_ratio: number;
  clarity_score: number;
}

export interface SessionReport {
  session_id: string;
  mode: string;
  duration_seconds: number;
  overall_score: number;
  categories: Record<string, { score: number; feedback: string }>;
  metrics: {
    total_filler_words: number;
    avg_words_per_minute: number;
    dominant_tone: string;
    interruption_recovery_avg_ms: number;
    avg_talk_ratio: number;
    avg_clarity_score: number;
  };
  key_moments: Array<{ timestamp: string; type: 'strength' | 'weakness'; note: string }>;
  improvement_tips: string[];
  social_share_texts?: {
    performance_card_summary: string;
    linkedin_template: string;
    twitter_template: string;
    facebook_template: string;
  };
  /** Scenario-specific extra fields (fallacies, phrases, topic, etc.) */
  extra?: Record<string, unknown>;
  /** Which metric keys from `metrics` are relevant for this mode */
  displayMetrics?: string[];
  /** The name of the AI voice used in this session */
  voiceName?: string;
}

export interface SessionData {
  id: string;
  userId: string;
  mode: string;
  startedAt: Date;
  transcript: string[];
  metrics: MetricSnapshot[];
  report?: SessionReport;
  voiceName?: string;
}

export interface SessionSummary {
  id: string;
  userId: string;
  mode: string;
  startedAt: Date;
  duration_seconds: number;
  overall_score: number;
  preview_text: string;
  voiceName: string;
}

export interface SessionStore {
  save(session: SessionData): Promise<void>;
  get(id: string): Promise<SessionData | null>;
  listByUser(userId: string): Promise<SessionSummary[]>;
}

// --- File-based store (local development — survives server restarts) ---
export class FileStore implements SessionStore {
  private filePath: string;
  private data: Record<string, SessionData> = {};
  private loaded = false;

  constructor(filePath?: string) {
    // Default to <project-root>/sessions.json  (one level above /server/dist)
    this.filePath = filePath ?? new URL('../../sessions.json', import.meta.url).pathname;
  }

  private async load(): Promise<void> {
    // if (this.loaded) return;
    try {
      const { readFile } = await import('fs/promises');
      const raw = await readFile(this.filePath, 'utf-8');
      const parsed = JSON.parse(raw) as Record<string, Omit<SessionData, 'startedAt'> & { startedAt: string }>;
      // Rehydrate Date fields
      for (const [id, session] of Object.entries(parsed)) {
        this.data[id] = { ...session, startedAt: new Date(session.startedAt) };
      }
    } catch {
      // File doesn't exist yet — start empty
      this.data = {};
    }
    this.loaded = true;
  }

  private async flush(): Promise<void> {
    const { writeFile, rename } = await import('fs/promises');
    const tmp = this.filePath + '.tmp';
    await writeFile(tmp, JSON.stringify(this.data, null, 2), 'utf-8');
    await rename(tmp, this.filePath);
  }

  async save(session: SessionData): Promise<void> {
    await this.load();
    this.data[session.id] = session;
    await this.flush();
    console.log(`💾 [FileStore] Session ${session.id} saved → ${this.filePath}`);
  }

  async get(id: string): Promise<SessionData | null> {
    await this.load();
    return this.data[id] ?? null;
  }

  async listByUser(userId: string): Promise<SessionSummary[]> {
    await this.load();
    const results: SessionSummary[] = [];
    for (const session of Object.values(this.data)) {
      if (session.userId === userId) {
        results.push({
          id: session.id,
          userId: session.userId,
          mode: session.mode,
          startedAt: session.startedAt,
          duration_seconds: session.report?.duration_seconds ?? 0,
          overall_score: session.report?.overall_score ?? 0,
          preview_text: session.report?.social_share_texts?.performance_card_summary ?? '',
          voiceName: session.voiceName ?? 'AI Coach',
        });
      }
    }
    return results.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  }
}


// --- Firestore store (production) ---
export class FirestoreStore implements SessionStore {
  private db: any;

  constructor() {
    // Dynamic import to avoid requiring Firestore in dev
  }

  private async getDb() {
    if (!this.db) {
      const { Firestore } = await import('@google-cloud/firestore');
      this.db = new Firestore();
    }
    return this.db;
  }

  async save(session: SessionData) {
    console.log(`📦 [Firestore] Saving session: ${session.id}...`);
    try {
      const db = await this.getDb();
      await db.collection('sessions').doc(session.id).set({
        ...session,
        startedAt: session.startedAt.toISOString(),
      });
      console.log(`📦 [Firestore] ✅ Session ${session.id} saved successfully.`);
    } catch (err) {
      console.error(`📦 [Firestore] ❌ Error saving session ${session.id}:`, err);
      throw err;
    }
  }

  async get(id: string) {
    console.log(`📦 [Firestore] Fetching session: ${id}...`);
    try {
      const db = await this.getDb();
      const doc = await db.collection('sessions').doc(id).get();
      if (!doc.exists) {
        console.log(`📦 [Firestore] ⚠️ Session ${id} not found.`);
        return null;
      }
      const data = doc.data();
      console.log(`📦 [Firestore] ✅ Session ${id} retrieved.`);
      return { ...data, startedAt: new Date(data.startedAt) } as SessionData;
    } catch (err) {
      console.error(`📦 [Firestore] ❌ Error fetching session ${id}:`, err);
      throw err;
    }
  }

  async listByUser(userId: string): Promise<SessionSummary[]> {
    console.log(`📦 [Firestore] Listing sessions for user: ${userId}...`);
    try {
      const db = await this.getDb();
      const snap = await db
        .collection('sessions')
        .where('userId', '==', userId)
        .orderBy('startedAt', 'desc')
        .limit(50)
        .get();

      const results: SessionSummary[] = snap.docs.map((doc: any) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          mode: data.mode,
          startedAt: new Date(data.startedAt),
          duration_seconds: data.report?.duration_seconds ?? 0,
          overall_score: data.report?.overall_score ?? 0,
        };
      });
      console.log(`📦 [Firestore] ✅ Found ${results.length} sessions for user ${userId}.`);
      return results;
    } catch (err) {
      console.error(`📦 [Firestore] ❌ Error listing sessions for user ${userId}:`, err);
      throw err;
    }
  }
}

// Factory: use FileStore in dev, FirestoreStore in production
export function createStore(): SessionStore {
  if (process.env.NODE_ENV === 'production') {
    return new FirestoreStore();
  }
  const store = new FileStore();
  console.log('💾 Using file-based session store (development mode)');
  return store;
}
