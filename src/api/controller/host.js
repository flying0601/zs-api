const Base = require('./base.js');

module.exports = class extends Base {
  async getActiveHostAction() {
    const sysId = this.get('sysid');
    const use = this.get('use') || 1;
    const host = await this.model('host').where({sys_id: sysId, use: use, state: 1}).select();
    return this.success(host);
  }
  // 定时微信域名检测
  async autoHostAction() {
    const toList = this.get('toList');
    const use = this.get('use');
    let list;
    if (use) {
      list = await this.model('host').where({use: use, state: 1, sign: 0}).select();
    } else {
      list = await this.model('host').where({state: 1, sign: 0}).select();
    }
    const getBtsdk = this.service('btsdk', 'admin');
    let contents = '';
    // console.log(list);
    const data = [];
    for (const item of list) {
      let wechat;
      if (item.host) {
        if (item.use === 1) {
          wechat = await getBtsdk.getHoststate(item.host + '/vt/main.html');
        } else {
          wechat = await getBtsdk.getHoststate(item.host + '/vt/');
        }
        if (wechat.code === 201) {
          await this.model('host').where({id: item.id}).update({
            wechat: wechat.msg,
            state: 0
          });
          const system = await this.model('system').getSystem(item.sys_id);
          item.wechat = wechat.msg;
          item.systname = system.name;
          contents += `<p>${item.systname}:<b>${item.host}</b>${wechat.msg}<p>`;
          data.push(item);
        }
      }
    }
    // 发送异常状态的邮件
    // console.log(contents);
    contents && await getBtsdk.sendEmail(toList, contents);
    return this.success(data, '检测成功');
  }
};
