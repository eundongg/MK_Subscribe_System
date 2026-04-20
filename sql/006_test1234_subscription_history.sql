-- test1234 회원 구독 이력 시드
-- 매경e신문: 6개월권 5회 (누적 30개월)
-- 매경이코노미: 12개월권 2회 (누적 24개월)
-- 매경럭스멘: 12개월권 1회 (누적 12개월)
--
-- 재실행 시 test1234 회원의 기존 결제·구독( payment / payment_items ) 전부 삭제 후 다시 넣습니다.

SET NAMES utf8mb4;

START TRANSACTION;

DELETE pi FROM payment_items pi
INNER JOIN payment p ON pi.payment_no = p.payment_no
INNER JOIN user u ON u.member_no = p.member_no
WHERE u.login_id = 'test1234';

DELETE p FROM payment p
INNER JOIN user u ON u.member_no = p.member_no
WHERE u.login_id = 'test1234';

SET @m := (SELECT member_no FROM user WHERE login_id = 'test1234' LIMIT 1);
SET @card := (SELECT method_id FROM payment_method WHERE method_code = 'CARD' LIMIT 1);

-- 매경e신문(6개월) × 5회 — 기간을 이어 붙인 이력 (마지막 구독은 진행 중)
INSERT INTO payment (member_no, method_id, total_price, payment_date) VALUES (@m, @card, 86400, '2024-04-01 09:00:00');
SET @pay := LAST_INSERT_ID();
INSERT INTO payment_items (payment_no, product_no, price_at_billing, start_date, end_date, status)
VALUES (@pay, 3, 86400, '2024-04-01', '2024-10-01', 'EXPIRED');

INSERT INTO payment (member_no, method_id, total_price, payment_date) VALUES (@m, @card, 86400, '2024-10-01 09:00:00');
SET @pay := LAST_INSERT_ID();
INSERT INTO payment_items (payment_no, product_no, price_at_billing, start_date, end_date, status)
VALUES (@pay, 3, 86400, '2024-10-01', '2025-04-01', 'EXPIRED');

INSERT INTO payment (member_no, method_id, total_price, payment_date) VALUES (@m, @card, 86400, '2025-04-01 09:00:00');
SET @pay := LAST_INSERT_ID();
INSERT INTO payment_items (payment_no, product_no, price_at_billing, start_date, end_date, status)
VALUES (@pay, 3, 86400, '2025-04-01', '2025-10-01', 'EXPIRED');

INSERT INTO payment (member_no, method_id, total_price, payment_date) VALUES (@m, @card, 86400, '2025-10-01 09:00:00');
SET @pay := LAST_INSERT_ID();
INSERT INTO payment_items (payment_no, product_no, price_at_billing, start_date, end_date, status)
VALUES (@pay, 3, 86400, '2025-10-01', '2026-04-01', 'EXPIRED');

INSERT INTO payment (member_no, method_id, total_price, payment_date) VALUES (@m, @card, 86400, '2026-04-01 09:00:00');
SET @pay := LAST_INSERT_ID();
INSERT INTO payment_items (payment_no, product_no, price_at_billing, start_date, end_date, status)
VALUES (@pay, 3, 86400, '2026-04-01', '2026-10-01', 'ING');

-- 매경이코노미(12개월) × 2회 (1회차 만료, 2회차는 구독 진행 중 — end_date 가 오늘 이후)
INSERT INTO payment (member_no, method_id, total_price, payment_date) VALUES (@m, @card, 180000, '2024-05-01 10:00:00');
SET @pay := LAST_INSERT_ID();
INSERT INTO payment_items (payment_no, product_no, price_at_billing, start_date, end_date, status)
VALUES (@pay, 4, 180000, '2024-05-01', '2025-05-01', 'EXPIRED');

INSERT INTO payment (member_no, method_id, total_price, payment_date) VALUES (@m, @card, 180000, '2025-05-01 10:00:00');
SET @pay := LAST_INSERT_ID();
INSERT INTO payment_items (payment_no, product_no, price_at_billing, start_date, end_date, status)
VALUES (@pay, 4, 180000, '2025-05-01', '2026-05-01', 'ING');

-- 매경럭스멘(12개월) × 1회 (진행 중)
INSERT INTO payment (member_no, method_id, total_price, payment_date) VALUES (@m, @card, 156000, '2025-08-01 11:00:00');
SET @pay := LAST_INSERT_ID();
INSERT INTO payment_items (payment_no, product_no, price_at_billing, start_date, end_date, status)
VALUES (@pay, 5, 156000, '2025-08-01', '2026-08-01', 'ING');

COMMIT;
