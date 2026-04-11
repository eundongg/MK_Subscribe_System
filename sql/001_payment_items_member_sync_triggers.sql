-- payment_items.member_no 는 payment.member_no 와 항상 일치해야 함.
-- 앱에서 잘못 넣어도 INSERT/UPDATE 시 payment 기준으로 덮어씀.
-- payment.member_no 가 바뀌면 해당 결제의 payment_items 도 같이 갱신.

DROP TRIGGER IF EXISTS payment_items_bi_sync_member;
DROP TRIGGER IF EXISTS payment_items_bu_sync_member;
DROP TRIGGER IF EXISTS payment_au_sync_items_member;

DELIMITER $$

CREATE TRIGGER payment_items_bi_sync_member
BEFORE INSERT ON payment_items
FOR EACH ROW
BEGIN
  DECLARE v_member_no INT;

  SELECT p.member_no INTO v_member_no
  FROM payment p
  WHERE p.payment_no = NEW.payment_no
  LIMIT 1;

  IF v_member_no IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'payment_items: payment_no not found in payment';
  END IF;

  SET NEW.member_no = v_member_no;
END$$

CREATE TRIGGER payment_items_bu_sync_member
BEFORE UPDATE ON payment_items
FOR EACH ROW
BEGIN
  DECLARE v_member_no INT;

  SELECT p.member_no INTO v_member_no
  FROM payment p
  WHERE p.payment_no = NEW.payment_no
  LIMIT 1;

  IF v_member_no IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'payment_items: payment_no not found in payment';
  END IF;

  SET NEW.member_no = v_member_no;
END$$

CREATE TRIGGER payment_au_sync_items_member
AFTER UPDATE ON payment
FOR EACH ROW
BEGIN
  IF NEW.member_no <> OLD.member_no THEN
    UPDATE payment_items
    SET member_no = NEW.member_no
    WHERE payment_no = NEW.payment_no;
  END IF;
END$$

DELIMITER ;
