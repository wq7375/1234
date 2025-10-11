// pages/teacherDetail/teacherDetail.js
const db = wx.cloud.database();

Page({
  data: { 
    teacher: {},
    formattedSkills: "加载中..."
  },
  
  onLoad(options) {
    db.collection('teachers').doc(options.id).get({
      success: res => {
        const teacher = res.data;
        // 处理skills字段，确保它是数组格式
        let skills = teacher.skills;
        if (!skills) {
          skills = [];
        } else if (typeof skills === 'string') {
          // 如果skills是字符串，尝试解析为数组
          try {
            skills = JSON.parse(skills);
          } catch (e) {
            skills = [skills];
          }
        }
        
        // 格式化skills为显示字符串
        const formattedSkills = skills.length > 0 ? 
          skills.join('、') : '暂无擅长领域';
        
        this.setData({ 
          teacher: teacher,
          formattedSkills: formattedSkills
        });
      },
      fail: err => {
        console.error('获取老师信息失败:', err);
        wx.showToast({
          title: '获取信息失败',
          icon: 'none'
        });
        this.setData({
          formattedSkills: '获取失败'
        });
      }
    });
  }
});