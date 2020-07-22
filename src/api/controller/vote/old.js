/*
 * @Descripttion:
 * @Author: ylf
 * @Date: 2020-06-22 11:22:56
 * @LastEditors: ylf
 * @LastEditTime: 2020-07-22 14:14:28
 */
const Base = require('../base.js');
const { think } = require('thinkjs');

module.exports = class extends Base {
  /**
   * @msg: info
   * @param {type}
   * @return:{Promise}
   */
  async infoAction() {
    const id = this.get('id');
    const sysId = this.cookie('sysid');
    const system = await this.model('system').getSystem(sysId);
    const model = this.model('giftvote', system.dbkey);
    if (think.isEmpty(id)) {
      return this.fail('活动不存在');
    }
    const data = await model.where({id: id}).find();
    const VoteConfig = this.service('vote', 'api');
    data.config = await VoteConfig.swapConfig(data.config);
    data.topimg = await VoteConfig.swapConfig(data.topimg);
    data.giftdata = await VoteConfig.swapConfig(data.giftdata);
    data.pvv = await model.where({id: id}).increment('pv', 1);
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
    const order = this.get('order') || 'vote';
    const orderParam = order === 'vote' ? 'votenum DESC' : 'createtime DESC';
    if (think.isEmpty(pid)) {
      return this.fail('活动不存在');
    }
    const sysId = this.cookie('sysid');

    const system = await this.model('system').getSystem(sysId);
    const model = this.model('giftvote_item', system.dbkey);
    // const player = await model.where({pid: pid}).order({votenum: 'asc'}).page(page, size).countSelect();
    const player = await model.where({pid: pid}).order(`${orderParam}`).page(page, size).countSelect();
    return this.success(player);
  }
  /**
   * @msg: playerInfo
   * @param {type}
   * @return:{Promise}
   */
  async playerInfoAction() {
    const id = this.get('id');
    if (think.isEmpty(id)) {
      return this.fail('选手不存在');
    }
    const sysId = this.cookie('sysid');
    const system = await this.model('system').getSystem(sysId);
    const model = this.model('giftvote_item', system.dbkey);
    const data = await model.where({id: id}).find();
    data.pvv = await model.where({id: id}).increment('pvcount', 1);
    return this.success(data);
  }
  async censusAction() {
    const vid = this.get('vid');
    const sysId = this.cookie('sysid');
    const system = await this.model('system').getSystem(sysId);
    const model = this.model('giftvote_item', system.dbkey);
    const pvcount = await model.where({pid: vid}).sum('pvcount');
    const votenum = await model.where({pid: vid}).sum('votenum');
    const playernum = await model.where({pid: vid}).count('pid');
    const data = {
      pvcount: pvcount,
      votenum: votenum,
      playernum: playernum

    };
    return this.success(data);
  }
  async helpAction() {
    const did = this.post('did');
    const sysId = this.cookie('sysid');
    const system = await this.model('system').getSystem(sysId);
    const model = this.model('giftvote_item', system.dbkey);
    const data = await model.where({id: did}).increment(['votenum', 'pvcount'], 1);
    return this.success(data);
  }
  async giveAction() {
    const tid = this.post('did');
    const pid = this.post('pid');
    const openid = this.cookie('openid');
    const userId = this.post('userid');
    const userIp = this.ctx.ip;
    const gifttitle = this.post('gifttitle');
    const gificon = this.post('gificon');
    const fee = this.post('fee');
    const giftvote = this.post('giftvote');
    const sysId = this.cookie('sysid');
    const timeStamp = this.post('timeStamp');
    const nonceStr = this.post('nonceStr');
    if (think.isEmpty(tid)) {
      return this.fail('选手不存在');
    }
    let system;
    if (think.isEmpty(sysId)) {
      return this.fail('系统不存在');
    } else {
      system = await this.model('system').getSystem(sysId);
    }
    const dbKey = system.dbkey;
    if (think.isEmpty(dbKey)) {
      return this.fail('系统不存在');
    }
    console.log(system);
    const model = this.model('giftvote_gift', dbKey);
    const giftInfo = {
      tid: tid,
      uniontid: this.model('order').generateOrderNumber(),
      pid: pid,
      openid: openid,
      nickname: system.partner_key,
      user_id: userId,
      user_ip: userIp,
      gifttitle: gifttitle,
      gificon: gificon,
      fee: fee,
      giftvote: giftvote,
      ispay: 0,
      createtime: this.getTime()
    };
    const giftId = await model.add(giftInfo);
    if (think.isEmpty(giftId)) {
      return this.fail(400, '订单不存在');
    }
    const WeixinSerivce = this.service('wxsdk', 'api');
    try {
      const returnParams = await WeixinSerivce.getBrandWCPayParams({
        openid: openid,
        timeStamp: timeStamp,
        nonceStr: nonceStr,
        attach: system.dbkey + ':' + system.partner_key,
        body: system.name + ':' + giftInfo.uniontid,
        out_trade_no: giftInfo.uniontid,
        total_fee: parseInt(giftInfo.fee * 100),
        spbill_create_ip: giftInfo.user_ip
      }, system);
      return this.success(returnParams);
    } catch (err) {
      return this.fail('微信支付失败');
    }
  }

  /**
   * 支付的回调
   * @returns {Promise<PreventPromise|void|Promise>}
   */
  async notifyAction() {
    const WeixinSerivce = this.service('wxsdk', 'api');
    const result = WeixinSerivce.payNotify(this.post('xml'));
    if (!result) {
      return `<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[支付失败]]></return_msg></xml>`;
    }
    const dbkey = result && result.attach.split(':')[0];
    const model = this.model('giftvote_gift', dbkey);
    const isGift = await model.where({
      uniontid: result.out_trade_no
    }).find();
    if (think.isEmpty(isGift)) {
      return `<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[订单不存在]]></return_msg></xml>`;
    }
    if (isGift.ispay === 1) {
      return `<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[订单已支付]]></return_msg></xml>`;
    }
    // 加票
    const num = parseInt(isGift.giftvote) || 1;
    const modelItem = this.model('giftvote_item', dbkey);
    await modelItem.where({id: isGift.tid}).increment(['votenum', 'pvcount'], num);
    // 更新状态
    await model.where({
      uniontid: result.out_trade_no
    }).update({
      ispay: 1,
      transaction_id: result.transaction_id
    });
    return `<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>`;
  }
  async getSystemAction() {
    const sysId = this.get('sysid');
    const systemModel = this.model('system');
    const system = await systemModel.getSystem(sysId);
    return this.success(system);
  }
};
