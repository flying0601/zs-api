/*
 * @Descripttion:
 * @Author: ylf
 * @Date: 2020-06-22 11:22:56
 * @LastEditors: ylf
 * @LastEditTime: 2020-07-02 22:46:41
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
    const model = this.model('giftvote', 'vote');
    if (think.isEmpty(id)) {
      return this.fail('活动不存在');
    }
    const data = await model.where({id: id}).find();
    const VoteConfig = this.service('vote', 'api');
    data.config = await VoteConfig.swapConfig(data.config);
    data.topimg = await VoteConfig.swapConfig(data.topimg);
    data.giftdata = await VoteConfig.swapConfig(data.giftdata);
    data.eventrule = await VoteConfig.htmlEncodeByRegExp(data.eventrule);
    data.prizemsg = await VoteConfig.htmlEncodeByRegExp(data.prizemsg);
    return this.success(data);
  }
  /**
   * @msg: player
   * @param {type}
   * @return:{Promise}
   */
  async playerAction() {
    const pid = this.get('pid');
    const page = this.get('page') || 1;
    const size = this.get('size') || 10;
    const model = this.model('giftvote_item', 'vote');
    if (think.isEmpty(pid)) {
      return this.fail('活动不存在');
    }
    const player = await model.where(`pid= ${pid}`).page(page, size).countSelect();
    // player = JSON.parse(player);
    return this.success(player);
  }
};
