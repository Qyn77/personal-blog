import type { Database } from "sql.js";

export function ensureMcpTables(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS mcp_tokens (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, tokenHash TEXT NOT NULL UNIQUE,
      prefix TEXT NOT NULL, scopes TEXT NOT NULL, createdAt INTEGER NOT NULL,
      expiresAt INTEGER NOT NULL, revokedAt INTEGER
    );
    CREATE TABLE IF NOT EXISTS mcp_requests (
      tokenId TEXT NOT NULL, requestId TEXT NOT NULL, inputHash TEXT NOT NULL,
      result TEXT NOT NULL, createdAt INTEGER NOT NULL,
      PRIMARY KEY (tokenId, requestId)
    );
    CREATE TABLE IF NOT EXISTS mcp_events (
      id TEXT PRIMARY KEY, tokenId TEXT NOT NULL, action TEXT NOT NULL,
      resourceId TEXT, createdAt INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS mcp_previews (
      tokenHash TEXT PRIMARY KEY, tokenId TEXT NOT NULL,
      articleId TEXT NOT NULL, expiresAt INTEGER NOT NULL
    );
  `);
}
