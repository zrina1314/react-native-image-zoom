/** 数值范围限制工具函数（Reanimated worklet） */
export const clamp = (value: number, min: number, max: number): number => {
  'worklet'; // 声明为UI线程函数，供Reanimated动画系统使用
  // 使用Math.max和Math.min实现双向夹紧（先取大者再取小者）
  return Math.min(Math.max(min, value), max);
};
