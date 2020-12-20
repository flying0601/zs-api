/*
 * @Descripttion:
 * @Author: ylf
 * @Date: 2020-06-22 11:22:56
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2020-08-25 22:45:00
 */
const Base = require('../base.js');

module.exports = class extends Base {
  /**
   * @msg: info
   * @param {type}
   * @return:{Promise}
   */
  async infoAction() {
    const id = this.get('id');
    const model = this.model('course');
    if (think.isEmpty(id)) {
      return this.fail('课程不存在');
    }
    const data = await model.where({id: id}).find();
    return this.success(data);
  }
};
