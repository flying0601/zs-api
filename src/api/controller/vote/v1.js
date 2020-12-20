/*
 * @Descripttion:
 * @Author: ylf
 * @Date: 2020-06-22 11:22:56
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2020-11-26 23:50:36
 */
const Base = require('../base.js');
// const { think } = require('thinkjs');

module.exports = class extends Base {
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
    const userAgent = this.ctx.userAgent.toLowerCase();
    console.log('userAgent: ', userAgent);
    console.log('isuserAgent: ', userAgent.includes('micromessenger'));
    if (!userAgent.includes('micromessenger')) {
      return this.fail(1003, 'no done no dieua!');
    }
    // 系统信息
    const system = await this.model('system').getSystem(sysId);
    // vote配置
    const configModel = this.model('giftvote', system.dbkey);
    const configData = await configModel
      .field(['config', 'voteendtime', 'status'])
      .where({ id: pid })
      .find();
    // 活动是否投票时间
    const { voteendtime, status } = configData;
    const curTime = this.getTime();
    if (curTime > voteendtime || parseInt(status) === 0) {
      return this.fail('活动已经结束了');
    }
    const VoteConfig = this.service('vote', 'api');
    configData.config = await VoteConfig.swapConfig(configData.config);
    const dailyvote = configData.config.dailyvote || 0;
    const jgtime = Number(configData.config.jgtime) || 0;
    let user; // 用户信息
    let userNum = 0;
    if (dailyvote !== 0) {
      user = await this.model('user')
        .field('num')
        .where({
          weixin_openid: openid
        })
        .find();
      if (user && Object.keys(user).length === 0) {
        return this.fail(1003, 'no done no die!');
      }
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
    const itmeData = await model
      .field(['locktime', 'allowvote'])
      .where({ id: did })
      .find();
    const lock = this.getTime() - itmeData.locktime;
    if (lock < 0) {
      return this.fail(1001, '选手异常被锁定', parseInt(lock / 60));
    }
    if (!itmeData.allowvote) {
      return this.fail(1002, '选手异常被禁止');
    }
    const record = this.model('giftvote_record', system.dbkey);
    // 间隔时间判断
    if (jgtime !== 0) {
      const voteTime = await record
        .where({
          openid: openid
        })
        .max('createtime');
      if (voteTime) {
        const curjgTime = voteTime + jgtime * 60 - this.getTime();
        if (curjgTime > 0) {
          return this.fail(1003, `期待您${parseInt(curjgTime / 60)}分钟后再一次投票！`);
        }
      }
    }
    // 添加投票记录
    await record.add({
      tid: did,
      pid: pid,
      user_id: userId,
      openid: openid,
      user_ip: userIp,
      createtime: this.getTime()
    });
    // 浏览量添加
    const data = await model.where({ id: did }).increment(['votenum', 'pvcount'], 1);
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
    await this.model('user')
      .where({ weixin_openid: openid })
      .update({ num: user.num });
    return this.success(data);
  }
};
