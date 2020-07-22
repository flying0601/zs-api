const Base = require('./base.js');

module.exports = class extends Base {
  async loginAction() {
    const username = this.post('username');
    const password = this.post('password');
    // console.log(this.post('username'));
    const admin = await this.model('admin').where({
      username: username
    }).find();
    if (think.isEmpty(admin)) {
      return this.fail(401, '用户名或密码不正确1');
    }

    if (think.md5(password + '' + admin.password_salt) !== admin.password) {
      // if (think.md5(password) !== admin.password) {
      // console.log(think.md5(password + '' + admin.password_salt), '->', admin.password_salt);
      return this.fail(400, '用户名或密码不正确2');
    }

    // 更新登录信息
    await this.model('admin').where({
      id: admin.id
    }).update({
      last_login_time: parseInt(Date.now() / 1000),
      last_login_ip: this.ctx.ip
    });

    const TokenSerivce = this.service('token', 'admin');
    const sessionKey = await TokenSerivce.create({
      user_id: admin.id
    });

    if (think.isEmpty(sessionKey)) {
      return this.fail('登录失败');
    }

    const userInfo = {
      id: admin.id,
      username: admin.username,
      avatar: admin.avatar,
      admin_role_id: admin.admin_role_id
    };

    return this.success({
      token: sessionKey,
      userInfo: userInfo
    }, '登录成功');
  }
  async registerAction() {
    const username = this.post('username');
    const password = this.post('password');
    const salt = Math.ceil(Math.random() * 100);
    const userInfo = {
      username: username,
      password: think.md5(password + '' + salt),
      password_salt: salt
    };
    if (think.isEmpty(username)) {
      return this.fail(401, '用户名不能为空');
    }
    if (think.isEmpty(password)) {
      return this.fail(401, '密码不能为空');
    }
    const admin = await this.model('admin').where({
      username: username
    }).find();
    if (!think.isEmpty(admin)) {
      return this.fail(401, '用户名已存在');
    }
    // console.log(userInfo);
    const datas = await this.model('admin').add(userInfo);
    // console.log(datas);
    return this.success(datas, '添加成功');
  }
  async getInfoAction() {
    const userId = this.ctx.state.userId;
    const admin = await this.model('admin').where({
      id: userId
    }).find();
    // console.log(admin);
    const info = {
      name: admin.username,
      roles: (admin.roles).split(','),
      introduce: admin.introduce
    };
    return this.success(info);
  }
  async addUserAction() {
    const username = this.post('username');
    const usertag = this.post('usertag');
    const userInfo = {
      username: username,
      password: usertag
    };
    if (think.isEmpty(username)) {
      return this.fail(401, '手机号不能为空');
    }
    if (think.isEmpty(usertag)) {
      return this.fail(401, '姓名不能为空');
    }
    const admin = await this.model('admin').where({
      username: username
    }).find();
    if (!think.isEmpty(admin)) {
      return this.fail(401, '手机号已存在');
    }
    // console.log(userInfo);
    const datas = await this.model('admin').add(userInfo);
    // console.log(datas);
    return this.success(datas, '签到成功');
  }
  async updateUserAction() {
    const username = this.post('username');
    const avatar = this.post('avatar');
    await this.model('admin').where({
      username: username
    }).update({
      avatar: avatar
    });
    return this.success(username, '修改成功');
  }
  async getUserAction() {
    const username = this.post('username');
    if (think.isEmpty(username)) {
      return this.fail(401, '手机号不能为空');
    }
    const admin = await this.model('admin').where({
      username: username
    }).find();
    if (!think.isEmpty(admin)) {
      return this.fail(401, '手机号已存在');
    }
    return this.success(admin, '可以签到成功');
  }
};
