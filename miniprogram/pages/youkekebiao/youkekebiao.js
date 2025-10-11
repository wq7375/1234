const db = wx.cloud.database();

Page({
  data: {
    tabList: [
      { type: 'group', label: '团课' },
      { type: 'private', label: '私教' }
    ],
    weekList: [],
    activeType: 'group',
    activeWeekIndex: 0,
    courseList: []
  },
  
  onLoad() {
    this.initWeeks();
  },
  
 // 最保险的解决方案
initWeeks() {
  db.collection('schedules').orderBy('weekStart', 'desc').limit(2).get({
    success: res => {
      if (res.data && res.data.length > 0) {
        let weekList = [];
        
        if (res.data.length === 1) {
          // 只有一周数据，默认显示为本周课表
          weekList = [{
            label: '本周课表',
            weekStart: res.data[0].weekStart,
            courses: this.processCourses(res.data[0].courses || [])
          }];
        } else {
          // 有两周数据，根据日期判断哪个是本周哪个是下周
          const date1 = new Date(res.data[0].weekStart);
          const date2 = new Date(res.data[1].weekStart);
          
          // 日期更早的是本周，日期更晚的是下周
          if (date1 < date2) {
            weekList = [
              { label: '本周课表', weekStart: res.data[0].weekStart, courses: this.processCourses(res.data[0].courses || []) },
              { label: '下周课表', weekStart: res.data[1].weekStart, courses: this.processCourses(res.data[1].courses || []) }
            ];
          } else {
            weekList = [
              { label: '本周课表', weekStart: res.data[1].weekStart, courses: this.processCourses(res.data[1].courses || []) },
              { label: '下周课表', weekStart: res.data[0].weekStart, courses: this.processCourses(res.data[0].courses || []) }
            ];
          }
        }
        
        this.setData({ weekList, activeWeekIndex: 0 }, () => {
          this.refreshCourses();
        });
      } else {
        // 没有数据时显示提示
        this.setData({
          weekList: [{
            label: '本周课表',
            weekStart: new Date(),
            courses: []
          }]
        });
      }
    },
    fail: err => {
      console.error('获取课表数据失败:', err);
      wx.showToast({
        title: '获取课表失败',
        icon: 'none'
      });
    }
  });
},

// 获取周的起始日期（周一）
getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 周一
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
},
  
  // 处理课程数据，将lessons对象转换为数组
  processCourses(courses) {
    return courses.map(course => {
      // 转换lessons对象为数组
      const lessonsArray = [];
      if (course.lessons && typeof course.lessons === 'object') {
        for (const key in course.lessons) {
          if (key !== 'numOfLessonsAdded' && course.lessons[key] && typeof course.lessons[key] === 'object') {
            lessonsArray.push({
              id: key,
              ...course.lessons[key]
            });
          }
        }
      }
      
      // 格式化日期和星期
      let formattedDate = '';
      let weekDay = '';
      if (course.date) {
        const date = new Date(course.date);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
        formattedDate = `${month}月${day}日`;
        weekDay = `周${weekDays[date.getDay()]}`;
      }
      
      return {
        ...course,
        lessonsArray: lessonsArray,
        hasLessons: lessonsArray.length > 0,
        formattedDate: formattedDate,
        weekDay: weekDay
      };
    });
  },
  
  // 切换课程类型
  onTabChange(e) {
    this.setData({ activeType: e.currentTarget.dataset.type }, () => {
      this.refreshCourses();
    });
  },
  
  // 切换周
  onWeekChange(e) {
    this.setData({ activeWeekIndex: e.currentTarget.dataset.index }, () => {
      this.refreshCourses();
    });
  },
  
  // 课表筛选
  refreshCourses() {
    const { weekList, activeWeekIndex, activeType } = this.data;
    if (!weekList.length) {
      return this.setData({ courseList: [] });
    }
    
    const allCourses = weekList[activeWeekIndex].courses || [];
    // 过滤出当前类型的课程
    const courseList = allCourses.filter(
      c => c.type === activeType
    );
    
    this.setData({ courseList });
  }
})