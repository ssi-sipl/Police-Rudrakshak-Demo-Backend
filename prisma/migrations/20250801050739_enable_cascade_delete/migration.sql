-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Drone" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "drone_id" TEXT NOT NULL,
    "area_id" TEXT NOT NULL,
    "areaRef" INTEGER NOT NULL,
    CONSTRAINT "Drone_areaRef_fkey" FOREIGN KEY ("areaRef") REFERENCES "Area" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Drone" ("areaRef", "area_id", "drone_id", "id", "name") SELECT "areaRef", "area_id", "drone_id", "id", "name" FROM "Drone";
DROP TABLE "Drone";
ALTER TABLE "new_Drone" RENAME TO "Drone";
CREATE UNIQUE INDEX "Drone_drone_id_key" ON "Drone"("drone_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
