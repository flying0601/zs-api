const Base = require('./base.js');

module.exports = class extends Base {
  async getSystemAction() {
    const sysId = this.get('sysid');
    const systemModel = this.model('system');
    const system = await systemModel.getSystem(sysId);
    return this.success(system);
  }
};
