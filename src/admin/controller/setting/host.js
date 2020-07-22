const Base = require('../base.js');
const fs = require('fs');
module.exports = class extends Base {
  // 域名配置接口
  async listAction() {
    const userId = this.getLoginUserId();
    const list = await this.model('host').where({user_id: userId}).select();
    const host = [];
    const file = [];
    for (const item of list) {
      item.sign === 0 && host.push(item);
      item.sign === 1 && file.push(item);
    }
    const data = {
      host: host,
      file: file
    };
    return this.success(data);
  }
  async addAction() {
    const name = this.post('name');
    const host = this.post('host');
    const use = this.post('use') || 1;
    const state = this.post('state') || 1;
    const wechat = this.post('wechat') || '未检测';
    const remake = this.post('remake') || '';
    const sysInfo = await this.model('system').where({user_id: this.getLoginUserId()}).find();
    if (think.isEmpty(sysInfo.bt_siteid)) {
      return this.fail('宝塔站点id，不存在');
    }

    const getBtsdk = this.service('btsdk', 'admin');
    sysInfo.host = host;
    const btState = await getBtsdk.btHost(sysInfo, 'add');
    if (btState && !btState.status) {
      return this.fail(btState.msg);
    }
    const data = await this.model('host').add({
      name: name,
      host: host,
      state: state,
      use: use,
      wechat: wechat,
      remake: remake,
      user_id: this.getLoginUserId(),
      sign: 0
    });
    return this.success(data, '添加成功');
  }
  async updateAction() {
    const id = this.post('id');
    const name = this.post('name');
    const host = this.post('host');
    const use = this.post('use') || 1;
    const state = this.post('state') || 1;
    const wechat = this.post('wechat') || '';
    const remake = this.post('remake') || '';
    const data = await this.model('host').where({id: id}).update({
      name: name,
      host: host,
      state: state,
      use: use,
      wechat: wechat,
      remake: remake
    });
    return this.success(data, '修改成功');
  }
  async deleteAction() {
    const id = this.post('id');
    const host = this.post('host');
    const sysInfo = await this.model('system').where({user_id: this.getLoginUserId()}).find();
    if (think.isEmpty(sysInfo.bt_siteid)) {
      return this.fail('宝塔站点id，不存在');
    }
    const getBtsdk = this.service('btsdk', 'admin');
    sysInfo.host = host;
    const btState = await getBtsdk.btHost(sysInfo, 'del');
    if (btState && !btState.status) {
      return this.fail(btState.msg);
    }
    if (!think.isEmpty(id)) {
      const datas = await this.model('host').where({
        id: id
      }).delete();
      return this.success(datas, '删除成功');
    }
  }
  // 微信域名检测
  async wechatHostAction() {
    const userId = this.getLoginUserId();
    const list = await this.model('host').where({user_id: userId, sign: 0}).select();
    const getBtsdk = this.service('btsdk', 'admin');
    const data = [];
    for (const item of list) {
      if (item.host) {
        const wechat = await getBtsdk.getHoststate(item.host);
        if (wechat.code !== 200) {
          await this.model('host').where({id: item.id}).update({
            wechat: wechat.msg,
            state: 0
          });
        } else {
          await this.model('host').where({id: item.id}).update({
            wechat: wechat.msg
          });
        }
        item.wechat = wechat.msg;
        data.push(item);
      }
    }
    return this.success(data, '检测成功');
  }
  async wechatTestAction() {
    const imageFile = this.file('wechatTxt');
    const state = this.post('state') || 1;
    if (think.isEmpty(imageFile)) {
      return this.fail('保存失败');
    }
    const sysInfo = await this.model('system').where({user_id: this.getLoginUserId()}).find();
    if (think.isEmpty(sysInfo.path)) {
      return this.fail('系统路径不能为空');
    }
    const filename = '/' + imageFile.name;
    const is = fs.createReadStream(imageFile.path);
    const os = fs.createWriteStream(sysInfo.path + filename);
    is.pipe(os);
    // console.log('think.ROOT_PATH', think.ROOT_PATH);
    const data = await this.model('host').add({
      host: imageFile.name,
      user_id: this.getLoginUserId(),
      state: state,
      sign: 1
    });
    return this.success({
      id: data,
      name: imageFile.name.split('.')[0],
      path: imageFile.name
    });
  }
  async rmWechatTestAction() {
    const host = this.post('host');
    const id = this.post('id');
    const sysInfo = await this.model('system').where({user_id: this.getLoginUserId()}).find();
    if (!sysInfo && !sysInfo.path) {
      return this.fail('系统路径不能为空');
    }
    if (!id) {
      return this.fail('参数不能为空');
    }
    fs.unlink(`${sysInfo.path}${host}`, (err) => {
      if (err) {
        return this.success(err, '删除失败');
      } else {
        console.log('remove success');
      }
    });
    const data = await this.model('host').where({
      id: id
    }).delete();
    return this.success(data, '删除成功');
  }
};
