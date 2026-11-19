/*
  Warnings:

  - You are about to drop the column `conset` on the `Entry` table. All the data in the column will be lost.
  - Added the required column `consent` to the `Entry` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Entry" DROP COLUMN "conset",
ADD COLUMN     "consent" BOOLEAN NOT NULL;
