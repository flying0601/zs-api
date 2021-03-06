module.exports = class extends think.Controller {
  async __before() {
    // 根据token值获取用户id
    this.ctx.state.token = this.ctx.header['authorization'] || '';
    const tokenSerivce = think.service('token', 'admin');
    this.ctx.state.userId = await tokenSerivce.getUserId(this.ctx.state.token);
    // 只允许登录操作
    if (this.ctx.controller !== 'auth') {
      if (this.ctx.state.userId <= 0) {
        return this.fail(401, '请先登录');
      }
    }
  }
  /**
   * 获取时间戳
   * @returns {Number}
   */
  getTime() {
    return parseInt(Date.now() / 1000);
  }
  /**
   * 获取当前登录用户的id
   * @returns {*}
   */
  getLoginUserId() {
    return this.ctx.state.userId;
  }
};
