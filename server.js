// server.js
const express = require('express');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const db = require('./database'); // 방금 만든 database.js를 불러옵니다.
const app = express();
const port = 3000;

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET 환경변수가 필요합니다. .env 파일에 SESSION_SECRET을 설정하세요.');
}

app.use(express.static('resources'));
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(results);
    });
  });
}

function toSessionUser(user) {
  return {
    member_no: user.member_no,
    login_id: user.login_id,
    name: user.name,
    status: user.status,
    is_admin: Boolean(user.is_admin),
  };
}

function isPasswordValid(password) {
  if (typeof password !== 'string' || password.length < 8) {
    return false;
  }
  if (/\s/.test(password)) {
    return false;
  }
  const hasLetter = /\p{L}/u.test(password);
  const hasDigit = /\p{N}/u.test(password);
  return hasLetter && hasDigit;
}

function requireAuth(req, res, next) {
  if (!req.session.user) {
    res.status(401).json({ message: '로그인이 필요합니다.' });
    return;
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user) {
    res.status(401).json({ message: '로그인이 필요합니다.' });
    return;
  }
  if (!req.session.user.is_admin) {
    res.status(403).json({ message: '관리자 권한이 필요합니다.' });
    return;
  }
  next();
}

async function getUserStatusEnumValues() {
  const rows = await query("SHOW COLUMNS FROM user LIKE 'status'");
  const type = rows?.[0]?.Type || "";
  const matches = [...String(type).matchAll(/'([^']+)'/g)];
  return matches.map((m) => m[1].toUpperCase());
}

