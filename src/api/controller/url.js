/*
 * @Descripttion:短域名生成
 * @Author: ylf
 * @Date: 2020-06-30 17:01:59
 * @LastEditors: ylf
 * @LastEditTime: 2020-06-30 17:25:56
 */
const Base = require('./base.js');

module.exports = class extends Base {
  async indexAction() {
    const id = this.get('id');
    return this.success(id);
  }
};
