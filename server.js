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

// React 프론트에서 사용할 API
app.get('/api/users', async (req, res) => {
  try {
    const users = await query('SELECT * FROM user');
    res.json(users);
  } catch (err) {
    console.error('회원 조회 에러:', err);
    res.status(500).json({ message: '회원 조회 실패' });
  }
});

app.get('/api/users/signup-fields', async (req, res) => {
  try {
    const columns = await query('DESCRIBE user');
    const writableColumns = columns
      .filter((column) => !String(column.Extra || '').includes('auto_increment'))
      .filter((column) => column.Field !== 'created_at');

    const fields = writableColumns.map((column) => ({
      name: column.Field,
      required: column.Null === 'NO' && column.Default === null,
    }));

    res.json(fields);
  } catch (err) {
    console.error('회원가입 필드 조회 에러:', err);
    res.status(500).json({ message: '회원가입 필드 조회 실패' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const columns = await query('DESCRIBE user');
    const writableColumns = columns
      .filter((column) => !String(column.Extra || '').includes('auto_increment'))
      .filter((column) => column.Field !== 'created_at')
      .map((column) => ({
        ...column,
        name: column.Field,
      }));

    const payload = req.body ?? {};
    const valuesToInsert = {};

    for (const column of writableColumns) {
      if (Object.prototype.hasOwnProperty.call(payload, column.name)) {
        valuesToInsert[column.name] = payload[column.name];
      }
    }

    const missingRequired = writableColumns
      .filter((column) => column.Null === 'NO' && column.Default === null)
      .filter((column) => {
        const value = valuesToInsert[column.name];
        return value === undefined || value === null || String(value).trim() === '';
      })
      .map((column) => column.name);

    if (missingRequired.length > 0) {
      res.status(400).json({
        message: '필수 입력값이 누락되었습니다.',
        fields: missingRequired,
      });
      return;
    }

    const insertColumns = Object.keys(valuesToInsert);
    if (insertColumns.length === 0) {
      res.status(400).json({ message: '저장할 회원 정보가 없습니다.' });
      return;
    }

    const placeholders = insertColumns.map(() => '?').join(', ');
    const escapedColumns = insertColumns.map((column) => `\`${column}\``).join(', ');
    const params = insertColumns.map((column) => valuesToInsert[column]);

    const sql = `INSERT INTO user (${escapedColumns}) VALUES (${placeholders})`;
    const result = await query(sql, params);

    res.status(201).json({
      message: '회원가입이 완료되었습니다.',
      member_no: result.insertId,
    });
  } catch (err) {
    console.error('회원가입 저장 에러:', err);
    res.status(500).json({ message: '회원가입 저장 실패' });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const products = await query('SELECT * FROM product');
    res.json(products);
  } catch (err) {
    console.error('상품 조회 에러:', err);
    res.status(500).json({ message: '상품 조회 실패' });
  }
});

app.get('/api/payments', async (req, res) => {
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
});

app.get('/api/payments/:id/items', async (req, res) => {
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
});

// React build 정적 파일 서빙 (3000 단일 프론트)
const frontendDistPath = path.join(__dirname, 'frontend', 'dist');
app.use(express.static(frontendDistPath));

app.use((req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});


app.listen(port, () => {
  console.log(`웹 서버가 http://localhost:${port} 에서 대기 중입니다.`);
});
