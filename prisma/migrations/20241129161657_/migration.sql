/*
  Warnings:

  - You are about to drop the `Avatar` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dailyActiveHours" INTEGER DEFAULT 0,
ADD COLUMN     "totalActiveDays" INTEGER DEFAULT 0,
ADD COLUMN     "totalActiveHours" INTEGER DEFAULT 0;

-- DropTable
DROP TABLE "Avatar";
