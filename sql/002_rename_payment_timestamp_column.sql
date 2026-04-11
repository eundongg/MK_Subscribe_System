-- payment 테이블: 타임스탬프 컬럼명이 테이블명과 겹쳐 혼동됨 → payment_date 로 변경
-- 기존 정의: `payment` timestamp NULL DEFAULT CURRENT_TIMESTAMP

ALTER TABLE `payment`
  CHANGE COLUMN `payment` `payment_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP;
