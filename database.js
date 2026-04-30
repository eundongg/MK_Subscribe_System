const mysql = require('mysql2');
require('dotenv').config();

// 1. 데이터베이스 접속 정보 설정
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: process.env.DB_PASS,
  database: 'maekyung',
  timezone: 'Z',
});

// 2. 실제 연결 시도
connection.connect(err => {
  if (err) {
    console.error('DB 연결 실패: ', err);
    return;
  }
  connection.query("SET time_zone = '+00:00'", tzErr => {
    if (tzErr) {
      console.error('DB 세션 타임존 UTC 설정 실패:', tzErr);
      return;
    }
    console.log('DB 연결 성공 (session time_zone=UTC)');
  });
});

module.exports = connection;

