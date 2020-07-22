const Base = require('../base.js');

module.exports = class extends Base {
  /**
   * index action
   * @return {Promise} []
   */
// 查分类所有
  async cateListAction() {
    const page = this.get('page') || 1;
    const size = this.get('size') || 10;
    const name = this.get('name') || '';
    let parent = this.get('parent') || '';
    let sign;
    if (parent === 'all') {
      sign = '>';
      parent = 0;
    } else {
      sign = '=';
    }
    const model = this.model('category', 'shop');
    const data = await model.where({name: ['like', `%${name}%`], parent_id: [sign, parent]}).order(['sort_order ASC']).page(page, size).countSelect();
    return this.success(data);
  }
  async cataGoodsAction() {
    const model = this.model('category', 'shop');
    const data = await model.field(['id AS value', 'name AS label']).where('parent_id = 0').select();
    for (const item of data) {
      // console.log('ss', item.id);
      item.children = await model.field(['id AS value', 'name AS label']).where(`parent_id = ${item.value}`).select();
    }
    return this.success(data);
  }
  async updAction() {
    const id = this.post('id');
    const name = this.post('name');
    const desc = this.post('front_name');
    const isShow = this.post('is_show') || 1;
    const order = this.post('sort_order') || 0;
    await this.model('category', 'shop').where({
      id: id
    }).update({
      name: name,
      front_name: desc,
      is_show: isShow,
      sort_order: order
    });
    return this.success(id, '修改成功');
  }
  async addAction() {
    const name = this.post('name');
    const desc = this.post('front_name');
    const isShow = this.post('is_show') || 1;
    const order = this.post('sort_order') || 0;
    const data = await this.model('category', 'shop').add({
      name: name,
      front_name: desc,
      is_show: isShow,
      sort_order: order,
      parent_id: 1
    });
    return this.success(data, '添加成功');
  }
  async delAction() {
    const id = this.post('id');
    if (!think.isEmpty(id)) {
      const datas = await this.model('category', 'shop').where({
        id: id
      }).delete();
      return this.success(datas, '删除成功');
    }
  }
  async indexAction() {
    const model = this.model('category', 'shop');
    const data = await model.where({
      is_show: 1
    }).order(['sort_order ASC']).select();
    const topCategory = data.filter((item) => {
      return item.parent_id === 0;
    });
    const categoryList = [];
    topCategory.map((item) => {
      item.level = 1;
      categoryList.push(item);
      data.map((child) => {
        if (child.parent_id === item.id) {
          child.level = 2;
          categoryList.push(child);
        }
      });
    });
    return this.success(categoryList);
  }

  async topCategoryAction() {
    const model = this.model('category', 'shop');
    const data = await model.where({
      parent_id: 0
    }).order(['id ASC']).select();

    return this.success(data);
  }

  async infoAction() {
    const id = this.get('id');
    const model = this.model('category', 'shop');
    const data = await model.where({
      id: id
    }).find();

    return this.success(data);
  }

  async storeAction() {
    if (!this.isPost) {
      return false;
    }

    const values = this.post();
    const id = this.post('id');

    const model = this.model('category', 'shop');
    values.is_show = values.is_show ? 1 : 0;
    if (id > 0) {
      await model.where({
        id: id
      }).update(values);
    } else {
      delete values.id;
      await model.add(values);
    }
    return this.success(values);
  }

  async destoryAction() {
    const id = this.post('id');
    await this.model('category', 'shop').where({
      id: id
    }).limit(1).delete();
    // TODO 删除图片

    return this.success();
  }
};
