/*
  Warnings:

  - Added the required column `droneId` to the `Alert` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Area" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "area_id" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Drone" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "drone_id" TEXT NOT NULL,
    "area_id" TEXT NOT NULL,
    "areaRef" INTEGER NOT NULL,
    CONSTRAINT "Drone_areaRef_fkey" FOREIGN KEY ("areaRef") REFERENCES "Area" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Sensor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "area_id" TEXT NOT NULL,
    "sensor_id" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "droneId" INTEGER NOT NULL,
    CONSTRAINT "Alert_droneId_fkey" FOREIGN KEY ("droneId") REFERENCES "Drone" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Alert" ("confidence", "createdAt", "id", "image", "message", "type") SELECT "confidence", "createdAt", "id", "image", "message", "type" FROM "Alert";
DROP TABLE "Alert";
ALTER TABLE "new_Alert" RENAME TO "Alert";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Area_area_id_key" ON "Area"("area_id");

-- CreateIndex
CREATE UNIQUE INDEX "Drone_drone_id_key" ON "Drone"("drone_id");

-- CreateIndex
CREATE UNIQUE INDEX "Sensor_sensor_id_key" ON "Sensor"("sensor_id");
