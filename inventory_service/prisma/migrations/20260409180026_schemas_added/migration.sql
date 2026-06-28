-- CreateTable
CREATE TABLE `EventInventory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `eventId` INTEGER NOT NULL,
    `ticketTypeId` INTEGER NOT NULL,
    `totalQuantity` INTEGER NOT NULL,
    `availableQuantity` INTEGER NOT NULL,
    `reservedQuantity` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `EventInventory_eventId_idx`(`eventId`),
    INDEX `EventInventory_ticketTypeId_idx`(`ticketTypeId`),
    UNIQUE INDEX `EventInventory_eventId_ticketTypeId_key`(`eventId`, `ticketTypeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InventoryHold` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `inventoryId` INTEGER NOT NULL,
    `eventId` INTEGER NOT NULL,
    `ticketTypeId` INTEGER NOT NULL,
    `bookingId` INTEGER NULL,
    `userId` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `status` ENUM('ACTIVE', 'EXPIRED', 'RELEASED', 'CONFIRMED') NOT NULL DEFAULT 'ACTIVE',
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `InventoryHold_inventoryId_idx`(`inventoryId`),
    INDEX `InventoryHold_eventId_idx`(`eventId`),
    INDEX `InventoryHold_ticketTypeId_idx`(`ticketTypeId`),
    INDEX `InventoryHold_bookingId_idx`(`bookingId`),
    INDEX `InventoryHold_userId_idx`(`userId`),
    INDEX `InventoryHold_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `InventoryHold` ADD CONSTRAINT `InventoryHold_inventoryId_fkey` FOREIGN KEY (`inventoryId`) REFERENCES `EventInventory`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
