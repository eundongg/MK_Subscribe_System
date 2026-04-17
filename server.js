// server.js
const express = require('express');
const path = require('path');
const db = require('./database'); // 방금 만든 database.js를 불러옵니다.
const app = express();
const port = 3000;
app.use(express.static('resources'));
app.use(express.json());

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

// Admin API (권장)
app.get('/api/admin/users', getUsers);
app.get('/api/admin/products', getProducts);
app.get('/api/admin/payments', getPayments);
app.get('/api/admin/payments/:id/items', getPaymentItems);

// Storefront API (고객용)
app.get('/api/store/products', getProducts);

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
