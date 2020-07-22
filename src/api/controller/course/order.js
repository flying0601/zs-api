/*
 * @Descripttion:
 * @Author: ylf
 * @Date: 2020-06-22 11:22:56
 * @LastEditors: ylf
 * @LastEditTime: 2020-07-21 13:58:06
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
  /**
  * 提交订单
  * @returns {Promise.<void>}
  */
  async submitAction() {
    const cid = this.post('cid');
    const num = this.post('num') || 1;
    const openid = this.cookie('openid');
    const clientIp = this.ctx.ip;
    if (think.isEmpty(cid)) {
      return this.fail('课程不存在');
    }
    const userId = await this.model('user').where({
      weixin_openid: openid
    }).getField('id', true);
    const courseInfo = this.model('course').where({
      id: cid
    }).find();
    const orderInfo = {
      transaction_id: this.model('order').generateOrderNumber(),
      user_id: userId,
      course_id: cid,
      coures_num: num,
      fee: courseInfo.retail_price * num,
      createtime: this.getTime()
    };
    const orderId = await this.model('course_order').add(orderInfo);
    if (!orderId) {
      return this.fail('订单提交失败');
    }
    const WeixinSerivce = this.service('weixin', 'api');
    try {
      const returnParams = await WeixinSerivce.createUnifiedOrder({
        openid: openid,
        body: '订单编号：' + orderInfo.transaction_id,
        out_trade_no: orderInfo.transaction_id,
        total_fee: parseInt(orderInfo.fee * 100),
        spbill_create_ip: ''
      });
      return this.success(returnParams);
    } catch (err) {
      return this.fail('微信支付失败');
    }
  }
};
