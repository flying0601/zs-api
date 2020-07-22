const Base = require('./base.js');

module.exports = class extends Base {
  // async getConfigbakAction() {
  //   await this.cache('name66666', 'value66666');
  //   const link = this.get('url') || this.post('url');
  //   const WeixinConfig = this.service('wxsdk', 'api');
  //   const data = await WeixinConfig.getConfig(link);
  //   const A = this.cache('name66666');
  //   console.log('object', A);
  //   return this.success(data);
  // }
  async getConfigAction() {
    const link = this.get('url') || this.post('url');
    const sysId = this.cookie('sysid');
    const system = await this.model('system').getSystem(sysId);
    const appid = system.appid || think.config('wxweb.appid');
    const secret = system.secret || think.config('wxweb.secret');
    const WeixinConfig = this.service('wxsdk', 'api');
    // await this.cache('token', null);
    // await this.cache('ticket', null);
    let tokenObj = await this.cache('token');
    let ticketObj = await this.cache('ticket');
    let res = null;
    if (!tokenObj) {
      tokenObj = await WeixinConfig.getToken(appid, secret);
      // 设置缓存token
      await this.cache('token', tokenObj, {
        timeout: tokenObj.expires_in * 1000
      });
    }

    if (tokenObj && tokenObj.access_token) {
      if (!ticketObj) {
        ticketObj = await WeixinConfig.getTicket(tokenObj);
        // 设置缓存jsapiTicket
        await this.cache('ticket', ticketObj, {
          timeout: ticketObj.expires_in * 1000
        });
      }
      // 计算signature
      const getSign = await WeixinConfig.sign(ticketObj.ticket, link);
      res = Object.assign({appId: appid}, getSign);
      return this.success(res);
    } else {
      res = tokenObj;
      return this.fail(res);
    }
  }
  // 用户授权重定向
  async getRedirectAction() {
    const callback = encodeURI(this.get('callback'));
    const scope = this.get('scope');
    const sysId = this.cookie('sysid');
    const system = await this.model('system').getSystem(sysId);
    const appid = system.appid || think.config('wxweb.appid');
    // 获取授权类型
    this.cache('callback', callback);
    // 微信网页授权地址
    const authorizeUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appid}&redirect_uri=${callback}&response_type=code&scope=${scope}&state=STATE#wechat_redirect`;
    console.log('authorizeUrl: ', authorizeUrl);
    // 重定向到该地址
    this.success(authorizeUrl);
    // const a = 'https://www.baidu.com';
    // return this.success(a);
  }
  // 根据code获取用户的OpenId
  async getOpenIdAction() {
    const code = this.post('code');
    const sysId = this.cookie('sysid');
    const clientIp = this.ctx.ip;
    const system = await this.model('system').getSystem(sysId);
    const WeixinConfig = this.service('wxsdk', 'api');
    const AccessToken = await WeixinConfig.getAccessToken(code, system);
    // this.cookie('openid', AccessToken.openid);
    // this.cookie('appid', appid);
    // 根据openid查找用户是否已经注册
    let userId = await this.model('user').where({
      weixin_openid: AccessToken.openid
    }).getField('id', true);
    if (think.isEmpty(userId)) {
      // 注册
      userId = await this.model('user').add({
        username: '微信用户' + think.uuid(6),
        register_ip: clientIp,
        num: 0,
        sign: 1
      });
    } else {
      await this.model('user').where({
        id: userId
      }).update({
        last_login_time: this.getTime(),
        last_login_ip: clientIp
      });
    }
    AccessToken.userId = userId;
    return this.success(AccessToken);
  }
  // 根据code获取用户信息
  async getUserInfoAction() {
    const code = this.post('code');
    if (think.isEmpty(code)) {
      return this.fail('参数错误');
    }
    const clientIp = this.ctx.ip;
    const WeixinConfig = this.service('wxsdk', 'api');
    const AccessTokenData = await WeixinConfig.getAccessToken(code);
    const AccessToken = AccessTokenData.access_token || this.post('AccessToken');
    const openid = AccessTokenData.openid || this.post('openid');
    const userInfo = await WeixinConfig.getUserInfo(AccessToken, openid);
    if (userInfo && !userInfo.openid) {
      return this.fail('出错了', userInfo);
    }
    // 根据openid查找用户是否已经注册
    let userId = await this.model('user').where({
      weixin_openid: userInfo.openid
    }).getField('id', true);
    if (think.isEmpty(userId)) {
      // 注册
      userId = await this.model('user').add({
        username: '微信用户' + think.uuid(6),
        register_ip: clientIp,
        register_time: this.getTime(),
        weixin_openid: userInfo.openid,
        nickname: userInfo.nickname,
        sex: userInfo.sex,
        language: userInfo.language,
        city: userInfo.city,
        province: userInfo.province,
        country: userInfo.country,
        avatar: userInfo.headimgurl,
        sign: 1
      });
    }
    // 更新信息
    await this.model('user').where({
      id: userId
    }).update({
      last_login_time: this.getTime(),
      last_login_ip: clientIp,
      nickname: userInfo.nickname,
      city: userInfo.city,
      province: userInfo.province,
      country: userInfo.country,
      avatar: userInfo.headimgurl
    });
    this.cookie('openid', openid);
    return this.success(userId);
  }
};
