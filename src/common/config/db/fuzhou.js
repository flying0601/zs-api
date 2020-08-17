const mysql = require('think-model-mysql');

module.exports = {
  handle: mysql,
  database: 'vote1',
  prefix: 'wechat_',
  encoding: 'utf8mb4',
  host: '114.215.84.92',
  port: '3306',
  user: 'vote1',
  password: 'rmHXwzh5TMBDRYbs',
  dateStrings: true
};
