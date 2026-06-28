-- DropForeignKey
ALTER TABLE `ticket` DROP FOREIGN KEY `Ticket_booking_id_fkey`;

-- AddForeignKey
ALTER TABLE `ticket` ADD CONSTRAINT `ticket_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `booking`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `ticket` RENAME INDEX `Ticket_booking_id_idx` TO `ticket_booking_id_idx`;

-- RenameIndex
ALTER TABLE `ticket` RENAME INDEX `Ticket_event_id_idx` TO `ticket_event_id_idx`;

-- RenameIndex
ALTER TABLE `ticket` RENAME INDEX `Ticket_ticket_code_key` TO `ticket_ticket_code_key`;

-- RenameIndex
ALTER TABLE `ticket` RENAME INDEX `Ticket_ticket_type_id_idx` TO `ticket_ticket_type_id_idx`;

-- RenameIndex
ALTER TABLE `ticket` RENAME INDEX `Ticket_user_id_idx` TO `ticket_user_id_idx`;
