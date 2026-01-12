
-- ... (conteúdo anterior mantido)

-- 12. NOTIFICAÇÕES E ALERTAS PUSH
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT DEFAULT NULL, -- NULL para broadcast geral
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `type` ENUM('INFO', 'ALERT', 'SUCCESS', 'URGENT') DEFAULT 'INFO',
  `is_read` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_read` (`user_id`, `is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
