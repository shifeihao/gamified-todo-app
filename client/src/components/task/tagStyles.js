// 导入所需的图标信息，以供TaskCard.js使用
// 这里不直接导入图标组件，而是定义图标名称，以便动态导入
export const tagStyleMap = {
  // 学习与教育
  study: {
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
    textColor: 'text-blue-800',
    iconName: 'BookOpen' // 替换表情符号为图标名称
  },
  reading: {
    bgColor: 'bg-indigo-100',
    borderColor: 'border-indigo-300',
    textColor: 'text-indigo-800',
    iconName: 'BookMarked'
  },
  Academic: {
    bgColor: 'bg-sky-100',
    borderColor: 'border-sky-300',
    textColor: 'text-sky-800',
    iconName: 'GraduationCap'
  },

  // 工作与职业
  Research: {
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-300',
    textColor: 'text-purple-800',
    iconName: 'Microscope'
  },
  meeting: {
    bgColor: 'bg-fuchsia-100',
    borderColor: 'border-fuchsia-300',
    textColor: 'text-fuchsia-800',
    iconName: 'Users'
  },
  project: {
    bgColor: 'bg-violet-100',
    borderColor: 'border-violet-300',
    textColor: 'text-violet-800',
    iconName: 'Kanban'
  },

  // 技术与编程
  coding: {
    bgColor: 'bg-emerald-100',
    borderColor: 'border-emerald-300',
    textColor: 'text-emerald-800',
    iconName: 'Code'
  },
  design: {
    bgColor: 'bg-pink-100',
    borderColor: 'border-pink-300',
    textColor: 'text-pink-800',
    iconName: 'Palette'
  },
  debug: {
    bgColor: 'bg-rose-100',
    borderColor: 'border-rose-300',
    textColor: 'text-rose-800',
    iconName: 'Wrench'
  },

  // 健康与运动
  fitness: {
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
    textColor: 'text-green-800',
    iconName: 'Dumbbell'
  },
  sports: {
    bgColor: 'bg-lime-100',
    borderColor: 'border-lime-300',
    textColor: 'text-lime-800',
    iconName: 'Trophy'
  },
  health: {
    bgColor: 'bg-teal-100',
    borderColor: 'border-teal-300',
    textColor: 'text-teal-800',
    iconName: 'Heart'
  },

  // 生活与娱乐
  life: {
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-300',
    textColor: 'text-orange-800',
    iconName: 'Sparkles'
  },
  entertainment: {
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-300',
    textColor: 'text-amber-800',
    iconName: 'Gamepad2'
  },
  social: {
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-300',
    textColor: 'text-yellow-800',
    iconName: 'Share2'
  },

  // 基础分类
  default: {
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
    textColor: 'text-blue-800',
    iconName: 'FileText'
  },
  short: {
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300', 
    textColor: 'text-blue-800',
    iconName: 'Zap'
  },
  long: {
    bgColor: 'bg-indigo-700',
    borderColor: 'border-indigo-900',
    textColor: 'text-white',
    iconName: 'CalendarDays'
  },

  // 其他
  others: {
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    textColor: 'text-gray-800',
    iconName: 'FileText'
  }
};
