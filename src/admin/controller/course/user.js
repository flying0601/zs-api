/*
 * @Descripttion:
 * @Author: ylf
 * @Date: 2020-06-22 11:22:56
 * @LastEditors: ylf
 * @LastEditTime: 2020-06-22 13:49:04
 */
const Base = require('../base.js');

module.exports = class extends Base {
  /**
   * index action
   * @return {Promise} []
   */
// 用户列表
  async listAction() {
    const page = this.get('page') || 1;
    const size = this.get('size') || 10;
    const data = await this.model('user').field().page(page, size).countSelect();
    return this.success(data);
  }
};
