/*
 * @Descripttion:
 * @Author: ylf
 * @Date: 2020-06-22 11:22:56
 * @LastEditors: ylf
 * @LastEditTime: 2020-06-22 13:42:31
 */
const Base = require('../base.js');

module.exports = class extends Base {
  /**
   * index action
   * @return {Promise} []
   */
// 订单列表
  async listAction() {
    const page = this.get('page') || 1;
    const size = this.get('size') || 10;
    const data = await this.model('course_order').alias('o').field(['o.id', 'o.transaction_id', 'c.title', 'c.retail_price', 'u.nickname', 'u.weixin_openid']).join({
      table: 'course',
      join: 'left',
      as: 'c',
      on: ['course_id', 'id']
    }).join({
      table: 'user',
      join: 'left',
      as: 'u',
      on: ['user_id', 'id']
    }).page(page, size).countSelect();
    return this.success(data);
  }
};
