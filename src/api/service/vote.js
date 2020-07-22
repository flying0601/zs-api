/*
 * @Descripttion:投票活动
 * @Author: ylf
 * @Date: 2020-06-30 09:17:49
 * @LastEditors: ylf
 * @LastEditTime: 2020-07-02 09:24:00
 */
const rp = require('request-promise');
module.exports = class extends think.Service {
  async swapConfig(params) {
    const options = {
      method: 'POST',
      url: 'http://wxvote2.i-active.cn/api.php',
      qs: {
        config: params
      }
    };
    let res = await rp(options);
    res = JSON.parse(res);
    if (res && res.code === 200) {
      return res.data;
    } else {
      return 'swap fail';
    }
  }
  // 转译富文本
  async htmlEncodeByRegExp(sHtml) {
    return sHtml.replace(/[<>&"]/g, function(c) { return {'<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;'}[c] });
  }
  // 反转译富文本
  async escape2Html(str) {
    const arrEntities = {'lt': '<', 'gt': '>', 'nbsp': ' ', 'amp': '&', 'quot': '"'};
    return str.replace(/&(lt|gt|nbsp|amp|quot);/ig, function(all, t) { return arrEntities[t] });
  }
}
;
