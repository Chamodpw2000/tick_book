/*
  Warnings:

  - You are about to drop the column `method` on the `payment` table. All the data in the column will be lost.
  - You are about to drop the column `transactionId` on the `payment` table. All the data in the column will be lost.
  - Added the required column `bookingId` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `eventId` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentMethod` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `providerName` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `Payment_transactionId_key` ON `Payment`;

-- AlterTable
ALTER TABLE `Payment` DROP COLUMN `method`,
    DROP COLUMN `transactionId`,
    ADD COLUMN `bookingId` INTEGER NOT NULL,
    ADD COLUMN `eventId` INTEGER NOT NULL,
    ADD COLUMN `paymentMethod` VARCHAR(191) NOT NULL,
    ADD COLUMN `providerName` VARCHAR(191) NOT NULL,
    ADD COLUMN `providerReference` VARCHAR(191) NULL,
    ADD COLUMN `userId` INTEGER NOT NULL,
    MODIFY `amount` DECIMAL(10, 2) NOT NULL;

-- CreateTable
CREATE TABLE `PaymentTransaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `paymentId` INTEGER NOT NULL,
    `transactionType` VARCHAR(191) NOT NULL,
    `providerReference` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL,
    `responsePayload` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PaymentTransaction_paymentId_idx`(`paymentId`),
    INDEX `PaymentTransaction_transactionType_idx`(`transactionType`),
    INDEX `PaymentTransaction_status_idx`(`status`),
    INDEX `PaymentTransaction_providerReference_idx`(`providerReference`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Refund` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `paymentId` INTEGER NOT NULL,
    `bookingId` INTEGER NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `reason` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Refund_paymentId_idx`(`paymentId`),
    INDEX `Refund_bookingId_idx`(`bookingId`),
    INDEX `Refund_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Payment_bookingId_idx` ON `Payment`(`bookingId`);

-- CreateIndex
CREATE INDEX `Payment_userId_idx` ON `Payment`(`userId`);

-- CreateIndex
CREATE INDEX `Payment_eventId_idx` ON `Payment`(`eventId`);

-- CreateIndex
CREATE INDEX `Payment_providerReference_idx` ON `Payment`(`providerReference`);

-- AddForeignKey
ALTER TABLE `PaymentTransaction` ADD CONSTRAINT `PaymentTransaction_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `Payment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Refund` ADD CONSTRAINT `Refund_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `Payment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
