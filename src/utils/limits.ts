// 导入Reanimated共享值类型
import { SharedValue } from 'react-native-reanimated';

/** 计算右边界的限制值 */
const right = (width: number, scale: SharedValue<number>) => {
  'worklet'; // 声明为UI线程函数
  return (width * (scale.value - 1)) / 2; // (宽度 * (缩放比例 - 1)) / 2
};

/** 计算左边界的限制值（与右边界对称） */
const left = (width: number, scale: SharedValue<number>) => {
  'worklet';
  return -right(width, scale); // 取右边界的负值
};

/** 计算下边界的限制值 */
const bottom = (height: number, scale: SharedValue<number>) => {
  'worklet';
  return (height * (scale.value - 1)) / 2; // (高度 * (缩放比例 - 1)) / 2
};

/** 计算上边界的限制值（与下边界对称） */
const top = (height: number, scale: SharedValue<number>) => {
  'worklet';
  return -bottom(height, scale); // 取下边界的负值
};

/** 导出边界计算工具对象 */
export const limits = {
  /** 右边界计算 */
  right,
  /** 左边界计算 */
  left,
  /** 上边界计算 */
  top,
  /** 下边界计算 */
  bottom,
};
