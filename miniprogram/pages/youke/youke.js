// pages/youke/youke.js
const db = wx.cloud.database();

Page({
  data: {
    banners: [],
    teacherList: []
  },
  onLoad() {
    const name = '';
    const phone = '';

    // wx.redirectTo({ url: '/pages/adminHome/adminHome' }); return //本地测试，用于直接跳转admin页面
    wx.showLoading({ title: '读取中...' });
    wx.cloud.callFunction({
      name: 'login',
      data: { name, phone },
      success: res => {
        const role = res.result.role;
        // console.log(res.result.LogInfo);//日志，可删
        if (role === 'admin') {
          wx.redirectTo({ url: '/pages/adminHome/adminHome' })
        } else if (role === 'student') {
          wx.switchTab({ url: '/pages/studentHome/studentHome' })
        }
        wx.hideLoading();
      },
      fail: () => {
        wx.showToast({ title: '登录失败', icon: 'none' });
      }
    })

    this.getBanners();
    this.getTeachers();
  },
  getBanners() {
    db.collection('banners').orderBy('createTime', 'desc').get({
      success: res => {
        // 支持新老字段兼容
        const banners = res.data.map(item => ({
          ...item,
          image: item.image || item.url // 兼容image/url字段
        }));
        this.setData({ banners });
      }
    });
  },
  getTeachers() {
    db.collection('teachers').orderBy('createTime', 'desc').get({
      success: res => {
        this.setData({ teacherList: res.data });
      }
    });
  },
  goTokebiao() {
    wx.navigateTo({ url: '/pages/youkekebiao/youkekebiao' });
  },
  goToexperience() {
    wx.navigateTo({ url: '/pages/experience/experience' });
  },
  goTeacherDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/teacherDetail/teacherDetail?id=' + id });
  },
  goTologin() {
    wx.navigateTo({ url: '/pages/login/login' });
  }
});