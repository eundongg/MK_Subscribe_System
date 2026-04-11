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
connection.connect(err => {
  if (err) console.error('DB 연결 실패: ', err);
  else console.log('DB 연결 성공');
});

module.exports = connection;

