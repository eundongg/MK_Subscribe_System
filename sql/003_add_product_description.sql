-- product 테이블에 상품 설명 컬럼 추가
-- 이미 존재하면 ALTER 실패 → 한 번만 실행

ALTER TABLE `product`
  ADD COLUMN `description` text NULL
  AFTER `product_name`;
