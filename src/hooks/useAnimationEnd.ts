// 导入React相关依赖
import { useCallback } from 'react';
// 导入React Native Reanimated动画库相关模块
import {
  AnimatableValue, // 可动画化的值类型
  AnimationCallback, // 动画回调函数类型
  runOnJS, // 用于在JS线程运行函数
  useSharedValue, // 创建共享动画值的钩子
} from 'react-native-reanimated';
// 导入类型定义和常量
import { ANIMATION_VALUE, type OnResetAnimationEndCallback } from '../types';

// 定义动画结束回调类型，继承自AnimationCallback并扩展参数
export type OnAnimationEndCallback = AnimationCallback extends (
  ...a: infer I
) => infer O
  ? (
      interactionId: string, // 交互的唯一标识
      value: ANIMATION_VALUE, // 动画值类型
      lastValue: number, // 上一个动画值
      ...a: I // 保留原始回调参数
    ) => O
  : never;

// 定义动画结束值的类型结构
type EndValues = Record<
  ANIMATION_VALUE,
  {
    lastValue: number; // 最后的值
    finished?: boolean; // 是否完成标志
    current?: AnimatableValue; // 当前动画值
  }
>;
/** 部分结束值类型 */
type PartialEndValues = Partial<EndValues>;
/** 交互ID到结束值的映射 */
type InteractionEndValues = Record<string, PartialEndValues>;

/** 定义支持的动画值类型数组 */
const ANIMATION_VALUES = [
  /** 缩放动画 */
  ANIMATION_VALUE.SCALE,
  /** X焦点 */
  ANIMATION_VALUE.FOCAL_X,
  /** Y焦点 */
  ANIMATION_VALUE.FOCAL_Y,
  /** X轴平移 */
  ANIMATION_VALUE.TRANSLATE_X,
  /** Y轴平移 */
  ANIMATION_VALUE.TRANSLATE_Y,
];

/** 判断动画是否全部完成的worklet函数 */
const isAnimationComplete = (
  endValues: PartialEndValues
): endValues is EndValues => {
  'worklet'; // 标识为Reanimated的工作线程函数
  return ANIMATION_VALUES.every((item) => !!endValues[item]);
};

/** 自定义动画结束处理钩子 */
export const useAnimationEnd = (
  onResetAnimationEnd?: OnResetAnimationEndCallback // 可选的动画重置回调
) => {
  /** 使用共享值存储各交互的动画结束状态 */
  const endValues = useSharedValue<InteractionEndValues>({});

  /** 动画结束回调处理函数 */
  const onAnimationEnd: OnAnimationEndCallback = useCallback(
    (interactionId, value, lastValue, finished, current) => {
      'worklet'; // 在UI线程执行
      if (onResetAnimationEnd) {
        /** 获取当前交互的结束值 */
        const currentEndValues = endValues.value[interactionId] || {};
        /** 更新当前动画值状态 */
        currentEndValues[value] = { lastValue, finished, current };
        /** 检查是否所有动画都完成 */
        if (isAnimationComplete(currentEndValues)) {
          /** 判断是否全部动画成功完成 */
          const completed = !Object.values(currentEndValues).some(
            (item) => !item.finished
          );
          // 在JS线程执行回调
          runOnJS(onResetAnimationEnd)(completed, currentEndValues);
          // 清理已完成的交互记录
          delete endValues.value[interactionId];
        } else {
          // 更新未完成的交互状态
          endValues.value[interactionId] = currentEndValues;
        }
      }
    },
    [onResetAnimationEnd, endValues]
  );

  return { onAnimationEnd };
};
