/*
  Warnings:

  - You are about to drop the column `createdAt` on the `ticket` table. All the data in the column will be lost.
  - You are about to drop the column `eventId` on the `ticket` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `ticket` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `ticket` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `ticket` table. All the data in the column will be lost.
  - You are about to drop the column `totalPrice` on the `ticket` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `ticket` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `ticket` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[ticket_code]` on the table `ticket` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `booking_id` to the `ticket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `event_id` to the `ticket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ticket_code` to the `ticket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ticket_type_id` to the `ticket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `ticket` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Ticket` DROP COLUMN `createdAt`,
    DROP COLUMN `eventId`,
    DROP COLUMN `price`,
    DROP COLUMN `quantity`,
    DROP COLUMN `status`,
    DROP COLUMN `totalPrice`,
    DROP COLUMN `updatedAt`,
    DROP COLUMN `userId`,
    ADD COLUMN `booking_id` INTEGER NOT NULL,
    ADD COLUMN `event_id` INTEGER NOT NULL,
    ADD COLUMN `issued_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `seat_id` INTEGER NULL,
    ADD COLUMN `ticket_code` VARCHAR(120) NOT NULL,
    ADD COLUMN `ticket_status` ENUM('ISSUED', 'USED', 'CANCELLED') NOT NULL DEFAULT 'ISSUED',
    ADD COLUMN `ticket_type_id` INTEGER NOT NULL,
    ADD COLUMN `user_id` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `booking` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `event_id` INTEGER NOT NULL,
    `booking_reference` VARCHAR(100) NOT NULL,
    `status` ENUM('PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `total_amount` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(3) NOT NULL,
    `payment_status` VARCHAR(50) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `booking_booking_reference_key`(`booking_reference`),
    INDEX `booking_user_id_idx`(`user_id`),
    INDEX `booking_event_id_idx`(`event_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `booking_item` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `booking_id` INTEGER NOT NULL,
    `ticket_type_id` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `unit_price` DECIMAL(10, 2) NOT NULL,
    `subtotal` DECIMAL(10, 2) NOT NULL,

    INDEX `booking_item_booking_id_idx`(`booking_id`),
    INDEX `booking_item_ticket_type_id_idx`(`ticket_type_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `booking_status_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `booking_id` INTEGER NOT NULL,
    `old_status` ENUM('PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED') NOT NULL,
    `new_status` ENUM('PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED') NOT NULL,
    `changed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reason` VARCHAR(255) NULL,

    INDEX `booking_status_history_booking_id_idx`(`booking_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ticket_file` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ticket_id` INTEGER NOT NULL,
    `file_type` VARCHAR(50) NOT NULL,
    `s3_url` VARCHAR(500) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ticket_file_ticket_id_idx`(`ticket_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ticket_validation_log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ticket_id` INTEGER NOT NULL,
    `validated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `validated_by` VARCHAR(120) NOT NULL,
    `result` VARCHAR(60) NOT NULL,

    INDEX `ticket_validation_log_ticket_id_idx`(`ticket_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Ticket_ticket_code_key` ON `Ticket`(`ticket_code`);

-- CreateIndex
CREATE INDEX `Ticket_booking_id_idx` ON `Ticket`(`booking_id`);

-- CreateIndex
CREATE INDEX `Ticket_user_id_idx` ON `Ticket`(`user_id`);

-- CreateIndex
CREATE INDEX `Ticket_event_id_idx` ON `Ticket`(`event_id`);

-- CreateIndex
CREATE INDEX `Ticket_ticket_type_id_idx` ON `Ticket`(`ticket_type_id`);

-- AddForeignKey
ALTER TABLE `booking_item` ADD CONSTRAINT `booking_item_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `booking`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `booking_status_history` ADD CONSTRAINT `booking_status_history_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `booking`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ticket` ADD CONSTRAINT `Ticket_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `booking`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ticket_file` ADD CONSTRAINT `ticket_file_ticket_id_fkey` FOREIGN KEY (`ticket_id`) REFERENCES `Ticket`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ticket_validation_log` ADD CONSTRAINT `ticket_validation_log_ticket_id_fkey` FOREIGN KEY (`ticket_id`) REFERENCES `Ticket`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
