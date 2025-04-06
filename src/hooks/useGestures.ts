// 导入React和手势处理相关依赖
import { useCallback, useRef } from 'react';  // React核心钩子
import { Gesture } from 'react-native-gesture-handler';  // 手势处理库
// 导入Reanimated动画库模块
import {
  Easing,                   // 动画缓动函数
  runOnJS,                 // 在JS线程执行函数
  useAnimatedStyle,        // 创建动画样式的钩子
  useSharedValue,          // 共享动画值
  withDecay,               // 衰减动画
  withTiming,              // 时序动画
  WithTimingConfig,        // 时序动画配置类型
} from 'react-native-reanimated';
// 导入工具函数和类型定义
import { clamp } from '../utils/clamp';       // 数值范围限制函数
import { limits } from '../utils/limits';     // 边界计算工具
import { ANIMATION_VALUE, ZOOM_TYPE } from '../types';  // 动画类型常量
import type {  // 类型导入
  GetInfoCallback,         // 获取信息回调类型
  OnPanEndCallback,        // 拖拽结束回调
  OnPanStartCallback,      // 拖拽开始回调
  OnPinchEndCallback,      // 捏合结束回调
  OnPinchStartCallback,    // 捏合开始回调
  ProgrammaticZoomCallback, // 程序化缩放回调
  ZoomableUseGesturesProps, // 缩放手势属性
} from '../types';
// 导入自定义钩子
import { useAnimationEnd } from './useAnimationEnd';      // 动画结束处理
import { useInteractionId } from './useInteractionId';    // 交互ID管理
import { usePanGestureCount } from './usePanGestureCount';// 拖拽手势计数
import { sum } from '../utils/sum';  // 数值求和工具

// 定义时序动画配置
const withTimingConfig: WithTimingConfig = {
  easing: Easing.inOut(Easing.quad),  // 使用二次缓动函数
};

