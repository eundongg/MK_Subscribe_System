// server.js
const express = require('express');
const db = require('./database'); // 방금 만든 database.js를 불러옵니다.
const app = express();
const port = 3000;
app.set('view engine', 'ejs');
app.use(express.static('resources'));
app.use(express.static('public'));
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
      u.name AS member_name
    FROM payment p
    JOIN user u ON p.member_no = u.member_no
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

// [메인 페이지]
app.get('/', (req, res) => {
    res.render('index'); 
});

// [회원 조회 페이지]
app.get('/users', (req, res) => {
    db.query('SELECT * FROM user', (err, results) => {
        if (err) return res.status(500).send('조회 에러');
        res.render('user', { users: results });
    });
});

// [상품 조회 페이지]
app.get('/products', (req, res) => {
    db.query('SELECT * FROM product', (err, results) => {
        if (err) return res.status(500).send('조회 에러');
        res.render('product', { products: results });
    });
});

// [결제 내역 페이지]
app.get('/payments', (req, res) => {
    // 1. 여기에 쿼리 문을 변수로 만듭니다. (가독성을 위해 백틱 `` 사용 추천)
    const sql = `
        SELECT 
            p.payment_no, 
            p.total_price, 
            p.payment_date,
            u.name AS member_name 
        FROM payment p
        JOIN user u ON p.member_no = u.member_no
    `;

    // 2. db 객체의 query 메서드에 첫 번째 인자로 sql 변수를 넣습니다.
    db.query(sql, (err, results) => {
        if (err) {
            console.error('데이터 조회 중 에러:', err);
            return res.status(500).send('에러 발생');
        }

        // 3. 조회 결과(results)를 payment.ejs 파일로 보냅니다.
        res.render('payment', { payments: results });
    });
});

// [상세 결제 내역 조회] (URL: /payments/123)
app.get('/payments/:id', (req, res) => {
    const paymentId = req.params.id; // URL의 :id 값을 가져옴

    // payment_items 테이블에서 해당 결제 번호에 속한 상품들을 가져오는 쿼리
    const sql = `
        SELECT 
            pi.*, 
            p.product_name 
        FROM payment_items pi
        JOIN product p ON pi.product_no = p.product_no
        WHERE pi.payment_no = ?
    `;
    
    db.query(sql, [paymentId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('상세 내역 조회 중 오류 발생');
        }

        // 결과를 payment_detail.ejs에 전달
        res.render('payment_items', { items: results, paymentNo: paymentId });
    });
});


app.listen(port, () => {
  console.log(`웹 서버가 http://localhost:${port} 에서 대기 중입니다.`);
});
