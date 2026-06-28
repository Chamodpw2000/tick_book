/*
  Warnings:

  - You are about to drop the column `responsePayload` on the `paymenttransaction` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[paymentId]` on the table `Refund` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `paymenttransaction` DROP COLUMN `responsePayload`;

-- CreateIndex
CREATE UNIQUE INDEX `Refund_paymentId_key` ON `Refund`(`paymentId`);
