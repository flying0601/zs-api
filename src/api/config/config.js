// default config
module.exports = {
  // 可以公开访问的Controller
  publicController: [
    // 格式为controller
    'index',
    'topic',
    'auth',
    'wechat',
    'upload',
    'url',
    'course/order',
    'vote/index',
    'vote/old'
  ],

  // 可以公开访问的Action
  publicAction: [
    // 格式为： controller+action
    'pay/notify'
  ]
};
