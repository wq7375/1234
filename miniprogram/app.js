// app.js
App({
  onLaunch: function () {
    wx.cloud.init();
  },

  // 全局分享配置
  globalData: {}, // 如果已有 globalData，请保留并忽略此行
  enableGlobalShare: function() {
    const originalPage = Page;
    Page = function(pageConfig) {
      const defaultShareConfig = {
        onShareAppMessage() {
          return {
            title: '姿美知音',
            path: '/pages/login/login',
            imageUrl: '/images/logo.png'
          
          };
        },
        onShareTimeline() {
          return {
            title: '姿美知音',
            imageUrl: '/images/logo.png'
          };
        }
      };
      // 合并配置：将默认分享配置与页面的自定义配置合并
      pageConfig = Object.assign({}, defaultShareConfig, pageConfig);
      originalPage(pageConfig);
    };
  }
});

// 在App实例化后启用全局分享
const app = getApp();
app.enableGlobalShare();