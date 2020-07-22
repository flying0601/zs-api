const fly = require('flyio');

module.exports = class extends think.Service {
  // 域名检测
  async getHoststate(host) {
    const url = `http://apicheck.i-active.cn/api/wx?domain=${host}`;
    const data = await fly.get(url).then(params => {
      if (params.data) {
        return params.data;
      }
    }).catch(error => {
      this.fail(error);
    });
    return data;
  }
  // 域名宝塔操作
  async btHost(params, type = 'add') {
    let url = '';
    const root = 'http://btapi.i-active.cn/';
    if (type === 'add') {
      url = root + `site/WebAddDomain?domain=${params.host}&webname=${params.bt_sitename}&id=${params.bt_siteid}`;
    } else {
      url = root + `site/WebDelDomain?domain=${params.host}&webname=${params.bt_sitename}&id=${params.bt_siteid}`;
    }
    const data = await fly.get(url).then(res => {
      if (res.data) {
        return JSON.parse(res.data);
      }
    }).catch(error => {
      this.fail(error);
    });
    return data;
  }
};
