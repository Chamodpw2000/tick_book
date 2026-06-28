/*
  Warnings:

  - You are about to drop the column `booking_reference` on the `booking` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `booking` table. All the data in the column will be lost.
  - You are about to drop the column `event_id` on the `booking` table. All the data in the column will be lost.
  - You are about to drop the column `payment_status` on the `booking` table. All the data in the column will be lost.
  - You are about to drop the column `total_amount` on the `booking` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `booking` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `booking` table. All the data in the column will be lost.
  - You are about to drop the column `booking_id` on the `ticket` table. All the data in the column will be lost.
  - You are about to drop the column `event_id` on the `ticket` table. All the data in the column will be lost.
  - You are about to drop the column `issued_at` on the `ticket` table. All the data in the column will be lost.
  - You are about to drop the column `ticket_code` on the `ticket` table. All the data in the column will be lost.
  - You are about to drop the column `ticket_status` on the `ticket` table. All the data in the column will be lost.
  - You are about to drop the column `ticket_type_id` on the `ticket` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `ticket` table. All the data in the column will be lost.
  - You are about to drop the `booking_item` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `booking_status_history` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ticket_file` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ticket_validation_log` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[bookingReference]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[ticketCode]` on the table `Ticket` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `bookingReference` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `eventId` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentStatus` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalAmount` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bookingId` to the `Ticket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `eventId` to the `Ticket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ticketCode` to the `Ticket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ticketTypeId` to the `Ticket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Ticket` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `booking_item` DROP FOREIGN KEY `booking_item_booking_id_fkey`;

-- DropForeignKey
ALTER TABLE `booking_status_history` DROP FOREIGN KEY `booking_status_history_booking_id_fkey`;

-- DropForeignKey
ALTER TABLE `ticket` DROP FOREIGN KEY `ticket_booking_id_fkey`;

-- DropForeignKey
ALTER TABLE `ticket_file` DROP FOREIGN KEY `ticket_file_ticket_id_fkey`;

-- DropForeignKey
ALTER TABLE `ticket_validation_log` DROP FOREIGN KEY `ticket_validation_log_ticket_id_fkey`;

-- DropIndex
DROP INDEX `booking_booking_reference_key` ON `booking`;

-- DropIndex
DROP INDEX `booking_event_id_idx` ON `booking`;

-- DropIndex
DROP INDEX `booking_user_id_idx` ON `booking`;

-- DropIndex
DROP INDEX `ticket_booking_id_idx` ON `ticket`;

-- DropIndex
DROP INDEX `ticket_event_id_idx` ON `ticket`;

-- DropIndex
DROP INDEX `ticket_ticket_code_key` ON `ticket`;

-- DropIndex
DROP INDEX `ticket_ticket_type_id_idx` ON `ticket`;

-- DropIndex
DROP INDEX `ticket_user_id_idx` ON `ticket`;

-- AlterTable
ALTER TABLE `booking` DROP COLUMN `booking_reference`,
    DROP COLUMN `created_at`,
    DROP COLUMN `event_id`,
    DROP COLUMN `payment_status`,
    DROP COLUMN `total_amount`,
    DROP COLUMN `updated_at`,
    DROP COLUMN `user_id`,
    ADD COLUMN `bookingReference` VARCHAR(100) NOT NULL,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `eventId` INTEGER NOT NULL,
    ADD COLUMN `paymentStatus` VARCHAR(50) NOT NULL,
    ADD COLUMN `totalAmount` DECIMAL(10, 2) NOT NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    ADD COLUMN `userId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `ticket` DROP COLUMN `booking_id`,
    DROP COLUMN `event_id`,
    DROP COLUMN `issued_at`,
    DROP COLUMN `ticket_code`,
    DROP COLUMN `ticket_status`,
    DROP COLUMN `ticket_type_id`,
    DROP COLUMN `user_id`,
    ADD COLUMN `bookingId` INTEGER NOT NULL,
    ADD COLUMN `eventId` INTEGER NOT NULL,
    ADD COLUMN `issuedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `ticketCode` VARCHAR(120) NOT NULL,
    ADD COLUMN `ticketStatus` ENUM('ISSUED', 'USED', 'CANCELLED') NOT NULL DEFAULT 'ISSUED',
    ADD COLUMN `ticketTypeId` INTEGER NOT NULL,
    ADD COLUMN `userId` INTEGER NOT NULL;

-- DropTable
DROP TABLE `booking_item`;

-- DropTable
DROP TABLE `booking_status_history`;

-- DropTable
DROP TABLE `ticket_file`;

-- DropTable
DROP TABLE `ticket_validation_log`;

-- CreateTable
CREATE TABLE `BookingItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bookingId` INTEGER NOT NULL,
    `ticketTypeId` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `unitPrice` DECIMAL(10, 2) NOT NULL,
    `subtotal` DECIMAL(10, 2) NOT NULL,

    INDEX `BookingItem_bookingId_idx`(`bookingId`),
    INDEX `BookingItem_ticketTypeId_idx`(`ticketTypeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BookingStatusHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bookingId` INTEGER NOT NULL,
    `oldStatus` ENUM('PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED') NOT NULL,
    `newStatus` ENUM('PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED') NOT NULL,
    `changedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reason` VARCHAR(255) NULL,

    INDEX `BookingStatusHistory_bookingId_idx`(`bookingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TicketFile` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ticketId` INTEGER NOT NULL,
    `fileType` VARCHAR(50) NOT NULL,
    `s3Url` VARCHAR(500) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TicketFile_ticketId_idx`(`ticketId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TicketValidationLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ticketId` INTEGER NOT NULL,
    `validatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `validatedBy` VARCHAR(120) NOT NULL,
    `result` VARCHAR(60) NOT NULL,

    INDEX `TicketValidationLog_ticketId_idx`(`ticketId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Booking_bookingReference_key` ON `Booking`(`bookingReference`);

-- CreateIndex
CREATE INDEX `Booking_userId_idx` ON `Booking`(`userId`);

-- CreateIndex
CREATE INDEX `Booking_eventId_idx` ON `Booking`(`eventId`);

-- CreateIndex
CREATE UNIQUE INDEX `Ticket_ticketCode_key` ON `Ticket`(`ticketCode`);

-- CreateIndex
CREATE INDEX `Ticket_bookingId_idx` ON `Ticket`(`bookingId`);

-- CreateIndex
CREATE INDEX `Ticket_userId_idx` ON `Ticket`(`userId`);

-- CreateIndex
CREATE INDEX `Ticket_eventId_idx` ON `Ticket`(`eventId`);

-- CreateIndex
CREATE INDEX `Ticket_ticketTypeId_idx` ON `Ticket`(`ticketTypeId`);

-- AddForeignKey
ALTER TABLE `BookingItem` ADD CONSTRAINT `BookingItem_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `Booking`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BookingStatusHistory` ADD CONSTRAINT `BookingStatusHistory_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `Booking`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ticket` ADD CONSTRAINT `Ticket_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `Booking`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TicketFile` ADD CONSTRAINT `TicketFile_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `Ticket`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TicketValidationLog` ADD CONSTRAINT `TicketValidationLog_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `Ticket`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
