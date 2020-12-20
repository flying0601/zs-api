const fly = require('flyio');
const nodemailer = require('nodemailer');
// const rp = require('request-promise');
module.exports = class extends think.Service {
  // 域名检测
  async getHoststate(host) {
    // const url = `http://apicheck.i-active.cn/api/wx?domain=${host}`;
    const url = `http://127.0.0.1:1234/api/vx?url=${host}&token=bb760e66a5e5faa309f4931ff64776b1`;
    const data = await fly.get(url).then(params => {
      console.log('params: ', params.data);
      if (params.data) {
        return params.data;
      }
    }).catch(error => {
      return error;
    });
    /*  const options = {
      method: 'GET',
      url: 'http://jzcheck.i-active.cn/api/vx',
      qs: {
        url: host,
        token: '640bb291b8d1903792c0538136359779'
      }
    };
    let res = await rp(options);
    console.log('res: ', res);
    res = res ? JSON.parse(res) : {}; */
    return data;
  }
  // 发邮件
  async sendEmail(toList, contents) {
    const transporter = nodemailer.createTransport({
      // host: 'smtp.ethereal.email',
      service: 'qq', // 使用了内置传输发送邮件 查看支持列表：https://nodemailer.com/smtp/well-known/
      port: 465, // SMTP 端口
      secureConnection: true, // 使用了 SSL
      auth: {
        user: '2783087336@qq.com',
        // 这里密码不是qq密码，是你设置的smtp授权码
        pass: 'njjujvbsfebldeib'
      }
    });

    const mailOptions = {
      from: '"鲸贝科技" <2783087336@qq.com>', // sender address
      to: toList || '985684161@qq.com', // list of receivers
      subject: '鲸贝科技异常提醒', // Subject line
      // 发送text或者html格式
      // text: 'Hello world?', // plain text body
      html: contents || '<b>Hello world?</b>' // html body
    };

    // send mail with defined transport object
    await transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return error;
      } else {
        console.log('Message sent: %s', info.messageId);
        return info;
      }

      // Message sent: <04ec7731-cc68-1ef6-303c-61b0f796b78f@qq.com>
    });
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
