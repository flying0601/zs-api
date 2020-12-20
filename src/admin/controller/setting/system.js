const Base = require('../base.js');

module.exports = class extends Base {
  // 域名配置接口
  async detailsAction() {
    const userid = this.getLoginUserId();
    const data = await this.model('system').field(['id', 'name', 'remake', 'appid', 'secret', 'mch_id AS mchid', 'partner_key AS partnerkey']).where({user_id: userid}).find();
    return this.success(data, '请求成功！');
  }
  async updateAction() {
    const id = this.post('id');
    const name = this.post('name');
    const remake = this.post('remake');
    const appid = this.post('appid');
    const secret = this.post('secret');
    const mchid = this.post('mchid') || '';
    const partnerkey = this.post('partnerkey') || '';
    const data = await this.model('system').where({id: id}).update({
      name: name,
      remake: remake,
      appid: appid,
      secret: secret,
      mch_id: mchid,
      partner_key: partnerkey
    });
    return this.success(data, '修改成功');
  }
};
