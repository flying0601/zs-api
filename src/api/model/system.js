module.exports = class extends think.Model {
  /**
   * 更改订单支付状态
   * @param orderId
   * @param payStatus
   * @returns {Promise.<boolean>}
   */
  async updatePayStatus(orderId, payStatus = 0) {
    return this.where({id: orderId}).limit(1).update({pay_status: parseInt(payStatus)});
  }

  /**
   * 根据id查找系统信息
   * @param id
   * @returns {Promise.<Promise|Promise<any>|T|*>}
   */
  async getSystem(id) {
    return this.where({id: id}).find();
  }
};
