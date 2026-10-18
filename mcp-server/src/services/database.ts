import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DB_DIR, 'omniliving.sqlite');

export interface AuditEventRow {
  id?: number;
  timestamp: string;
  source: string;
  message: string;
  level?: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  trace_id?: string;
  data_json?: string;
}

export interface AutomationRuleRow {
  id: string;
  name: string;
  enabled: number; // 0 or 1
  when_event: string; // JSON or string
  if_conditions: string; // JSON string
  then_actions: string; // JSON string
  created_at: string;
  last_triggered_at?: string;
  trigger_count: number;
}

export class DatabaseService {
  private static instance: DatabaseService;
  private db: any = null;
  private fallbackMemory: {
    events: AuditEventRow[];
    states: Record<string, string>;
    rules: AutomationRuleRow[];
  } = { events: [], states: {}, rules: [] };
  private isNativeSqlite = false;

  private constructor() {
    this.init();
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private init() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      // Dynamic import or require of better-sqlite3
      const BetterSqlite = (await_import_sqlite() || null);
      if (BetterSqlite) {
        this.db = new BetterSqlite(DB_FILE);
        this.isNativeSqlite = true;
        this.db.pragma('journal_mode = WAL');
        this.migrate();
        console.log(`[Database] Connected to persistent SQLite database at: ${DB_FILE}`);
        return;
      }
    } catch (err) {
      console.warn('[Database] Failed to open native SQLite, falling back to persistent JSON file store:', err);
    }

