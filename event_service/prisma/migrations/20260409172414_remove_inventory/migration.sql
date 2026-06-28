/*
  Warnings:

  - You are about to drop the `eventinventory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `inventoryhold` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `initialStock` to the `EventTicketType` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `eventinventory` DROP FOREIGN KEY `EventInventory_eventId_fkey`;

-- DropForeignKey
ALTER TABLE `eventinventory` DROP FOREIGN KEY `EventInventory_ticketTypeId_fkey`;

-- DropForeignKey
ALTER TABLE `inventoryhold` DROP FOREIGN KEY `InventoryHold_eventId_fkey`;

-- DropForeignKey
ALTER TABLE `inventoryhold` DROP FOREIGN KEY `InventoryHold_ticketTypeId_fkey`;

-- AlterTable
ALTER TABLE `eventtickettype` ADD COLUMN `initialStock` INTEGER NOT NULL;

-- DropTable
DROP TABLE `eventinventory`;

-- DropTable
DROP TABLE `inventoryhold`;
