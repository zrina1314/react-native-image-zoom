// 导入Reanimated的共享值类型
import { SharedValue } from 'react-native-reanimated';

/** 数值求和工具函数（Reanimated worklet） */
export const sum = (...animatedValues: SharedValue<number>[]) => {
  'worklet'; // 声明为UI线程函数

  // 使用reduce累加所有共享值的当前值
  return animatedValues.reduce(
    (result, animatedValue) => result + animatedValue.value, // 逐个累加
    0 // 初始值为0
  );
};
