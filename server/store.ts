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
}

export interface SessionData {
  id: string;
  mode: string;
  startedAt: Date;
  transcript: string[];
  metrics: MetricSnapshot[];
  report?: SessionReport;
}

export interface SessionStore {
  save(session: SessionData): Promise<void>;
  get(id: string): Promise<SessionData | null>;
}

// --- In-memory store (local development) ---
export class InMemoryStore implements SessionStore {
  private sessions = new Map<string, SessionData>();

  async save(session: SessionData) {
    this.sessions.set(session.id, session);
  }

  async get(id: string) {
    return this.sessions.get(id) || null;
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
    const db = await this.getDb();
    await db.collection('sessions').doc(session.id).set({
      ...session,
      startedAt: session.startedAt.toISOString(),
    });
  }

  async get(id: string) {
    const db = await this.getDb();
    const doc = await db.collection('sessions').doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data();
    return { ...data, startedAt: new Date(data.startedAt) } as SessionData;
  }
}

// Factory: use InMemoryStore in dev, FirestoreStore in production
export function createStore(): SessionStore {
  if (process.env.NODE_ENV === 'production') {
    return new FirestoreStore();
  }
  console.log('📦 Using in-memory session store (development mode)');
  return new InMemoryStore();
}