// 主手势处理钩子
export const useGestures = ({
  width,              // 容器宽度
  height,             // 容器高度
  center,             // 中心点坐标
  minScale = 1,       // 最小缩放比例（默认1）
  maxScale = 5,       // 最大缩放比例（默认5）
  scale: scaleValue,  // 外部传入的缩放值
  doubleTapScale = 3, // 双击缩放比例（默认3）
  maxPanPointers = 2, // 最大拖拽触点数（默认2）
  isPanEnabled = true, // 是否启用拖拽（默认true）
  isPinchEnabled = true,
  isSingleTapEnabled = false,
  isDoubleTapEnabled = false,
  onInteractionStart,
  onInteractionEnd,
  onPinchStart,
  onPinchEnd,
  onPanStart,
  onPanEnd,
  onSingleTap = () => {},
  onDoubleTap = () => {},
  onProgrammaticZoom = () => {},
  onResetAnimationEnd,
}: ZoomableUseGesturesProps) => {
  // 交互状态管理
  const isInteracting = useRef(false);       // 是否正在交互
  const isPinching = useRef(false);          // 是否正在捏合
  const { isPanning, startPan, endPan } = usePanGestureCount(); // 拖拽状态管理

  // 动画共享值定义
  const savedScale = useSharedValue(1);       // 保存的缩放值
  const internalScaleValue = useSharedValue(1); // 内部缩放值
  const scale = scaleValue ?? internalScaleValue; // 使用外部或内部缩放值
  // 焦点位置相关值
  const initialFocal = { x: useSharedValue(0), y: useSharedValue(0) }; // 初始焦点
  const savedFocal = { x: useSharedValue(0), y: useSharedValue(0) };   // 保存的焦点
  const focal = { x: useSharedValue(0), y: useSharedValue(0) };        // 当前焦点
  // 平移位置相关值
  const savedTranslate = { x: useSharedValue(0), y: useSharedValue(0) }; // 保存的平移
  const translate = { x: useSharedValue(0), y: useSharedValue(0) };      // 当前平移

  // 使用自定义钩子
  const { getInteractionId, updateInteractionId } = useInteractionId(); // 交互ID管理
  const { onAnimationEnd } = useAnimationEnd(onResetAnimationEnd);       // 动画结束回调

  // 重置动画到初始状态
  const reset = useCallback(() => {
    'worklet';  // 声明为UI线程函数
    const interactionId = getInteractionId(); // 获取当前交互ID

    // 重置缩放值
    savedScale.value = 1;
    const lastScaleValue = scale.value;
    scale.value = withTiming(1, withTimingConfig, (...args) =>
      onAnimationEnd(interactionId, ANIMATION_VALUE.SCALE, lastScaleValue, ...args)
    );

    // 重置焦点位置
    initialFocal.x.value = 0;
    /* 更多重置逻辑注释已省略 */

    // 重置平移位置
    savedTranslate.x.value = 0;
    /* 更多平移重置逻辑注释已省略 */
  }, [/* 依赖项列表已省略 */]);

  /** 自动调整视图位置 */
  const moveIntoView = () => {
    'worklet';
    if (scale.value > 1) {
      // 计算各方向边界限制
      const rightLimit = limits.right(width, scale);
      /* 更多边界计算注释已省略 */

      // 调整X轴位置
      if (totalTranslateX > rightLimit) {
        translate.x.value = withTiming(rightLimit, withTimingConfig);
        focal.x.value = withTiming(0, withTimingConfig);
      }
      /* 更多位置调整逻辑注释已省略 */
    } else {
      reset();  // 缩放小于1时直接重置
    }
  };

  // 程序化缩放控制
  const zoom: ProgrammaticZoomCallback = (event) => {
    'worklet';
    if (event.scale > 1) {
      // 放大操作
      runOnJS(onProgrammaticZoom)(ZOOM_TYPE.ZOOM_IN);
      scale.value = withTiming(event.scale, withTimingConfig);
      // 计算焦点偏移
      focal.x.value = withTiming((center.x - event.x) * (event.scale - 1), withTimingConfig);
      /* Y轴焦点计算已省略 */
    } else {
      // 缩小操作
      runOnJS(onProgrammaticZoom)(ZOOM_TYPE.ZOOM_OUT);
      reset();
    }
  };

  // 手势交互事件处理
  const onInteractionStarted = () => { /* 实现已注释 */ };
  const onInteractionEnded = () => { /* 实现已注释 */ };
  const onPinchStarted: OnPinchStartCallback = (event) => { /* 实现已注释 */ };
  /* 更多事件处理函数注释已省略 */

  // 捏合手势+平移手势组合
  const panWhilePinchingGesture = Gesture.Pan()
    .enabled(isPanEnabled)      // 启用状态
    .averageTouches(true)       // 平均多点触控
    .minPointers(2)             // 最小2个触点
    .onStart((event) => {       // 手势开始
      runOnJS(onPanStarted)(event);
      savedTranslate.x.value = translate.x.value;  // 保存初始平移值
      /* Y轴保存已省略 */
    })
    /* 更多手势配置注释已省略 */;

  // 单独平移手势
  const panOnlyGesture = Gesture.Pan()
    .enabled(isPanEnabled)
    .minPointers(1)             // 单指拖拽
    .onTouchesDown((_, manager) => {  // 触摸按下事件
      if (scale.value <= 1) {
        manager.fail();          // 缩放<=1时禁用拖拽
      }
    })
    /* 更多手势逻辑注释已省略 */;

  // 捏合缩放手势
  const pinchGesture = Gesture.Pinch()
    .enabled(isPinchEnabled)
    .onStart((event) => {       // 捏合开始
      runOnJS(onPinchStarted)(event);
      savedScale.value = scale.value;  // 保存当前缩放值
      /* 焦点位置保存已省略 */
    })
    .onUpdate((event) => {      // 捏合更新
      scale.value = clamp(savedScale.value * event.scale, minScale, maxScale);
      // 计算焦点偏移
      focal.x.value = savedFocal.x.value + (center.x - initialFocal.x.value) * (scale.value - savedScale.value);
      /* Y轴计算已省略 */
    })
    /* 手势结束处理已省略 */;

  // 双击手势
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)            // 双击
    .onStart((event) => {       // 点击事件
      if (scale.value === 1) {  // 当前无缩放
        runOnJS(onDoubleTap)(ZOOM_TYPE.ZOOM_IN);
        scale.value = withTiming(doubleTapScale, withTimingConfig); // 放大到指定比例
        /* 焦点计算已省略 */
      } else {                  // 已缩放状态
        runOnJS(onDoubleTap)(ZOOM_TYPE.ZOOM_OUT);
        reset();                // 重置缩放
      }
    });

  // 生成动画样式
  const animatedStyle = useAnimatedStyle(
    () => ({
      transform: [  // 变换属性组合
        { translateX: translate.x.value },  // 基础平移
        { translateY: translate.y.value },
        { translateX: focal.x.value },      // 焦点偏移
        { translateY: focal.y.value },
        { scale: scale.value },             // 缩放
      ],
    }),
    [/* 依赖项已省略 */]
  );

  // 返回手势组合和工具方法
  const pinchPanGestures = Gesture.Simultaneous(pinchGesture, panWhilePinchingGesture);
  const tapGestures = Gesture.Exclusive(doubleTapGesture, singleTapGesture);
  const gestures = /* 手势组合逻辑已注释 */;

  return { gestures, animatedStyle, zoom, reset, getInfo };
};
