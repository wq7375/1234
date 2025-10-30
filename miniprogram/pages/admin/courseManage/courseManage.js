// 移除原有的数据库引用
// const db = wx.cloud.database();
// const _ = db.command;

const hours = ['07','08','09','10','11','12','13','14','15','16','17','18','19','20',"21","22"];
const minutes = ['00',"05","10",'15',"20","25",'30',"35","40",'45','50','55'];

/******** 日期工具：全部使用本地时区，避免 toISOString 产生的跨天偏移 ********/
function pad(n){ return String(n).padStart(2,'0'); }
function formatDateLocal(d) {
  // 以本地时区生成 YYYY-MM-DD
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function parseDateLocal(ymd) {
  // 解析 'YYYY-MM-DD' 为本地日期
  const [y,m,d] = ymd.split('-').map(Number);
  return new Date(y, m-1, d, 0, 0, 0, 0);
}
function addDaysLocal(d, days) {
  const dd = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  dd.setDate(dd.getDate() + days);
  return dd;
}
function startOfWeekMonday(baseDate, offsetDays = 0) {
  const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  let wd = d.getDay(); // 0=周日
  if (wd === 0) wd = 7; // 把周日视作第7天
  d.setDate(d.getDate() - wd + 1 + offsetDays); // 退到周一，然后加偏移（0=本周，7=下周）
  return d;
}
/**
 * 取本周/下周的"周一"字符串，以及为兼容旧数据的"周日锚点"字符串
 * - mondayStr: 本周（或下周）周一
 * - sundayAnchorStr: 周一的前一天（周日）。用于兼容旧数据把 weekStart 存成周日的情况
 */
function getWeekStartStrings(weekOffset = 0) {
  const mondayDate = startOfWeekMonday(new Date(), weekOffset);
  const mondayStr = formatDateLocal(mondayDate);
  const sundayAnchorStr = formatDateLocal(addDaysLocal(mondayDate, -1));
  const weekEndStr = formatDateLocal(addDaysLocal(mondayDate, 6)); // 当周周日
  return { mondayDate, mondayStr, sundayAnchorStr, weekEndStr };
}

// 工具：判断是否可制定下周课表（周六10点后）
function canSetNextWeekSchedule() {
  const now = new Date();
  const day = now.getDay(); // 0=周日, 1=周一, ..., 6=周六
  const hours = now.getHours();
   // 周六10点后或周日全天都可以设置下周课表
   return (day === 6 && hours >= 10) || day === 0;
  }
  function getWeekDates(weekOffset = 0) {
    const { mondayDate } = getWeekStartStrings(weekOffset);
    const weekNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const arr = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(mondayDate);
      d.setDate(mondayDate.getDate() + i);
      const date = formatDateLocal(d);
      arr.push({
        date,
        day: date.slice(5), // 'MM-DD'
        week: weekNames[i]
      });
    }
    return arr;
  }

