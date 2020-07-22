const Base = require('../base.js');

module.exports = class extends Base {
  /**
   * index action
   * @return {Promise} []
   */
// 列表
  async listAction() {
    const page = this.get('page') || 1;
    const size = this.get('size') || 10;
    const title = this.get('title') || '';
    const model = this.model('course');
    const data = await model.where({title: ['like', `%${title}%`]}).page(page, size).countSelect();
    return this.success(data);
  }
  async updAction() {
    const id = this.post('id');
    const title = this.post('title');
    const startTime = this.post('startTime');
    const endTime = this.post('endTime');
    const topImg = this.post('topImg');
    const shopArea = this.post('shopArea');
    const shopTel = this.post('shopTel');
    const shopInfo = this.post('shopInfo');
    const pv = this.post('pv') || 0;
    const follow = this.post('follow');
    const notice = this.post('notice');
    const details = this.post('details');
    const retailPrice = this.post('retailPrice');

    await this.model('course').where({
      id: id
    }).update({
      title: title,
      starttime: startTime,
      endtime: endTime,
      topimg: topImg,
      shop_area: shopArea,
      shop_tel: shopTel,
      shop_info: shopInfo,
      pv: pv,
      follow: follow,
      notice: notice,
      details: details,
      retailPrice: retailPrice
    });
    return this.success(id, '修改成功');
  }
  async addAction() {
    const userId = this.getLoginUserId();
    const addtime = this.getTime();
    const title = this.post('title');
    const startTime = this.post('startTime');
    const endTime = this.post('endTime');
    const topImg = this.post('topImg');
    const shopArea = this.post('shopArea');
    const shopTel = this.post('shopTel');
    const shopInfo = this.post('shopInfo');
    const pv = this.post('pv') || 0;
    const follow = this.post('follow');
    const notice = this.post('notice');
    const details = this.post('details');
    const retailPrice = this.post('retailPrice');
    const data = await this.model('course').add({
      user_id: userId,
      addtime: addtime,
      title: title,
      starttime: startTime,
      endtime: endTime,
      topimg: topImg,
      shop_area: shopArea,
      shop_tel: shopTel,
      shop_info: shopInfo,
      pv: pv,
      follow: follow,
      notice: notice,
      details: details,
      retailPrice: retailPrice
    });
    return this.success(data, '添加成功');
  }
  async delAction() {
    const id = this.post('id');
    if (!think.isEmpty(id)) {
      const data = await this.model('course').where({
        id: id
      }).delete();
      return this.success(data, '删除成功');
    }
  }
};
