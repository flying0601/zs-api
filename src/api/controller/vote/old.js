/*
 * @Descripttion:
 * @Author: ylf
 * @Date: 2020-06-22 11:22:56
 * @LastEditors: ylf
 * @LastEditTime: 2020-08-16 20:05:53
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
    if (think.isEmpty(id)) {
      return this.fail('活动不存在');
    }
    const model = this.model('giftvote', system.dbkey);
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
    const name = this.get('name') || '';
    const noid = this.get('noid') || '';
    const status = this.get('status') || 1;
    const orderParam = order === 'vote' ? 'votenum DESC' : 'createtime DESC';
    if (think.isEmpty(pid)) {
      return this.fail('活动不存在');
    }
    const sysId = this.cookie('sysid');

    const system = await this.model('system').getSystem(sysId);
    const model = this.model('giftvote_item', system.dbkey);
    // const player = await model.where({pid: pid}).order({votenum: 'asc'}).page(page, size).countSelect();
    let player;
    if (noid) {
      player = await model.where({pid: pid, status: status, noid: ['=', noid]}).order(`${orderParam}`).page(page, size).countSelect();
    } else {
      player = await model.where({pid: pid, status: status, name: ['like', `%${name}%`]}).order(`${orderParam}`).page(page, size).countSelect();
    }
    return this.success(player);
  }
  /**
   * @msg: playerInfo
   * @param {type}
   * @return:{Promise}
   */
  async playerInfoAction() {
    const id = this.get('id');
    const openid = this.get('openid');
    const pid = this.get('pid');
    const sysId = this.cookie('sysid');
    const system = await this.model('system').getSystem(sysId);
    const model = this.model('giftvote_item', system.dbkey);
    let data;
    if (openid) {
      data = await model.where({openid: openid, pid: pid}).find();
    } else {
      if (think.isEmpty(id)) {
        return this.fail('选手不存在');
      }
      data = await model.where({id: id}).find();
      data.pvv = await model.where({id: id}).increment('pvcount', 1);
    }
    return this.success(data);
  }
  /**
   * @msg: censusAction
   * @param {type}
   * @return:{Promise}
   */
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
  async playerCensusAction() {
    const noid = this.post('noid');
    if (think.isEmpty(noid)) {
      return this.fail('选手不存在');
    }
    const pid = this.post('pid');
    const sysId = this.cookie('sysid');
    const system = await this.model('system').getSystem(sysId);
    const sql = `SELECT wechat_giftvote_item.* FROM ( SELECT obj.noid, obj.pid, obj.votenum, (@last_votenum - obj.votenum) AS diffnext,(@last_votenum :=obj.votenum) AS diffbak, CASE WHEN @rowtotal = obj.votenum THEN @rownum WHEN @rowtotal := obj.votenum THEN @rownum := @rownum + 1 WHEN @rowtotal = 0 THEN @rownum := @rownum + 1 END AS rownum FROM ( SELECT  noid, pid, votenum FROM wechat_giftvote_item WHERE pid = ${pid} ORDER BY votenum DESC ) AS obj, ( SELECT @rownum := 0, @rowtotal := NULL ) r ) AS wechat_giftvote_item WHERE noid =${noid};`;
    const addCheck = await this.model('wechat_giftvote_item', system.dbkey).query(sql);
    this.success(addCheck);
  }
  /**
   * 报名
   * @returns {Promise<PreventPromise|void|Promise>}
   */
  async signupAction() {
    const sysId = this.cookie('sysid');
    const userId = this.post('userid');
    const pid = this.post('pid');
    const openid = this.cookie('openid');
    const ischecked = this.post('ischecked');
    let imglist = this.post('imglist');
    let formObj = this.post('formObj');
    const system = await this.model('system').getSystem(sysId);
    const model = this.model('giftvote_item', system.dbkey);
    const noidMax = await model.where({pid: pid}).max('noid') || 0;
    imglist = JSON.parse(imglist);
    formObj = JSON.parse(formObj);
    const imgObj = {};
    for (const key in imglist) {
      imgObj[`img${Number(key) + 1}`] = imglist[key];
    }
    const addParam = {
      user_id: userId,
      pid: pid,
      noid: noidMax + 1,
      openid: openid,
      avatar: imglist[0],
      name: formObj.name,
      tel: formObj.tel,
      introduction: formObj.introduction,
      status: ischecked,
      createtime: this.getTime()
    };
    // console.log(addParam);
    const addData = Object.assign(addParam, imgObj);
    const data = await model.add(addData);
    return this.success(data);
  }
  /**
   * 助力help
   * @returns {Promise<PreventPromise|void|Promise>}
   */
  async helpAction() {
    const did = this.post('did');
    const sysId = this.cookie('sysid');
    const pid = this.post('pid');
    const userId = this.post('userid');
    const userIp = this.ctx.ip;
    const openid = this.cookie('openid');
    // 系统信息
    const system = await this.model('system').getSystem(sysId);
    // vote配置
    const configModel = this.model('giftvote', system.dbkey);
    const configData = await configModel.field(['config', 'voteendtime', 'status']).where({id: pid}).find();
    // 活动是否投票时间
    const {voteendtime, status} = configData;
    const curTime = this.getTime();
    if ((curTime > voteendtime) || (parseInt(status) === 0)) {
      return this.fail('活动已经结束了');
    }
    const VoteConfig = this.service('vote', 'api');
    configData.config = await VoteConfig.swapConfig(configData.config);
    const dailyvote = configData.config.dailyvote || 0;
    let user;// 用户信息
    let userNum = 0;
    if (dailyvote !== 0) {
      user = await this.model('user').field('num').where({
        weixin_openid: openid
      }).find();
      if (user && user.num) {
        user.num = JSON.parse(user.num);
        userNum = (user.num[`sys${sysId}`] && user.num[`sys${sysId}`][`vid${pid}`]) || 0;
      }
      // console.log(user);
      // console.log(userNum);
      if (userNum > dailyvote - 1) {
        return this.fail('点赞达到上限咯', dailyvote);
      }
    }
    const model = this.model('giftvote_item', system.dbkey);
    const itmeData = await model.field(['locktime', 'allowvote']).where({id: did}).find();
    const lock = (this.getTime()) - (itmeData.locktime);
    if (lock < 0) {
      return this.fail(1001, '选手异常被锁定', lock);
    }
    if (!itmeData.allowvote) {
      return this.fail(1002, '选手异常被禁止');
    }
    const data = await model.where({id: did}).increment(['votenum', 'pvcount'], 1);
    // 添加投票记录
    await this.model('giftvote_record', system.dbkey).add({
      tid: did,
      pid: pid,
      user_id: userId,
      openid: openid,
      user_ip: userIp,
      createtime: this.getTime()
    });
    // 投票计数
    if (userNum === 0) {
      if (!user.num) {
        user.num = {};
      }
      if (!user.num[`sys${sysId}`]) {
        user.num[`sys${sysId}`] = {};
      }
      user.num[`sys${sysId}`][`vid${pid}`] = 1;
    } else {
      user.num[`sys${sysId}`][`vid${pid}`] = user.num[`sys${sysId}`][`vid${pid}`] ? user.num[`sys${sysId}`][`vid${pid}`] : 0;
      user.num[`sys${sysId}`][`vid${pid}`] += 1;
    }
    // console.log(user);
    user.num = JSON.stringify(user.num);
    // console.log('ddd', user.num);
    await this.model('user').where({ weixin_openid: openid }).update({'num': user.num});
    return this.success(data);
  }
  /**
   * 投诉
   * @returns {Promise<PreventPromise|void|Promise>}
   */
  async complaintAction() {
    const tid = this.post('tid');
    if (think.isEmpty(tid)) {
      return this.fail('投诉不存在');
    }
    const pid = this.post('pid');
    const uid = this.post('uid');
    const action = this.post('action');
    const did = this.post('did') || 0;
    const sysId = this.cookie('sysid');
    const clientIp = this.ctx.ip;
    const system = await this.model('system').getSystem(sysId);
    const complaint = await this.model('giftvote_jubao', system.dbkey).add({
      user_id: uid,
      pid: pid,
      type: tid,
      iid: did,
      action: action,
      ip: clientIp,
      addtime: this.getTime()
    });
    this.success(complaint);
  }
  /**
   *检测
   * @returns {Promise<PreventPromise|void|Promise>}
   */
  async testingAction() {
    const sysId = this.get('sysid') || this.cookie('sysid');
    if (think.isEmpty(sysId)) {
      return this.fail('系统不存在');
    }
    const clientIp = this.ctx.ip;
    if (think.isEmpty(clientIp)) {
      return this.fail('ip不存在');
    }
    const system = await this.model('system').getSystem(sysId);
    const data = {};
    const testId = await this.model('giftvote_jubao', system.dbkey).where({
      ip: clientIp
    }).getField('id', true);
    data.testId = testId;
    data.appid = system.appid;
    this.success(data);
  }
  /**
   * 助力give
   * @returns {Promise<PreventPromise|void|Promise>}
   */
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
    const body = this.post('body');
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
    // console.log(system);
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
        body: body || system.name + ':' + giftInfo.uniontid,
        out_trade_no: giftInfo.uniontid,
        total_fee: parseInt(giftInfo.fee * 100),
        spbill_create_ip: giftInfo.user_ip
      }, system);
      return this.success(returnParams);
    } catch (err) {
      return this.fail('微信支付失败');
    }
  }
  async shareAction() {
    const id = this.get('id');
    const did = this.get('did');
    const sysId = this.cookie('sysid');
    const system = await this.model('system').getSystem(sysId);
    if (think.isEmpty(id)) {
      return this.fail('活动不存在');
    }
    let data, model;
    if (did) {
      model = this.model('giftvote_item', system.dbkey);
      data = await model.where({id: did}).increment('sharecount', 1);
    } else {
      model = this.model('giftvote', system.dbkey);
      data = await model.where({id: id}).increment('sharecount', 1);
    }
    return this.success(data);
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

    await modelItem.where({id: isGift.tid}).increment({votenum: num, pvcount: num, giftcount: isGift.fee});
    // await modelItem.where({id: isGift.tid}).increment(['votenum', 'pvcount'], num);
    // 更新状态
    await model.where({
      uniontid: result.out_trade_no
    }).update({
      ispay: 1,
      transaction_id: result.transaction_id
    });
    return `<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>`;
  }
};
