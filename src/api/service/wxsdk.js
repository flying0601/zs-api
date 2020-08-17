const crypto = require('crypto');
const fly = require('flyio');
const rp = require('request-promise');
const queryString = require('querystring');
const xml2jsparseString = require('xml2js').parseString;

module.exports = class extends think.Service {
  async getToken(appid, appSecret) {
    // 获取access_token
    const tokenUrl = 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=' + appid + '&secret=' + appSecret;
    const token = await fly.get(tokenUrl).then(res => {
      return res.data;
    }).catch(error => {
      return (error);
    });
    // console.log({token});
    return token;
  }
  // 获取jsapi_ticket
  async getTicket(token) {
    const ticketUrl = 'https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=' + token.access_token + '&type=jsapi';
    const jsapiTicket = await fly.get(ticketUrl).then(params => {
      if (params.data.errmsg === 'ok') {
        return params.data;
      }
    }).catch(error => {
      this.fail(error);
    });
    return jsapiTicket;
  }
  // 随机字符串
  createNonceStr() {
    return Math.random().toString(36).substr(2, 15);
  }

  // 时间戳
  createTimestamp() {
    return parseInt(new Date().getTime() / 1000) + '';
  }

  // 排序拼接
  raw(args) {
    let keys = Object.keys(args);
    keys = keys.sort();
    const newArgs = {};
    keys.forEach(function(key) {
      newArgs[key.toLowerCase()] = args[key];
    });
    let string = '';
    for (const k in newArgs) {
      string += '&' + k + '=' + newArgs[k];
    }
    string = string.substr(1);
    return string;
  }
  /**
  * @synopsis 签名算法
  *
  * @param jsapi_ticket 用于签名的 jsapi_ticket
  * @param link 用于签名的 link ，注意必须动态获取，不能 hardcode
  *
  * @returns
  */
  sign(jsapiTicket, link) {
    const ret = {
      jsapi_ticket: jsapiTicket,
      nonceStr: this.createNonceStr(),
      timestamp: this.createTimestamp(),
      url: link
    };
    const string = this.raw(ret);
    const shasum = crypto.createHash('sha1');
    shasum.update(string);
    const signature = shasum.digest('hex');
    ret.signature = signature;
    return ret;
  }
  // 根据code获取token
  async getAccessToken(code, system) {
    const options = {
      method: 'GET',
      url: 'https://api.weixin.qq.com/sns/oauth2/access_token',
      qs: {
        appid: system.appid || think.config('wxweb.appid'),
        secret: system.secret || think.config('wxweb.secret'),
        code: code,
        grant_type: 'authorization_code'
      }
    };
    let data = await rp(options);
    data = JSON.parse(data);
    return data;
  }
  // 根据token获取用户信息
  async getUserInfo(accessToken, openId) {
    const options = {
      method: 'GET',
      url: 'https://api.weixin.qq.com/sns/userinfo',
      qs: {
        access_token: accessToken,
        openid: openId,
        lang: 'zh_CN'
      }
    };
    let data = await rp(options);
    data = JSON.parse(data);
    return data;
  }
  /**
   * 获取微信统一下单参数
   */
  getUnifiedorderXmlParams(obj) {
    const body = '<xml> ' +
          '<appid>' + obj.appid + '</appid> ' +
          '<attach>' + obj.attach + '</attach> ' +
          '<body>' + obj.body + '</body> ' +
          '<mch_id>' + obj.mch_id + '</mch_id> ' +
          '<nonce_str>' + obj.nonce_str + '</nonce_str> ' +
          '<notify_url>' + obj.notify_url + '</notify_url>' +
          '<openid>' + obj.openid + '</openid> ' +
          '<out_trade_no>' + obj.out_trade_no + '</out_trade_no>' +
          '<spbill_create_ip>' + obj.spbill_create_ip + '</spbill_create_ip> ' +
          '<total_fee>' + obj.total_fee + '</total_fee> ' +
          '<trade_type>' + obj.trade_type + '</trade_type> ' +
          '<sign>' + obj.sign + '</sign> ' +
          '</xml>';
    return body;
  }

  /**
   * 获取微信统一下单的接口数据
   */
  async getPrepayId(obj, wxpaykey) {
    const that = this;
    // 生成统一下单接口参数
    const UnifiedorderParams = {
      appid: obj.appid,
      mch_id: obj.mch_id,
      notify_url: obj.notify_url, // 微信付款后的回调地址
      attach: obj.attach,
      body: obj.body,
      nonce_str: that.createNonceStr(),
      openid: obj.openid,
      out_trade_no: obj.out_trade_no, // new Date().getTime(), //订单号
      spbill_create_ip: obj.spbill_create_ip,
      total_fee: obj.total_fee,
      trade_type: 'JSAPI'
      // sign : getSign(),
    };

      // 获取 sign 参数
    UnifiedorderParams.sign = that.getSign(UnifiedorderParams, wxpaykey);
    const body = JSON.stringify(that.getUnifiedorderXmlParams(UnifiedorderParams));
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'multipart/form-data' },
      url: 'https://api.mch.weixin.qq.com/pay/unifiedorder',
      formData: {
        body: body
      }
    };
    const response = await rp(options);
    const data = await that.xml2Json(response);
    return data;
  }
  async xml2Json(response) {
    // 微信返回的数据为 xml 格式， 需要装换为 json 数据， 便于使用
    let prepayIds;
    await xml2jsparseString(response, function(errors, result) {
      // 放回数组的第一个元素
      prepayIds = result.xml.prepay_id[0];
      // console.log('prepayIds: ', prepayIds);
    });
    return prepayIds;
  }
  /**
   * 微信支付的所有参数
   * @param req 请求的资源, 获取必要的数据
   * @returns {{appId: string, timeStamp: Number, nonceStr: *, package: string, signType: string, paySign: *}}
   */

  async getBrandWCPayParams(obj, system) {
    const initParam = {
      appid: system.appid || think.config('wxweb.appid'),
      mch_id: system.mch_id || think.config('wxweb.mch_id'),
      notify_url: system.notify_url || think.config('wxweb.notify_url')
    };
    // console.log('system', system);
    const wxpaykey = system.partner_key || think.config('wxweb.partner_key'); // 秘钥
    obj = Object.assign(obj, initParam);
    // console.log('obj----', obj);
    const that = this;
    const prepay = await that.getPrepayId(obj, wxpaykey);

    const wcPayParams = {
      'appId': system.appid || think.config('wxweb.appid'), // 公众号名称，由商户传入
      'timeStamp': this.createTimestamp(), // 时间戳，自1970年以来的秒数
      'nonceStr': that.createNonceStr(), // 随机串
      // 通过统一下单接口获取
      'package': 'prepay_id=' + prepay,
      'signType': 'MD5' // 微信签名方式：
    };
    wcPayParams.paySign = that.getSign(wcPayParams, wxpaykey); // 微信支付签名
    return wcPayParams;
  }
  /**
   * 获取微信支付的签名
   * @param payParams
   */
  getSign(signParams, wxpaykey) {
    // console.log('wxpaykey', wxpaykey);
    // 按 key 值的ascll 排序
    let keys = Object.keys(signParams);
    keys = keys.sort();
    const newArgs = {};
    keys.forEach(function(val, key) {
      if (signParams[val]) {
        newArgs[val] = signParams[val];
      }
    });
    const string = queryString.stringify(newArgs) + '&key=' + wxpaykey;
    // 生成签名
    return crypto.createHash('md5').update(queryString.unescape(string), 'utf8').digest('hex').toUpperCase();
  }
  /**
   * 处理微信支付回调
   * @param notifyData
   * @returns {{}}
   */
  payNotify(notifyData) {
    if (think.isEmpty(notifyData)) {
      return false;
    }

    const notifyObj = {};
    let sign = '';
    for (const key of Object.keys(notifyData)) {
      if (key !== 'sign') {
        notifyObj[key] = notifyData[key][0];
      } else {
        sign = notifyData[key][0];
      }
    }
    // console.log('notifyObj', notifyObj);
    if (notifyObj.return_code !== 'SUCCESS' || notifyObj.result_code !== 'SUCCESS') {
      return false;
    }
    let wxpaykey = notifyObj && notifyObj.attach.split(':')[1];
    // console.log('wxpaykey-----', wxpaykey);
    wxpaykey = wxpaykey || think.config('wxweb.partner_key');
    const signString = this.getSign(notifyObj, wxpaykey);
    if (think.isEmpty(sign) || signString !== sign) {
      return false;
    }
    return notifyObj;
  }
};