async function signup(req, res) {
  const { loginId, password, name } = req.body ?? {};

  if (!loginId || !password || !name) {
    res.status(400).json({ message: '필수 항목이 누락되었습니다.' });
    return;
  }
  if (!isPasswordValid(password)) {
    res.status(400).json({ message: '비밀번호 형식이 올바르지 않습니다.' });
    return;
  }

  try {
    const exists = await query('SELECT member_no FROM user WHERE login_id = ? LIMIT 1', [loginId]);
    if (exists.length > 0) {
      res.status(409).json({ message: '이미 사용 중인 아이디입니다.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const insertResult = await query(
      `
      INSERT INTO user (login_id, password, name, age, status)
      VALUES (?, ?, ?, ?, ?)
      `,
      [loginId, hashedPassword, name, 0, 'ACTIVE']
    );

    const users = await query(
      'SELECT member_no, login_id, name, status, is_admin FROM user WHERE member_no = ? LIMIT 1',
      [insertResult.insertId]
    );
    const user = users[0];
    req.session.user = toSessionUser(user);
    res.status(201).json({ user: req.session.user });
  } catch (err) {
    console.error('회원가입 에러:', err);
    res.status(500).json({ message: '회원가입에 실패했습니다.' });
  }
}

async function login(req, res) {
  const { loginId, password } = req.body ?? {};
  if (!loginId || !password) {
    res.status(400).json({ message: '아이디/비밀번호를 입력하세요.' });
    return;
  }

  try {
    const users = await query(
      'SELECT member_no, login_id, password, name, status, is_admin FROM user WHERE login_id = ? LIMIT 1',
      [loginId]
    );
    if (users.length === 0) {
      res.status(401).json({ message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
      return;
    }

    const user = users[0];
    let isMatched = false;
    if (typeof user.password === 'string' && user.password.startsWith('$2')) {
      isMatched = await bcrypt.compare(password, user.password);
    } else {
      isMatched = user.password === password;
      if (isMatched) {
        const upgradedHash = await bcrypt.hash(password, 10);
        await query('UPDATE user SET password = ?, updated_at = NOW() WHERE member_no = ?', [
          upgradedHash,
          user.member_no,
        ]);
      }
    }

    if (!isMatched) {
      res.status(401).json({ message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
      return;
    }

    req.session.user = toSessionUser(user);
    res.json({ user: req.session.user });
  } catch (err) {
    console.error('로그인 에러:', err);
    res.status(500).json({ message: '로그인에 실패했습니다.' });
  }
}

function logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      console.error('로그아웃 에러:', err);
      res.status(500).json({ message: '로그아웃에 실패했습니다.' });
      return;
    }
    res.clearCookie('connect.sid');
    res.status(204).send();
  });
}

async function me(req, res) {
  if (!req.session.user) {
    res.json({ user: null });
    return;
  }

  try {
    const rows = await query(
      'SELECT member_no, login_id, name, status, is_admin FROM user WHERE member_no = ? LIMIT 1',
      [req.session.user.member_no]
    );
    if (rows.length === 0) {
      req.session.user = null;
      res.json({ user: null });
      return;
    }
    const sessionUser = toSessionUser(rows[0]);
    req.session.user = sessionUser;
    res.json({ user: sessionUser });
  } catch (err) {
    console.error('내 정보 조회 에러:', err);
    res.status(500).json({ message: '내 정보 조회에 실패했습니다.' });
  }
}

async function checkLoginId(req, res) {
  const loginId = (req.query.loginId || '').trim();
  if (!loginId) {
    res.status(400).json({ message: '아이디를 입력하세요.' });
    return;
  }

  try {
    const rows = await query('SELECT member_no FROM user WHERE login_id = ? LIMIT 1', [loginId]);
    res.json({ available: rows.length === 0 });
  } catch (err) {
    console.error('아이디 중복 확인 에러:', err);
    res.status(500).json({ message: '아이디 중복 확인에 실패했습니다.' });
  }
}

async function getUsers(req, res) {
  const rawLimit = Number(req.query.limit);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 50) : 10;
  const rawCursor = Number(req.query.cursor);
  const cursor = Number.isFinite(rawCursor) && rawCursor > 0 ? rawCursor : null;
  const keyword = String(req.query.keyword || '').trim();
  const status = String(req.query.status || 'ALL').trim().toUpperCase();
  const role = String(req.query.role || 'ALL').trim().toUpperCase();

  const where = [];
  const whereParams = [];

  if (keyword) {
    where.push('(u.name LIKE ? OR u.login_id LIKE ?)');
    whereParams.push(`%${keyword}%`, `%${keyword}%`);
  }

  if (status !== 'ALL') {
    const statusDbMap = {
      ACTIVE: ['ACTIVE'],
      DORMANT: ['DORMANT', 'INACTIVE', 'SLEEP'],
      SUSPENDED: ['SUSPENDED', 'DELETED'],
      INACTIVE: ['INACTIVE', 'SLEEP'],
      SLEEP: ['SLEEP'],
      DELETED: ['DELETED'],
    };
    const allowed = statusDbMap[status];
    if (!allowed || allowed.length === 0) {
      res.status(400).json({ message: '상태 필터 값이 올바르지 않습니다.' });
      return;
    }
    const placeholders = allowed.map(() => '?').join(', ');
    where.push(`u.status IN (${placeholders})`);
    whereParams.push(...allowed);
  }

  if (role === 'ADMIN') {
    where.push('u.is_admin = 1');
  } else if (role === 'USER') {
    where.push('u.is_admin = 0');
  } else if (role !== 'ALL') {
    res.status(400).json({ message: '권한 필터 값이 올바르지 않습니다.' });
    return;
  }

  if (cursor) {
    where.push('u.member_no < ?');
    whereParams.push(cursor);
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  const listSql = `
    SELECT
      u.member_no,
      u.name,
      u.login_id,
      u.status,
      u.is_admin,
      u.created_at,
      COALESCE(pay.payment_count, 0) AS payment_count,
      COALESCE(pay.total_paid, 0) AS total_paid,
      pay.last_payment_date,
      COALESCE(sub.active_subscription_count, 0) AS active_subscription_count
    FROM user u
    LEFT JOIN (
      SELECT
        member_no,
        COUNT(*) AS payment_count,
        SUM(total_price) AS total_paid,
        MAX(payment_date) AS last_payment_date
      FROM payment
      GROUP BY member_no
    ) pay ON pay.member_no = u.member_no
    LEFT JOIN (
      SELECT
        p.member_no,
        COUNT(*) AS active_subscription_count
      FROM payment_items pi
      INNER JOIN payment p ON p.payment_no = pi.payment_no
      WHERE pi.status = 'ING'
        AND (pi.end_date IS NULL OR pi.end_date >= CURDATE())
      GROUP BY p.member_no
    ) sub ON sub.member_no = u.member_no
    ${whereClause}
    ORDER BY u.member_no DESC
    LIMIT ?
  `;

  const countWhere = where.filter((w) => w !== 'u.member_no < ?');
  const countParams = cursor ? whereParams.slice(0, -1) : [...whereParams];
  const countClause = countWhere.length > 0 ? `WHERE ${countWhere.join(' AND ')}` : '';
  const countSql = `SELECT COUNT(*) AS total_count FROM user u ${countClause}`;

  try {
    const rows = await query(listSql, [...whereParams, limit + 1]);
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? items[items.length - 1]?.member_no || null : null;
    const countRows = await query(countSql, countParams);
    const totalCount = Number(countRows?.[0]?.total_count || 0);
    res.json({
      items,
      nextCursor,
      hasMore,
      limit,
      totalCount,
    });
  } catch (err) {
    console.error('회원 조회 에러:', err);
    res.status(500).json({ message: '회원 조회 실패' });
  }
}

async function getUserDetail(req, res) {
  const memberNo = Number(req.params.memberNo);
  if (!Number.isFinite(memberNo) || memberNo <= 0) {
    res.status(400).json({ message: '유효하지 않은 회원 번호입니다.' });
    return;
  }

  const userSql = `
    SELECT
      u.member_no,
      u.name,
      u.login_id,
      u.status,
      u.is_admin,
      u.created_at,
      COALESCE(pay.payment_count, 0) AS payment_count,
      COALESCE(pay.total_paid, 0) AS total_paid,
      pay.last_payment_date,
      COALESCE(sub.active_subscription_count, 0) AS active_subscription_count,
      sub.next_expiry_date
    FROM user u
    LEFT JOIN (
      SELECT
        member_no,
        COUNT(*) AS payment_count,
        SUM(total_price) AS total_paid,
        MAX(payment_date) AS last_payment_date
      FROM payment
      GROUP BY member_no
    ) pay ON pay.member_no = u.member_no
    LEFT JOIN (
      SELECT
        p.member_no,
        COUNT(*) AS active_subscription_count,
        MIN(pi.end_date) AS next_expiry_date
      FROM payment_items pi
      INNER JOIN payment p ON p.payment_no = pi.payment_no
      WHERE pi.status = 'ING'
        AND (pi.end_date IS NULL OR pi.end_date >= CURDATE())
      GROUP BY p.member_no
    ) sub ON sub.member_no = u.member_no
    WHERE u.member_no = ?
    LIMIT 1
  `;

  const productSummarySql = `
    SELECT
      pr.product_name,
      COUNT(*) AS active_count
    FROM payment_items pi
    INNER JOIN payment p ON p.payment_no = pi.payment_no
    INNER JOIN product pr ON pr.product_no = pi.product_no
    WHERE p.member_no = ?
      AND pi.status = 'ING'
      AND (pi.end_date IS NULL OR pi.end_date >= CURDATE())
    GROUP BY pr.product_name
    ORDER BY active_count DESC, pr.product_name ASC
  `;

  try {
    const rows = await query(userSql, [memberNo]);
    if (rows.length === 0) {
      res.status(404).json({ message: '회원을 찾을 수 없습니다.' });
      return;
    }
    const activeProducts = await query(productSummarySql, [memberNo]);
    res.json({
      user: rows[0],
      activeProducts: Array.isArray(activeProducts) ? activeProducts : [],
    });
  } catch (err) {
    console.error('회원 상세 조회 에러:', err);
    res.status(500).json({ message: '회원 상세 조회 실패' });
  }
}

async function updateUserAdminSettings(req, res) {
  const memberNo = Number(req.params.memberNo);
  const { status, is_admin: isAdmin } = req.body ?? {};

  if (!Number.isFinite(memberNo) || memberNo <= 0) {
    res.status(400).json({ message: '유효하지 않은 회원 번호입니다.' });
    return;
  }

  const statusMap = {
    ACTIVE: 'ACTIVE',
    DORMANT: 'DORMANT',
    SUSPENDED: 'SUSPENDED',
    SLEEP: 'DORMANT',
    DELETED: 'SUSPENDED',
  };
  const requestedStatus = statusMap[String(status || '').toUpperCase()];
  if (!requestedStatus) {
    res.status(400).json({ message: '상태 값이 올바르지 않습니다.' });
    return;
  }
  if (typeof isAdmin !== 'boolean') {
    res.status(400).json({ message: '관리자 권한 값이 올바르지 않습니다.' });
    return;
  }
  if (req.session.user?.member_no === memberNo && !isAdmin) {
    res.status(400).json({ message: '본인 관리자 권한은 해제할 수 없습니다.' });
    return;
  }

  try {
    const allowedStatuses = await getUserStatusEnumValues();
    let dbStatus = requestedStatus;
    if (requestedStatus === 'DORMANT' && !allowedStatuses.includes('DORMANT')) {
      if (allowedStatuses.includes('SLEEP')) dbStatus = 'SLEEP';
      else if (allowedStatuses.includes('INACTIVE')) dbStatus = 'INACTIVE';
    }
    if (requestedStatus === 'SUSPENDED' && !allowedStatuses.includes('SUSPENDED')) {
      if (allowedStatuses.includes('DELETED')) dbStatus = 'DELETED';
    }
    if (!allowedStatuses.includes(dbStatus)) {
      res.status(400).json({
        message: `상태 값이 DB와 맞지 않습니다. 허용값: ${allowedStatuses.join(', ')}`,
      });
      return;
    }

    const result = await query(
      `
      UPDATE user
      SET status = ?, is_admin = ?, updated_at = NOW()
      WHERE member_no = ?
      `,
      [dbStatus, isAdmin ? 1 : 0, memberNo]
    );
    if (!result.affectedRows) {
      res.status(404).json({ message: '회원을 찾을 수 없습니다.' });
      return;
    }
    const rows = await query(
      'SELECT member_no, name, login_id, status, is_admin, created_at FROM user WHERE member_no = ? LIMIT 1',
      [memberNo]
    );
    res.json({ user: rows[0] || null });
  } catch (err) {
    console.error('회원 상태/권한 수정 에러:', err);
    res.status(500).json({ message: '회원 상태/권한 수정 실패' });
  }
}

async function getProducts(_req, res) {
  try {
    const products = await query('SELECT * FROM product');
    res.json(products);
  } catch (err) {
    console.error('상품 조회 에러:', err);
    res.status(500).json({ message: '상품 조회 실패' });
  }
}

async function getPayments(_req, res) {
  const sql = `
    SELECT
      p.payment_no,
      p.total_price,
      p.payment_date,
      u.name AS member_name,
      pm.method_name
    FROM payment p
    JOIN user u ON p.member_no = u.member_no
    JOIN payment_method pm ON p.method_id = pm.method_id
  `;

  try {
    const payments = await query(sql);
    res.json(payments);
  } catch (err) {
    console.error('결제 조회 에러:', err);
    res.status(500).json({ message: '결제 조회 실패' });
  }
}

async function getPaymentItems(req, res) {
  const paymentId = req.params.id;
  const sql = `
    SELECT
      pi.*,
      p.product_name
    FROM payment_items pi
    JOIN product p ON pi.product_no = p.product_no
    WHERE pi.payment_no = ?
  `;

  try {
    const items = await query(sql, [paymentId]);
    res.json(items);
  } catch (err) {
    console.error('상세 결제 조회 에러:', err);
    res.status(500).json({ message: '상세 결제 조회 실패' });
  }
}

/** 본인 결제 목록(결제 리포트). 품목 기준으로 product_name 묶어서 표시용으로 전달. */
async function getMyPayments(req, res) {
  const memberNo = req.session.user.member_no;
  const rawLimit = Number(req.query.limit);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 30) : 5;
  const rawCursor = Number(req.query.cursor);
  const cursor = Number.isFinite(rawCursor) && rawCursor > 0 ? rawCursor : null;
  const period = String(req.query.period || "all").trim();

  const where = ["p.member_no = ?"];
  const params = [memberNo];

  if (period === "30d") {
    where.push("p.payment_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)");
  } else if (period === "90d") {
    where.push("p.payment_date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)");
  } else if (period === "year") {
    where.push("YEAR(p.payment_date) = YEAR(CURDATE())");
  } else if (period !== "all") {
    res.status(400).json({ message: "기간 필터 값이 올바르지 않습니다." });
    return;
  }

  if (cursor) {
    where.push("p.payment_no < ?");
    params.push(cursor);
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
  const listSql = `
    SELECT
      p.payment_no,
      p.total_price,
      p.payment_date,
      pm.method_name,
      GROUP_CONCAT(DISTINCT pr.product_name ORDER BY pr.product_name ASC SEPARATOR ', ') AS product_names
    FROM payment p
    INNER JOIN payment_method pm ON p.method_id = pm.method_id
    LEFT JOIN payment_items pi ON pi.payment_no = p.payment_no
    LEFT JOIN product pr ON pr.product_no = pi.product_no
    ${whereClause}
    GROUP BY p.payment_no, p.total_price, p.payment_date, pm.method_id, pm.method_name
    ORDER BY p.payment_no DESC
    LIMIT ?
  `;

  const countWhere = where.filter((w) => w !== "p.payment_no < ?");
  const countParams = cursor ? params.slice(0, -1) : [...params];
  const countClause = countWhere.length > 0 ? `WHERE ${countWhere.join(" AND ")}` : "";
  const summarySql = `
    SELECT
      COUNT(*) AS total_count,
      COALESCE(SUM(p.total_price), 0) AS total_amount,
      MAX(p.payment_date) AS last_payment_date
    FROM payment p
    ${countClause}
  `;

  try {
    const rows = await query(listSql, [...params, limit + 1]);
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? items[items.length - 1]?.payment_no || null : null;
    const summaryRows = await query(summarySql, countParams);
    const summary = summaryRows?.[0] || {};
    res.json({
      items,
      nextCursor,
      hasMore,
      limit,
      totalCount: Number(summary.total_count || 0),
      totalAmount: Number(summary.total_amount || 0),
      lastPaymentDate: summary.last_payment_date || null,
    });
  } catch (err) {
    console.error('내 결제 조회 에러:', err);
    res.status(500).json({ message: '결제 내역을 불러오지 못했습니다.' });
  }
}

/** 본인 결제 건의 품목만 조회(타인 결제번호 접근 차단). */
async function getMyPaymentItems(req, res) {
  const paymentId = req.params.id;
  const memberNo = req.session.user.member_no;

  try {
    const own = await query(
      'SELECT payment_no FROM payment WHERE payment_no = ? AND member_no = ? LIMIT 1',
      [paymentId, memberNo]
    );
    if (own.length === 0) {
      res.status(404).json({ message: '결제 내역을 찾을 수 없습니다.' });
      return;
    }

    const sql = `
      SELECT
        pi.payment_no,
        pi.product_no,
        pi.start_date,
        pi.end_date,
        pr.product_name,
        pr.duration_months AS product_duration_months
      FROM payment_items pi
      JOIN product pr ON pi.product_no = pr.product_no
      WHERE pi.payment_no = ?
      ORDER BY pi.start_date ASC, pi.product_no ASC
    `;
    const items = await query(sql, [paymentId]);
    res.json(items);
  } catch (err) {
    console.error('내 결제 상세 조회 에러:', err.sqlMessage || err.message || err);
    res.status(500).json({ message: '상세 결제 조회 실패' });
  }
}

/** 상품별 구매 구독 플랜 개월(duration_months) 합계. 본인만 조회. */
async function getMySubscriptionAccumulated(req, res) {
  const memberNo = req.session.user.member_no;
  const sql = `
    SELECT
      pr.product_no,
      pr.product_name,
      SUM(pr.duration_months) AS total_subscription_months
    FROM payment_items pi
    INNER JOIN product pr ON pr.product_no = pi.product_no
    WHERE pi.member_no = ?
    GROUP BY pr.product_no, pr.product_name
    HAVING SUM(pr.duration_months) > 0
    ORDER BY pr.product_name ASC
  `;

  try {
    const rows = await query(sql, [memberNo]);
    res.json(rows);
  } catch (err) {
    console.error('내 누적 이용 조회 에러:', err);
    res.status(500).json({ message: '누적 이용 정보를 불러오지 못했습니다.' });
  }
}

/** 내 구독 이력 타임라인(상품별 시작~종료 기간). */
async function getMySubscriptionHistory(req, res) {
  const memberNo = req.session.user.member_no;
  const sql = `
    SELECT
      pi.payment_no,
      pi.product_no,
      pr.product_name,
      pi.start_date,
      pi.end_date,
      pi.status
    FROM payment_items pi
    INNER JOIN product pr ON pr.product_no = pi.product_no
    WHERE pi.member_no = ?
      AND pi.start_date IS NOT NULL
      AND pi.end_date IS NOT NULL
    ORDER BY pi.start_date ASC, pi.end_date ASC, pi.payment_no ASC
  `;

  try {
    const rows = await query(sql, [memberNo]);
    res.json(rows);
  } catch (err) {
    console.error('내 구독 이력 조회 에러:', err.sqlMessage || err.message || err);
    res.status(500).json({ message: '구독 이력을 불러오지 못했습니다.' });
  }
}

/** 현재 진행 중(ING) 구독 기준, 가장 오래된 시작일로부터 경과 일수(첫날=1일). */
async function getMyCurrentSubscriptionDays(req, res) {
  const memberNo = req.session.user.member_no;
  const sql = `
    SELECT
      GREATEST(1, DATEDIFF(CURDATE(), MIN(pi.start_date)) + 1) AS current_subscription_days
    FROM payment_items pi
    WHERE pi.member_no = ?
      AND pi.status = 'ING'
      AND pi.start_date <= CURDATE()
  `;

  try {
    const rows = await query(sql, [memberNo]);
    const days = Number(rows?.[0]?.current_subscription_days) || 0;
    res.json({ current_subscription_days: days });
  } catch (err) {
    console.error('현재 구독 일수 조회 에러:', err);
    res.status(500).json({ message: '현재 구독 일수 정보를 불러오지 못했습니다.' });
  }
}

/** 전 회원 구독 합산 개월(상품 플랜 duration_months 합)이 큰 상품 순. 비로그인 메인 카드용. */
async function getPopularProducts(_req, res) {
  const sql = `
    SELECT
      p.product_no,
      p.product_name,
      p.description,
      p.price,
      p.duration_months
    FROM product p
    LEFT JOIN (
      SELECT pi.product_no, SUM(pr2.duration_months) AS total_m
      FROM payment_items pi
      INNER JOIN product pr2 ON pr2.product_no = pi.product_no
      GROUP BY pi.product_no
    ) t ON t.product_no = p.product_no
    ORDER BY COALESCE(t.total_m, 0) DESC, p.product_name ASC
    LIMIT 12
  `;

  try {
    const rows = await query(sql);
    res.json(rows);
  } catch (err) {
    console.error('인기 상품 조회 에러:', err);
    res.status(500).json({ message: '인기 상품을 불러오지 못했습니다.' });
  }
}

app.post('/api/auth/signup', signup);
app.post('/api/auth/login', login);
app.post('/api/auth/logout', logout);
app.get('/api/auth/me', me);
app.get('/api/auth/check-login-id', checkLoginId);
app.get('/api/me/subscription-accumulated', requireAuth, getMySubscriptionAccumulated);
app.get('/api/me/subscription-history', requireAuth, getMySubscriptionHistory);
app.get('/api/me/subscription-current-days', requireAuth, getMyCurrentSubscriptionDays);
app.get('/api/me/payments', requireAuth, getMyPayments);
app.get('/api/me/payments/:id/items', requireAuth, getMyPaymentItems);

// Admin API (권장)
app.use('/api/admin', requireAdmin);
app.get('/api/admin/users', getUsers);
app.get('/api/admin/users/:memberNo', getUserDetail);
app.patch('/api/admin/users/:memberNo', updateUserAdminSettings);
app.get('/api/admin/products', getProducts);
app.get('/api/admin/payments', getPayments);
app.get('/api/admin/payments/:id/items', getPaymentItems);

// Storefront API (고객용)
app.get('/api/store/products', getProducts);
app.get('/api/store/popular-products', getPopularProducts);

// Legacy API (호환용: 기존 프론트/문서/테스트가 남아있을 때)
app.get('/api/users', getUsers);
app.get('/api/products', getProducts);
app.get('/api/payments', getPayments);
app.get('/api/payments/:id/items', getPaymentItems);

// React build 정적 파일 서빙 (3000 단일 프론트)
const frontendDistPath = path.join(__dirname, 'frontend', 'dist');
app.use(express.static(frontendDistPath));

app.use((req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});


app.listen(port, () => {
  console.log(`웹 서버가 http://localhost:${port} 에서 대기 중입니다.`);
});
