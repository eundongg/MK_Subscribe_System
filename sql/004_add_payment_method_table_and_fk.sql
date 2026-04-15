-- 결제 수단 마스터 테이블 생성 및 payment 테이블 FK 연결

CREATE TABLE IF NOT EXISTS `payment_method` (
  `method_id` int NOT NULL AUTO_INCREMENT,
  `method_code` varchar(30) NOT NULL,
  `method_name` varchar(50) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`method_id`),
  UNIQUE KEY `uk_payment_method_code` (`method_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `payment_method` (`method_code`, `method_name`)
VALUES
  ('CARD', '신용/체크카드'),
  ('BANK_TRANSFER', '계좌이체'),
  ('KAKAO_PAY', '카카오페이'),
  ('NAVER_PAY', '네이버페이')
ON DUPLICATE KEY UPDATE
  `method_name` = VALUES(`method_name`);

ALTER TABLE `payment`
  ADD COLUMN `method_id` int NULL AFTER `member_no`;

UPDATE `payment`
SET `method_id` = (
  SELECT pm.method_id
  FROM payment_method pm
  WHERE pm.method_code = 'CARD'
)
WHERE `method_id` IS NULL;

ALTER TABLE `payment`
  MODIFY COLUMN `method_id` int NOT NULL;

ALTER TABLE `payment`
  ADD KEY `idx_payment_method_id` (`method_id`);

ALTER TABLE `payment`
  ADD CONSTRAINT `fk_payment_method`
  FOREIGN KEY (`method_id`) REFERENCES `payment_method` (`method_id`);