Page({
  data: {
    weekStart: '', // 当前周一日期（字符串）
    courses: [],
    selectedDate: '', // 当前选中日期
    selectedType: 'group',
    weekDates:[],
    editingLesson: {
      startHour: '09',
      startMinute: '00',
      endHour: '10',
      endMinute: '00',
      teacher: '',
      content: '',
      minCount: ' ',
      maxCount: ' ',
      isLoading: true,
      isAdmin: false,
      errorMessage: ''
    },
    hours,
    minutes,
    weekOffset: 0, // 0: 本周，7: 下周
    canSetNextWeek: false, // 是否可制定下周课表
    hasUnsavedChanges: false, // 标记是否有未保存的修改
    isCheckingUnsaved: false,  // 防止重复检查
  },

  onLoad() {
    this.checkAdminPermission();
    this.initWeek();
    // console.log(this.data)
  },

  onUnload() {
    this.checkUnsavedChanges('onUnload');
  },

  onHide() {
    this.checkUnsavedChanges('onHide');
  },

  // 检查未保存更改的方法
  checkUnsavedChanges(source) {
    if (this.data.isCheckingUnsaved || !this.data.hasUnsavedChanges) {
      return;
    }
    
    this.setData({ isCheckingUnsaved: true });
    
    wx.showModal({
      title: '未保存的更改',
      content: '您有未保存的修改，是否要保存？',
      showCancel: true,
      cancelText: '不保存',
      confirmText: '保存',
      success: (res) => {
        this.setData({ isCheckingUnsaved: false });
        
        if (res.confirm) {
          // 用户选择保存
          this.saveSchedule();
          // 延迟退出，让保存操作完成
          setTimeout(() => {
            if (source === 'onUnload') {
              wx.navigateBack();
            }
          }, 1000);
        } else if (res.cancel) {
          // 用户选择不保存，直接退出
          if (source === 'onUnload') {
            wx.navigateBack();
          }
        }
        // 如果用户点击蒙层关闭，则不执行任何操作
      },
      fail: () => {
        this.setData({ isCheckingUnsaved: false });
      }
    });
  },

  // 检查管理员权限
  checkAdminPermission() {
    wx.showLoading({ title: '检查权限中' })
    
    wx.cloud.callFunction({
      name: 'login', // 改为调用 login 云函数
      data: {
        // 传递空参数，避免创建新用户
        name: '',
        phone: ''
      },
      success: res => {
        wx.hideLoading()
        // console.log('login 云函数返回结果:', res)
        
        // 根据 login 函数的返回结果判断是否是管理员
        if (res.result && res.result.role === 'admin') {
          // 有权限，初始化页面
          this.setData({ 
            isAdmin: true,
            canSetNextWeek: canSetNextWeekSchedule() 
          }, () => {
            this.initWeek()
          })
        } else {
          // 无权限或其他错误
          this.setData({ 
            isLoading: false,
            errorMessage: res.result.message || '您不是管理员，无法访问此页面'
          })
          wx.showModal({
            title: '权限不足',
            content: res.result.message || '您不是管理员，无法访问此页面',
            showCancel: false,
            success: () => {
              wx.navigateBack()
            }
          })
        }
      },
      fail: err => {
        console.error('权限检查失败:', err)
        wx.hideLoading()
        this.setData({ 
          isLoading: false,
          errorMessage: '权限检查失败，请检查网络连接'
        })
        wx.showToast({ title: '权限检查失败', icon: 'none' })
      }
    })
  },

  // 切换本周/下周课表
  showThisWeek() {
    this.checkUnsavedBeforeNavigate(() => {
      this.setData({ weekOffset: 0 }, () => this.initWeek());
    });
  },
  showNextWeek() {
    this.checkUnsavedBeforeNavigate(() => {
      this.setData({ weekOffset: 7 }, () => this.initWeek());
    });
  },
  

  // 初始化课表
  initWeek() {
    const { weekOffset } = this.data;
    const { mondayStr } = getWeekStartStrings(weekOffset);
    
    // console.log('初始化周数据，周偏移:', weekOffset, '周一日期:', mondayStr);
    
    // 生成周日期数组
    const weekDates = getWeekDates(weekOffset);
    
    this.setData({ 
      weekStart: mondayStr,
      weekDates 
    });

    wx.cloud.callFunction({
      name: 'manageSchedule',
      data: {
        operation: 'getSchedule',
        data: { weekOffset }
      },
      success: res => {
        // console.log('获取课表云函数返回:', res);
        if (res.result && res.result.success) {
          const data = res.result.data;
          // console.log('获取到的课表数据:', data);
          
          this.setData({
            courses: data.courses,
            selectedDate: data.selectedDate,
            selectedType: data.selectedType
          });
        } else {
          console.error('获取课表失败:', res.result);
          wx.showToast({ title: res.result.message || '课表加载失败', icon: 'none' });
        }
      },
      fail: (err) => {
        console.error('调用云函数失败:', err);
        wx.showToast({ title: '课表加载失败', icon: 'none' });
      }
    });
  },

  // 复制上周课表
  copyLastWeekSchedule() {
    const { weekOffset } = this.data;
    
    wx.showLoading({ title: '复制中...' });
    wx.cloud.callFunction({
      name: 'manageSchedule',
      data: {
        operation: 'copyLastWeek',
        data: { weekOffset }
      },
      success: res => {
        wx.hideLoading();
        if (res.result.success) {
          this.setData({
            courses: res.result.data.courses,
            selectedDate: res.result.data.selectedDate,
            selectedType: res.result.data.selectedType
          });
          wx.showToast({ title: res.result.message, icon: 'success' });
        } else {
          wx.showToast({ title: res.result.message || '复制失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '复制失败', icon: 'none' });
      }
    });
  },

  // 添加选择日期的方法
  selectDate(e) {
    const date = e.currentTarget.dataset.date;
    this.setData({ selectedDate: date });
  },

  // 修改selectDateType方法
  selectDateType(e) {
    const { date, type } = e.currentTarget.dataset;
    this.setData({ selectedDate: date, selectedType: type });
  },

  // picker选择小时或分钟
  onPickerChange(e) {
    const { field } = e.currentTarget.dataset;
    const value = e.detail.value;
    const editingLesson = { ...this.data.editingLesson };
    editingLesson[field] = field.includes('Hour') ? hours[value] : minutes[value];
    this.setData({ editingLesson });
  },

  // 录入表单
  onLessonFieldInput(e) {
    const { field } = e.currentTarget.dataset;
    const editingLesson = { ...this.data.editingLesson, [field]: e.detail.value };
    this.setData({ editingLesson });
  },

  // 新增课程
  addLesson() {
    const { courses, selectedDate, selectedType, editingLesson } = this.data;
    if (!selectedDate || !selectedType) {
      wx.showToast({ title: '请先选择日期和类型', icon: 'none' });
      return;
    }
    if (!editingLesson.teacher.trim() || !editingLesson.content.trim()) {
      wx.showToast({ title: '请填写老师和课程内容', icon: 'none' });
      return;
    }
    const startTime = `${editingLesson.startHour}:${editingLesson.startMinute}`;
    const endTime = `${editingLesson.endHour}:${editingLesson.endMinute}`;
    const minCount = editingLesson.minCount && !isNaN(Number(editingLesson.minCount)) ? Number(editingLesson.minCount) : 3;
    const maxCount = editingLesson.maxCount && !isNaN(Number(editingLesson.maxCount)) ? Number(editingLesson.maxCount) : 12;

    const idx = courses.findIndex(c => c.date === selectedDate && c.type === selectedType);
    if (idx > -1) {
      // 获取课程对象，确保lessons存在且是对象格式
      const course = courses[idx];
      if (!course.lessons) {
        course.lessons = { numOfLessonsAdded: 0 };
      }
      
      // 生成新的课程ID：当前课程数量 + 1
      const newLessonId = course.lessons.numOfLessonsAdded + 1;
      
      // 创建新的课程对象
      const newLesson = {
        _id: newLessonId,
        startTime,
        endTime,
        teacher: editingLesson.teacher.trim(),
        content: editingLesson.content.trim(),
        minCount,
        maxCount,
        bookedCount: 0,
      };
      
      // 将新课程添加到lessons对象中，使用生成的ID作为键
      course.lessons[newLessonId] = newLesson;
      
      // 更新课程数量计数器
      course.lessons.numOfLessonsAdded = newLessonId;
      
      this.setData({
        courses,
        hasUnsavedChanges: true, // 标记有未保存修改
        editingLesson: {
          startHour: '09',
          startMinute: '00',
          endHour: '10',
          endMinute: '00',
          teacher: '',
          content: '',
          minCount: '3',
          maxCount: '12'
        }
      });
    } else {
      wx.showToast({ title: '未找到匹配的日期/类型', icon: 'none' });
    }
  },

  onDeleteLesson(e) {
    const { date, type, id } = e.currentTarget.dataset;
    const { weekStart } = this.data;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这节课吗？',
      success: (res) => {
        if (res.confirm) {
          wx.cloud.callFunction({
            name: 'manageSchedule',
            data: {
              operation: 'deleteLesson',
              data: { weekStart, date, type, lessonIndex: id }
            },
            success: (res) => {
              // 无论云端删除是否成功，都删除本地数据
              this.deleteLocalLesson(date, type, id);
              
              if (res.result.success) {
                wx.showToast({ title: res.result.message || '删除成功' });
              } else {
                // 云端删除失败，但本地数据已删除
                console.log('云端删除失败，但本地数据已删除:', res.result.message);
              }
            },
            fail: (err) => {
              console.error('调用云函数失败，删除本地数据:', err);
              // 即使云函数调用失败，也要删除本地数据
              this.deleteLocalLesson(date, type, id);
            }
          });
        }
      }
    });
  },
  
  // 新增：删除本地课程数据的方法
  deleteLocalLesson(date, type, lessonId) {
    const courses = [...this.data.courses];
    const courseIndex = courses.findIndex(c => c.date === date && c.type === type);
    
    if (courseIndex > -1) {
      const course = courses[courseIndex];
      // 检查课程是否存在，然后删除
      if (course.lessons && course.lessons.hasOwnProperty(lessonId)) {
        delete course.lessons[lessonId];
        this.setData({
          courses,
          hasUnsavedChanges: true // 标记有未保存修改
        });
      }
    }
  },

  // 保存课表
  saveSchedule() {
    const { weekStart, courses } = this.data;
    
    wx.cloud.callFunction({
      name: 'manageSchedule',
      data: {
        operation: 'saveSchedule',
        data: { weekStart, courses }
      },
      success: res => {
        if (res.result.success) {
          wx.showToast({ title: res.result.message });
          // 保存成功后重置未保存标记
          this.setData({ hasUnsavedChanges: false });
        } else {
          wx.showToast({ title: res.result.message || '保存失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '保存失败', icon: 'none' });
      }
    });
  },
  
  goToschedules() {
    this.checkUnsavedBeforeNavigate(() => {
      wx.navigateTo({ url: '/pages/admin/schedules/schedules' });
    });
  },

  checkUnsavedBeforeNavigate(callback) {
    if (!this.data.hasUnsavedChanges) {
      callback();
      return;
    }
    
    wx.showModal({
      title: '未保存的更改',
      content: '您有未保存的修改，是否要保存？',
      showCancel: true,
      cancelText: '不保存',
      confirmText: '保存',
      success: (res) => {
        if (res.confirm) {
          // 保存并导航
          this.saveSchedule();
          // 延迟执行导航，让保存操作完成
          setTimeout(callback, 1000);
        } else if (res.cancel) {
          // 不保存直接导航
          callback();
        }
        // 如果用户点击蒙层关闭，则不执行导航
      }
    });
  },
  
  // 获取预约名单
  viewBookings(e) {
    const { date, type, index } = e.currentTarget.dataset;
    const { weekStart } = this.data;
    
    wx.showLoading({ title: '加载中...' });
    
    // 调用云函数获取预约名单
    wx.cloud.callFunction({
      name: 'getLessonBookings',
      data: {
        weekStart: weekStart,
        date: date,
        type: type,
        lessonIndex: index
      },
      success: res => {
        wx.hideLoading();
        if (res.result && res.result.success) {
          const students = res.result.data || [];
          const names = students.map(s => s.name).join(', ');
          wx.showModal({
            title: '预约名单',
            content: names || '暂无预约'
          });
        } else {
          wx.showToast({ title: '获取预约名单失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '获取预约名单失败', icon: 'none' });
      }
    });
  },

  // 辅助函数，用于检查课表中是否有课
  hasRealLessons: function(lessonsObj) {
    if (!lessonsObj) return false;
    
    // 遍历对象，排除numOfLessonsAdded等非课程属性
    for (let key in lessonsObj) {
      if (key !== 'numOfLessonsAdded' && 
          lessonsObj[key] && 
          typeof lessonsObj[key] === 'object' && 
          lessonsObj.hasOwnProperty(key)) {
        return true;
      }
    }
    return false;
  },
});
