
const mysql = require('mysql2');
require('dotenv').config();

// 1. 데이터베이스 접속 정보 설정
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: process.env.DB_PASS,
  database: 'maekyung'
});

// 2. 실제 연결 시도
connection.connect((err) => {
  if (err) {
    console.error('연결 실패.. 사유: ' + err.stack);
    return;
  }
  console.log('연결 성공! ID: ' + connection.threadId);
});

// 3. 데이터 조회 테스트 (아까 만든 테이블 이름 넣기)
connection.query('SELECT * FROM user', (err, results) => {
  if (err) throw err;
  console.log('--- DB에서 가져온 데이터 ---');
  console.log(results); // 터미널에 데이터가 출력됩니다!

  connection.end(); // 작업 끝났으면 연결 종료
});
