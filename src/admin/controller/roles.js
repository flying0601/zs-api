const Base = require('./base.js');

module.exports = class extends Base {
  async getInfoAction() {
    const userId = this.ctx.state.userId;
    const admin = await this.model('admin').where({
      id: userId
    }).find();
    const rolesInfo = (admin.roles).split(',');
    // console.log('rolesInfo', rolesInfo);
    const info = {
      name: admin.username,
      roles: rolesInfo,
      introduce: admin.introduce
    };
    return this.success(info);
  }

  async getRolesAction() {
    const admin = this.model('admin');
    // const data = await admin.field(['username AS a_key', 'id AS c_id', 'roles', 'description']['id', 'username', 'roles', 'description']).page(this.get('page') || 1, this.get('size') || 10).countSelect();
    const data = await admin.field(['id', 'username', 'roles', 'description']).page(this.get('page') || 1, this.get('size') || 10).countSelect();
    const allRoles = data.data;
    allRoles.forEach(item => {
      item.key = item.username;
      item.pages = item.roles.includes(',') ? (item.roles).split(',') : [item.roles];
      item.description = item.description;
      delete item.username;
      delete item.roles;
    });
    data.allRoles = allRoles;
    delete data.data;
    return this.success(data);
  }
  async updRolesAction() {
    const id = this.post('id');
    const roles = this.post('roles');
    const username = this.post('username');
    const description = this.post('description');
    await this.model('admin').where({
      id: id
    }).update({
      username: username,
      roles: roles,
      description: description
    });
    return this.success(id, '修改成功');
  }
  async addRolesAction() {
    const roles = this.post('roles');
    const username = this.post('username');
    const description = this.post('description');
    const datas = await this.model('admin').add({
      username: username,
      roles: roles,
      description: description
    });
    return this.success(datas, '添加成功');
  }
  async delRolesAction() {
    const id = this.post('id');
    if (!think.isEmpty(id)) {
      const datas = await this.model('admin').where({
        id: id
      }).delete();
      return this.success(datas, '删除成功');
    }
  }
};
