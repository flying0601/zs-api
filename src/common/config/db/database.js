const mysql = require('think-model-mysql');

module.exports = {
  handle: mysql,
  database: 'start-zs',
  prefix: 'wechat_',
  encoding: 'utf8mb4',
  host: '114.215.84.92',
  port: '3306',
  user: 'start-zs',
  password: 'FeJacbyCEKkzAi7X',
  dateStrings: true
};
