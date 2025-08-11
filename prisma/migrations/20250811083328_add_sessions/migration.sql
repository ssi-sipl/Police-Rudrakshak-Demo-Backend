-- CreateTable
CREATE TABLE "Session" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Alert" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "confidence" REAL NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'onboard',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "droneId" INTEGER NOT NULL,
    "sessionId" INTEGER,
    CONSTRAINT "Alert_droneId_fkey" FOREIGN KEY ("droneId") REFERENCES "Drone" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Alert_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Alert" ("confidence", "createdAt", "droneId", "id", "image", "message", "source", "type") SELECT "confidence", "createdAt", "droneId", "id", "image", "message", "source", "type" FROM "Alert";
DROP TABLE "Alert";
ALTER TABLE "new_Alert" RENAME TO "Alert";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
