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
      'SELECT member_no, login_id, name, status FROM user WHERE member_no = ? LIMIT 1',
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
      'SELECT member_no, login_id, password, name, status FROM user WHERE login_id = ? LIMIT 1',
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

function me(req, res) {
  res.json({ user: req.session.user || null });
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

async function getUsers(_req, res) {
  try {
    const users = await query('SELECT * FROM user');
    res.json(users);
  } catch (err) {
    console.error('회원 조회 에러:', err);
    res.status(500).json({ message: '회원 조회 실패' });
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

// Admin API (권장)
app.use('/api/admin', requireAuth);
app.get('/api/admin/users', getUsers);
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