    this.initJsonFallback();
  }

  private migrate() {
    if (!this.db) return;

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS audit_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        source TEXT NOT NULL,
        message TEXT NOT NULL,
        level TEXT DEFAULT 'INFO',
        trace_id TEXT,
        data_json TEXT
      );

      CREATE TABLE IF NOT EXISTS device_states (
        device_key TEXT PRIMARY KEY,
        state_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS automation_rules (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        enabled INTEGER DEFAULT 1,
        when_event TEXT NOT NULL,
        if_conditions TEXT NOT NULL,
        then_actions TEXT NOT NULL,
        created_at TEXT NOT NULL,
        last_triggered_at TEXT,
        trigger_count INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS benchmark_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        total_frames INTEGER NOT NULL,
        accuracy REAL NOT NULL,
        precision_val REAL NOT NULL,
        recall_val REAL NOT NULL,
        f1_score REAL NOT NULL,
        mean_latency_ms REAL NOT NULL,
        report_json TEXT NOT NULL
      );
    `);
  }

  private initJsonFallback() {
    const jsonPath = path.join(DB_DIR, 'fallback_store.json');
    try {
      if (fs.existsSync(jsonPath)) {
        const raw = fs.readFileSync(jsonPath, 'utf-8');
        this.fallbackMemory = JSON.parse(raw);
      }
    } catch {
      this.fallbackMemory = { events: [], states: {}, rules: [] };
    }
    console.log('[Database] File-backed JSON database active.');
  }

  private saveJsonFallback() {
    const jsonPath = path.join(DB_DIR, 'fallback_store.json');
    try {
      fs.writeFileSync(jsonPath, JSON.stringify(this.fallbackMemory, null, 2));
    } catch (e) {
      console.warn('[Database] Could not write JSON fallback:', e);
    }
  }

  // AUDIT EVENTS
  public insertEvent(row: AuditEventRow): void {
    if (this.isNativeSqlite && this.db) {
      try {
        const stmt = this.db.prepare(`
          INSERT INTO audit_events (timestamp, source, message, level, trace_id, data_json)
          VALUES (@timestamp, @source, @message, @level, @trace_id, @data_json)
        `);
        stmt.run({
          timestamp: row.timestamp || new Date().toISOString(),
          source: row.source,
          message: row.message,
          level: row.level || 'INFO',
          trace_id: row.trace_id || null,
          data_json: row.data_json || null
        });
        return;
      } catch (err) {
        console.error('[Database] insertEvent failed:', err);
      }
    }

    this.fallbackMemory.events.unshift(row);
    if (this.fallbackMemory.events.length > 200) this.fallbackMemory.events.pop();
    this.saveJsonFallback();
  }

  public getEvents(limit = 100): AuditEventRow[] {
    if (this.isNativeSqlite && this.db) {
      try {
        const stmt = this.db.prepare('SELECT * FROM audit_events ORDER BY id DESC LIMIT ?');
        return stmt.all(limit);
      } catch (err) {
        console.error('[Database] getEvents failed:', err);
      }
    }
    return this.fallbackMemory.events.slice(0, limit);
  }

  // DEVICE STATES
  public saveDeviceState(key: string, stateObj: any): void {
    const json = JSON.stringify(stateObj);
    const now = new Date().toISOString();
    if (this.isNativeSqlite && this.db) {
      try {
        const stmt = this.db.prepare(`
          INSERT INTO device_states (device_key, state_json, updated_at)
          VALUES (?, ?, ?)
          ON CONFLICT(device_key) DO UPDATE SET state_json = excluded.state_json, updated_at = excluded.updated_at
        `);
        stmt.run(key, json, now);
        return;
      } catch (err) {
        console.error('[Database] saveDeviceState failed:', err);
      }
    }
    this.fallbackMemory.states[key] = json;
    this.saveJsonFallback();
  }

  public getDeviceState<T>(key: string): T | null {
    if (this.isNativeSqlite && this.db) {
      try {
        const stmt = this.db.prepare('SELECT state_json FROM device_states WHERE device_key = ?');
        const row = stmt.get(key) as { state_json: string } | undefined;
        if (row?.state_json) return JSON.parse(row.state_json);
      } catch (err) {
        console.error('[Database] getDeviceState failed:', err);
      }
    }
    const val = this.fallbackMemory.states[key];
    return val ? JSON.parse(val) : null;
  }

  // AUTOMATION RULES
  public saveRule(rule: AutomationRuleRow): void {
    if (this.isNativeSqlite && this.db) {
      try {
        const stmt = this.db.prepare(`
          INSERT INTO automation_rules (id, name, enabled, when_event, if_conditions, then_actions, created_at, last_triggered_at, trigger_count)
          VALUES (@id, @name, @enabled, @when_event, @if_conditions, @then_actions, @created_at, @last_triggered_at, @trigger_count)
          ON CONFLICT(id) DO UPDATE SET 
            name = excluded.name, 
            enabled = excluded.enabled, 
            when_event = excluded.when_event,
            if_conditions = excluded.if_conditions, 
            then_actions = excluded.then_actions,
            last_triggered_at = excluded.last_triggered_at,
            trigger_count = excluded.trigger_count
        `);
        stmt.run(rule);
        return;
      } catch (err) {
        console.error('[Database] saveRule failed:', err);
      }
    }

    const idx = this.fallbackMemory.rules.findIndex(r => r.id === rule.id);
    if (idx >= 0) this.fallbackMemory.rules[idx] = rule;
    else this.fallbackMemory.rules.push(rule);
    this.saveJsonFallback();
  }

  public getRules(): AutomationRuleRow[] {
    if (this.isNativeSqlite && this.db) {
      try {
        const stmt = this.db.prepare('SELECT * FROM automation_rules ORDER BY created_at ASC');
        return stmt.all();
      } catch (err) {
        console.error('[Database] getRules failed:', err);
      }
    }
    return [...this.fallbackMemory.rules];
  }

  public deleteRule(id: string): boolean {
    if (this.isNativeSqlite && this.db) {
      try {
        const stmt = this.db.prepare('DELETE FROM automation_rules WHERE id = ?');
        const res = stmt.run(id);
        return res.changes > 0;
      } catch (err) {
        console.error('[Database] deleteRule failed:', err);
      }
    }
    const lenBefore = this.fallbackMemory.rules.length;
    this.fallbackMemory.rules = this.fallbackMemory.rules.filter(r => r.id !== id);
    this.saveJsonFallback();
    return this.fallbackMemory.rules.length < lenBefore;
  }

  public recordBenchmarkRun(data: {
    totalFrames: number;
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    meanLatencyMs: number;
    report: any;
  }) {
    const now = new Date().toISOString();
    if (this.isNativeSqlite && this.db) {
      try {
        const stmt = this.db.prepare(`
          INSERT INTO benchmark_runs (timestamp, total_frames, accuracy, precision_val, recall_val, f1_score, mean_latency_ms, report_json)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          now,
          data.totalFrames,
          data.accuracy,
          data.precision,
          data.recall,
          data.f1Score,
          data.meanLatencyMs,
          JSON.stringify(data.report)
        );
        return;
      } catch (err) {
        console.error('[Database] recordBenchmarkRun failed:', err);
      }
    }
  }

  public close(): void {
    if (this.db) {
      try {
        this.db.close();
        console.log('[Database] SQLite database connection closed cleanly.');
      } catch (err) {
        console.warn('[Database] Error closing SQLite:', err);
      }
    }
  }
}

function await_import_sqlite() {
  try {
    const { createRequire } = require('module');
    const req = createRequire(import.meta.url);
    return req('better-sqlite3');
  } catch {
    try {
      // In ES module context
      const requireFunc = (new Function('return require'))();
      return requireFunc('better-sqlite3');
    } catch {
      return null;
    }
  }
}
