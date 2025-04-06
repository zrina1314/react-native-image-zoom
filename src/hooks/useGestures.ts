import { useCallback, useRef } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withTiming,
  WithTimingConfig,
} from 'react-native-reanimated';
import { clamp } from '../utils/clamp';
import { limits } from '../utils/limits';
import { ANIMATION_VALUE, ZOOM_TYPE } from '../types';
import type {
  GetInfoCallback,
  OnPanEndCallback,
  OnPanStartCallback,
  OnPinchEndCallback,
  OnPinchStartCallback,
  ProgrammaticZoomCallback,
  ZoomableUseGesturesProps,
} from '../types';
import { useAnimationEnd } from './useAnimationEnd';
import { useInteractionId } from './useInteractionId';
import { usePanGestureCount } from './usePanGestureCount';
import { sum } from '../utils/sum';

/**
 * 定义 withTiming 动画的配置对象
 * 配置动画的缓动函数为 Easing.inOut(Easing.quad)
 */
const withTimingConfig: WithTimingConfig = {
  easing: Easing.inOut(Easing.quad),
};

/**
 * 自定义钩子，用于处理各种手势操作
 * @param param0 - 包含各种配置选项的对象
 * @param param0.width - 容器的宽度
 * @param param0.height - 容器的高度
 * @param param0.center - 容器的中心点
 * @param param0.minScale - 最小缩放比例，默认为 1
 * @param param0.maxScale - 最大缩放比例，默认为 5
 * @param param0.scale - 缩放值
 * @param param0.doubleTapScale - 双击缩放比例，默认为 3
 * @param param0.maxPanPointers - 最大平移指针数，默认为 2
 * @param param0.isPanEnabled - 是否启用平移手势，默认为 true
 * @param param0.isPinchEnabled - 是否启用捏合手势，默认为 true
 * @param param0.isSingleTapEnabled - 是否启用单击手势，默认为 false
 * @param param0.isDoubleTapEnabled - 是否启用双击手势，默认为 false
 * @param param0.onInteractionStart - 交互开始时的回调函数
 * @param param0.onInteractionEnd - 交互结束时的回调函数
 * @param param0.onPinchStart - 捏合开始时的回调函数
 * @param param0.onPinchEnd - 捏合结束时的回调函数
 * @param param0.onPanStart - 平移开始时的回调函数
 * @param param0.onPanEnd - 平移结束时的回调函数
 * @param param0.onSingleTap - 单击时的回调函数，默认为空函数
 * @param param0.onDoubleTap - 双击时的回调函数，默认为空函数
 * @param param0.onProgrammaticZoom - 编程式缩放时的回调函数，默认为空函数
 * @param param0.onResetAnimationEnd - 重置动画结束时的回调函数
 * @returns 包含手势组合、动画样式、缩放方法、重置方法和获取信息方法的对象
 */
export const useGestures = ({
  width,
  height,
  center,
  minScale = 1,
  maxScale = 5,
  scale: scaleValue,
  doubleTapScale = 3,
  maxPanPointers = 2,
  isPanEnabled = true,
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
  // 使用 useRef 钩子创建一个可变的引用对象，用于记录是否正在交互
  const isInteracting = useRef(false);
  // 使用 useRef 钩子创建一个可变的引用对象，用于记录是否正在捏合
  const isPinching = useRef(false);
  // 使用 usePanGestureCount 钩子获取平移手势的相关信息
  const { isPanning, startPan, endPan } = usePanGestureCount();

  // 使用 useSharedValue 钩子创建一个共享值，用于保存缩放比例
  const savedScale = useSharedValue(1);
  // 使用 useSharedValue 钩子创建一个内部共享值，用于保存内部缩放比例
  const internalScaleValue = useSharedValue(1);
  // 如果传入了缩放值，则使用传入的值，否则使用内部缩放值
  const scale = scaleValue ?? internalScaleValue;
  // 创建初始焦点的共享值对象，包含 x 和 y 坐标
  const initialFocal = { x: useSharedValue(0), y: useSharedValue(0) };
  // 创建保存焦点的共享值对象，包含 x 和 y 坐标
  const savedFocal = { x: useSharedValue(0), y: useSharedValue(0) };
  // 创建当前焦点的共享值对象，包含 x 和 y 坐标
  const focal = { x: useSharedValue(0), y: useSharedValue(0) };
  // 创建保存平移量的共享值对象，包含 x 和 y 坐标
  const savedTranslate = { x: useSharedValue(0), y: useSharedValue(0) };
  // 创建当前平移量的共享值对象，包含 x 和 y 坐标
  const translate = { x: useSharedValue(0), y: useSharedValue(0) };

  // 使用 useInteractionId 钩子获取交互 ID 的相关方法
  const { getInteractionId, updateInteractionId } = useInteractionId();
  // 使用 useAnimationEnd 钩子获取动画结束时的回调函数
  const { onAnimationEnd } = useAnimationEnd(onResetAnimationEnd);

  /**
   * 重置缩放和平移状态的回调函数
   */
  const reset = useCallback(() => {
    'worklet';
    // 获取当前的交互 ID
    const interactionId = getInteractionId();

    // 将保存的缩放比例重置为 1
    savedScale.value = 1;
    // 保存当前的缩放值
    const lastScaleValue = scale.value;
    // 使用 withTiming 动画将缩放值重置为 1，并在动画结束时调用 onAnimationEnd 回调函数
    scale.value = withTiming(1, withTimingConfig, (...args) =>
      onAnimationEnd(
        interactionId,
        ANIMATION_VALUE.SCALE,
        lastScaleValue,
        ...args
      )
    );
    // 将初始焦点的 x 坐标重置为 0
    initialFocal.x.value = 0;
    // 将初始焦点的 y 坐标重置为 0
    initialFocal.y.value = 0;
    // 将保存的焦点的 x 坐标重置为 0
    savedFocal.x.value = 0;
    // 将保存的焦点的 y 坐标重置为 0
    savedFocal.y.value = 0;
    // 保存当前的焦点 x 坐标
    const lastFocalXValue = focal.x.value;
    // 使用 withTiming 动画将焦点的 x 坐标重置为 0，并在动画结束时调用 onAnimationEnd 回调函数
    focal.x.value = withTiming(0, withTimingConfig, (...args) =>
      onAnimationEnd(
        interactionId,
        ANIMATION_VALUE.FOCAL_X,
        lastFocalXValue,
        ...args
      )
    );
    // 保存当前的焦点 y 坐标
    const lastFocalYValue = focal.y.value;
    // 使用 withTiming 动画将焦点的 y 坐标重置为 0，并在动画结束时调用 onAnimationEnd 回调函数
    focal.y.value = withTiming(0, withTimingConfig, (...args) =>
      onAnimationEnd(
        interactionId,
        ANIMATION_VALUE.FOCAL_Y,
        lastFocalYValue,
        ...args
      )
    );
    // 将保存的平移量的 x 坐标重置为 0
    savedTranslate.x.value = 0;
    // 将保存的平移量的 y 坐标重置为 0
    savedTranslate.y.value = 0;
    // 保存当前的平移量 x 坐标
    const lastTranslateXValue = translate.x.value;
    // 使用 withTiming 动画将平移量的 x 坐标重置为 0，并在动画结束时调用 onAnimationEnd 回调函数
    translate.x.value = withTiming(0, withTimingConfig, (...args) =>
      onAnimationEnd(
        interactionId,
        ANIMATION_VALUE.TRANSLATE_X,
        lastTranslateXValue,
        ...args
      )
    );
    // 保存当前的平移量 y 坐标
    const lastTranslateYValue = translate.y.value;
    // 使用 withTiming 动画将平移量的 y 坐标重置为 0，并在动画结束时调用 onAnimationEnd 回调函数
    translate.y.value = withTiming(0, withTimingConfig, (...args) =>
      onAnimationEnd(
        interactionId,
        ANIMATION_VALUE.TRANSLATE_Y,
        lastTranslateYValue,
        ...args
      )
    );
  }, [
    savedScale,
    scale,
    initialFocal.x,
    initialFocal.y,
    savedFocal.x,
    savedFocal.y,
    focal.x,
    focal.y,
    savedTranslate.x,
    savedTranslate.y,
    translate.x,
    translate.y,
    getInteractionId,
    onAnimationEnd,
  ]);

  /**
   * 将视图移动到可见区域的函数
   */
  const moveIntoView = () => {
    'worklet'; // 标记该函数为工作线程函数
    // 如果当前缩放比例大于 1
    if (scale.value > 1) {
      // 计算右侧边界值
      const rightLimit = limits.right(width, scale);
      // 计算左侧边界值
      const leftLimit = -rightLimit;
      // 计算底部边界值
      const bottomLimit = limits.bottom(height, scale);
      // 计算顶部边界值
      const topLimit = -bottomLimit;
      // 计算总的 x 轴平移量
      const totalTranslateX = sum(translate.x, focal.x);
      // 计算总的 y 轴平移量
      const totalTranslateY = sum(translate.y, focal.y);

      // 如果总的 x 轴平移量超过右侧边界
      if (totalTranslateX > rightLimit) {
        // 使用 withTiming 动画将平移量的 x 坐标调整到右侧边界值
        translate.x.value = withTiming(rightLimit, withTimingConfig);
        // 使用 withTiming 动画将焦点的 x 坐标调整到 0
        focal.x.value = withTiming(0, withTimingConfig);
      } else if (totalTranslateX < leftLimit) {
        // 如果总的 x 轴平移量超过左侧边界
        // 使用 withTiming 动画将平移量的 x 坐标调整到左侧边界值
        translate.x.value = withTiming(leftLimit, withTimingConfig);
        // 使用 withTiming 动画将焦点的 x 坐标调整到 0
        focal.x.value = withTiming(0, withTimingConfig);
      }

      // 如果总的 y 轴平移量超过底部边界
      if (totalTranslateY > bottomLimit) {
        // 使用 withTiming 动画将平移量的 y 坐标调整到底部边界值
        translate.y.value = withTiming(bottomLimit, withTimingConfig);
        // 使用 withTiming 动画将焦点的 y 坐标调整到 0
        focal.y.value = withTiming(0, withTimingConfig);
      } else if (totalTranslateY < topLimit) {
        // 如果总的 y 轴平移量超过顶部边界
        // 使用 withTiming 动画将平移量的 y 坐标调整到顶部边界值
        translate.y.value = withTiming(topLimit, withTimingConfig);
        // 使用 withTiming 动画将焦点的 y 坐标调整到 0
        focal.y.value = withTiming(0, withTimingConfig);
      }
    } else {
      // 如果缩放比例小于等于 1，调用 reset 函数重置状态
      reset();
    }
  };

  /**
   * 编程式缩放的回调函数
   * @param event - 包含缩放信息的事件对象
   */
  const zoom: ProgrammaticZoomCallback = (event) => {
    'worklet'; // 标记该函数为工作线程函数
    // 如果缩放比例大于 1
    if (event.scale > 1) {
      // 调用外部传入的编程式缩放回调函数，通知进行放大操作
      runOnJS(onProgrammaticZoom)(ZOOM_TYPE.ZOOM_IN);
      // 使用 withTiming 动画将缩放值调整到指定的缩放比例
      scale.value = withTiming(event.scale, withTimingConfig);
      // 使用 withTiming 动画计算并调整焦点的 x 坐标
      focal.x.value = withTiming(
        (center.x - event.x) * (event.scale - 1),
        withTimingConfig
      );
      // 使用 withTiming 动画计算并调整焦点的 y 坐标
      focal.y.value = withTiming(
        (center.y - event.y) * (event.scale - 1),
        withTimingConfig
      );
    } else {
      // 调用外部传入的编程式缩放回调函数，通知进行缩小操作
      runOnJS(onProgrammaticZoom)(ZOOM_TYPE.ZOOM_OUT);
      // 调用 reset 函数重置状态
      reset();
    }
  };

  /**
   * 交互开始时的处理函数
   */
  const onInteractionStarted = () => {
    // 如果当前没有正在交互
    if (!isInteracting.current) {
      // 标记为正在交互
      isInteracting.current = true;
      // 调用外部传入的交互开始回调函数
      onInteractionStart?.();
      // 更新交互 ID
      updateInteractionId();
    }
  };

  /**
   * 交互结束时的处理函数
   */
  const onInteractionEnded = () => {
    // 如果当前正在交互，且没有正在捏合，且没有正在平移
    if (isInteracting.current && !isPinching.current && !isPanning()) {
      // 如果启用了双击手势
      if (isDoubleTapEnabled) {
        // 调用 moveIntoView 函数将视图移动到可见区域
        moveIntoView();
      } else {
        // 调用 reset 函数重置状态
        reset();
      }
      // 标记为交互结束
      isInteracting.current = false;
      // 调用外部传入的交互结束回调函数
      onInteractionEnd?.();
    }
  };

  /**
   * 捏合开始时的回调函数
   * @param event - 捏合事件对象
   */
  const onPinchStarted: OnPinchStartCallback = (event) => {
    // 调用交互开始处理函数
    onInteractionStarted();
    // 标记为正在捏合
    isPinching.current = true;
    // 调用外部传入的捏合开始回调函数
    onPinchStart?.(event);
  };

  /**
   * 捏合结束时的回调函数
   * @param args - 捏合结束时的参数
   */
  const onPinchEnded: OnPinchEndCallback = (...args) => {
    // 标记为捏合结束
    isPinching.current = false;
    // 调用外部传入的捏合结束回调函数
    onPinchEnd?.(...args);
    // 调用交互结束处理函数
    onInteractionEnded();
  };

  /**
   * 平移开始时的回调函数
   * @param event - 平移事件对象
   */
  const onPanStarted: OnPanStartCallback = (event) => {
    // 调用交互开始处理函数
    onInteractionStarted();
    // 调用 startPan 函数开始记录平移
    startPan();
    // 调用外部传入的平移开始回调函数
    onPanStart?.(event);
  };

  /**
   * 平移结束时的回调函数
   * @param args - 平移结束时的参数
   */
  const onPanEnded: OnPanEndCallback = (...args) => {
    // 调用 endPan 函数结束记录平移
    endPan();
    // 调用外部传入的平移结束回调函数
    onPanEnd?.(...args);
    // 调用交互结束处理函数
    onInteractionEnded();
  };

  /**
   * 捏合时的平移手势配置
   */
  const panWhilePinchingGesture = Gesture.Pan()
    // 启用平移手势
    .enabled(isPanEnabled)
    // 平均触摸点
    .averageTouches(true)
    // 启用触控板双指手势
    .enableTrackpadTwoFingerGesture(true)
    // 最小触摸点数为 2
    .minPointers(2)
    // 最大触摸点数为指定的最大平移指针数
    .maxPointers(maxPanPointers)
    /**
     * 平移开始时的回调函数
     * @param event - 平移事件对象
     */
    .onStart((event) => {
      // 在主线程调用 onPanStarted 函数
      runOnJS(onPanStarted)(event);
      // 保存当前的平移量 x 坐标
      savedTranslate.x.value = translate.x.value;
      // 保存当前的平移量 y 坐标
      savedTranslate.y.value = translate.y.value;
    })
    /**
     * 平移更新时的回调函数
     * @param event - 平移事件对象
     */
    .onUpdate((event) => {
      // 更新平移量的 x 坐标
      translate.x.value = savedTranslate.x.value + event.translationX;
      // 更新平移量的 y 坐标
      translate.y.value = savedTranslate.y.value + event.translationY;
    })
    /**
     * 平移结束时的回调函数
     * @param event - 平移事件对象
     * @param success - 平移是否成功的标志
     */
    .onEnd((event, success) => {
      // 计算右侧边界值
      const rightLimit = limits.right(width, scale);
      // 计算左侧边界值
      const leftLimit = -rightLimit;
      // 计算底部边界值
      const bottomLimit = limits.bottom(height, scale);
      // 计算顶部边界值
      const topLimit = -bottomLimit;

      // 如果当前缩放比例大于 1 且启用了双击手势
      if (scale.value > 1 && isDoubleTapEnabled) {
        // 使用 withDecay 动画更新平移量的 x 坐标
        translate.x.value = withDecay(
          {
            velocity: event.velocityX,
            velocityFactor: 0.6,
            rubberBandEffect: true,
            rubberBandFactor: 0.9,
            clamp: [leftLimit - focal.x.value, rightLimit - focal.x.value],
          },
          () => {
            // 如果 x 轴速度大于等于 y 轴速度，在主线程调用 onPanEnded 函数
            if (event.velocityX >= event.velocityY) {
              runOnJS(onPanEnded)(event, success);
            }
          }
        );
        // 使用 withDecay 动画更新平移量的 y 坐标
        translate.y.value = withDecay(
          {
            velocity: event.velocityY,
            velocityFactor: 0.6,
            rubberBandEffect: true,
            rubberBandFactor: 0.9,
            clamp: [topLimit - focal.y.value, bottomLimit - focal.y.value],
          },
          () => {
            // 如果 y 轴速度大于 x 轴速度，在主线程调用 onPanEnded 函数
            if (event.velocityY > event.velocityX) {
              runOnJS(onPanEnded)(event, success);
            }
          }
        );
      } else {
        // 在主线程调用 onPanEnded 函数
        runOnJS(onPanEnded)(event, success);
      }
    });

  /**
   * 单独的平移手势配置
   */
  const panOnlyGesture = Gesture.Pan()
    // 启用平移手势
    .enabled(isPanEnabled)
    // 平均触摸点
    .averageTouches(true)
    // 启用触控板双指手势
    .enableTrackpadTwoFingerGesture(true)
    // 最小触摸点数为 1
    .minPointers(1)
    // 最大触摸点数为 1
    .maxPointers(1)
    /**
     * 触摸按下时的回调函数
     * @param _ - 未使用的参数
     * @param manager - 手势管理器
     */
    .onTouchesDown((_, manager) => {
      // 如果当前缩放比例小于等于 1，使手势失败
      if (scale.value <= 1) {
        manager.fail();
      }
    })
    /**
     * 平移开始时的回调函数
     * @param event - 平移事件对象
     */
    .onStart((event) => {
      // 在主线程调用 onPanStarted 函数
      runOnJS(onPanStarted)(event);
      // 保存当前的平移量 x 坐标
      savedTranslate.x.value = translate.x.value;
      // 保存当前的平移量 y 坐标
      savedTranslate.y.value = translate.y.value;
    })
    /**
     * 平移更新时的回调函数
     * @param event - 平移事件对象
     */
    .onUpdate((event) => {
      // 更新平移量的 x 坐标
      translate.x.value = savedTranslate.x.value + event.translationX;
      // 更新平移量的 y 坐标
      translate.y.value = savedTranslate.y.value + event.translationY;
    })
    /**
     * 平移结束时的回调函数
     * @param event - 平移事件对象
     * @param success - 平移是否成功的标志
     */
    .onEnd((event, success) => {
      // 计算右侧边界值
      const rightLimit = limits.right(width, scale);
      // 计算左侧边界值
      const leftLimit = -rightLimit;
      // 计算底部边界值
      const bottomLimit = limits.bottom(height, scale);
      // 计算顶部边界值
      const topLimit = -bottomLimit;

      // 如果当前缩放比例大于 1 且启用了双击手势
      if (scale.value > 1 && isDoubleTapEnabled) {
        // 使用 withDecay 动画更新平移量的 x 坐标
        translate.x.value = withDecay(
          {
            velocity: event.velocityX,
            velocityFactor: 0.6,
            rubberBandEffect: true,
            rubberBandFactor: 0.9,
            clamp: [leftLimit - focal.x.value, rightLimit - focal.x.value],
          },
          () => {
            // 如果 x 轴速度大于等于 y 轴速度，在主线程调用 onPanEnded 函数
            if (event.velocityX >= event.velocityY) {
              runOnJS(onPanEnded)(event, success);
            }
          }
        );
        // 使用 withDecay 动画更新平移量的 y 坐标
        translate.y.value = withDecay(
          {
            velocity: event.velocityY,
            velocityFactor: 0.6,
            rubberBandEffect: true,
            rubberBandFactor: 0.9,
            clamp: [topLimit - focal.y.value, bottomLimit - focal.y.value],
          },
          () => {
            // 如果 y 轴速度大于 x 轴速度，在主线程调用 onPanEnded 函数
            if (event.velocityY > event.velocityX) {
              runOnJS(onPanEnded)(event, success);
            }
          }
        );
      } else {
        // 在主线程调用 onPanEnded 函数
        runOnJS(onPanEnded)(event, success);
      }
    });

  /**
   * 捏合手势配置
   */
  const pinchGesture = Gesture.Pinch()
    // 启用捏合手势
    .enabled(isPinchEnabled)
    /**
     * 捏合开始时的回调函数
     * @param event - 捏合事件对象
     */
    .onStart((event) => {
      // 在主线程调用 onPinchStarted 函数
      runOnJS(onPinchStarted)(event);
      // 保存当前的缩放比例
      savedScale.value = scale.value;
      // 保存当前的焦点 x 坐标
      savedFocal.x.value = focal.x.value;
      // 保存当前的焦点 y 坐标
      savedFocal.y.value = focal.y.value;
      // 保存初始焦点的 x 坐标
      initialFocal.x.value = event.focalX;
      // 保存初始焦点的 y 坐标
      initialFocal.y.value = event.focalY;
    })
    /**
     * 捏合更新时的回调函数
     * @param event - 捏合事件对象
     */
    .onUpdate((event) => {
      // 使用 clamp 函数限制缩放比例在最小和最大缩放比例之间
      scale.value = clamp(savedScale.value * event.scale, minScale, maxScale);
      // 更新焦点的 x 坐标
      focal.x.value =
        savedFocal.x.value +
        (center.x - initialFocal.x.value) * (scale.value - savedScale.value);
      // 更新焦点的 y 坐标
      focal.y.value =
        savedFocal.y.value +
        (center.y - initialFocal.y.value) * (scale.value - savedScale.value);
    })
    /**
     * 捏合结束时的回调函数
     * @param args - 捏合结束时的参数
     */
    .onEnd((...args) => {
      // 在主线程调用 onPinchEnded 函数
      runOnJS(onPinchEnded)(...args);
    });

  /**
   * 双击手势配置
   */
  const doubleTapGesture = Gesture.Tap()
    // 启用双击手势
    .enabled(isDoubleTapEnabled)
    // 设置点击次数为 2
    .numberOfTaps(2)
    // 设置最大持续时间为 250 毫秒
    .maxDuration(250)
    /**


     * 双击开始时的回调函数
     * @param event - 双击事件对象
     */
    .onStart((event) => {
      // 如果当前缩放比例为 1
      if (scale.value === 1) {
        // 在主线程调用 onDoubleTap 函数，通知进行放大操作
        runOnJS(onDoubleTap)(ZOOM_TYPE.ZOOM_IN);
        // 使用 withTiming 动画将缩放值调整到双击缩放比例
        scale.value = withTiming(doubleTapScale, withTimingConfig);
        // 使用 withTiming 动画计算并调整焦点的 x 坐标
        focal.x.value = withTiming(
          (center.x - event.x) * (doubleTapScale - 1),
          withTimingConfig
        );
        // 使用 withTiming 动画计算并调整焦点的 y 坐标
        focal.y.value = withTiming(
          (center.y - event.y) * (doubleTapScale - 1),
          withTimingConfig
        );
      } else {
        // 在主线程调用 onDoubleTap 函数，通知进行缩小操作
        runOnJS(onDoubleTap)(ZOOM_TYPE.ZOOM_OUT);
        // 调用 reset 函数重置状态
        reset();
      }
    });

  /**
   * 单击手势配置
   */
  const singleTapGesture = Gesture.Tap()
    // 启用单击手势
    .enabled(isSingleTapEnabled)
    // 设置点击次数为 1
    .numberOfTaps(1)
    // 设置最大移动距离为 24
    .maxDistance(24)
    /**
     * 单击开始时的回调函数
     * @param event - 单击事件对象
     */
    .onStart((event) => {
      // 在主线程调用 onSingleTap 函数
      runOnJS(onSingleTap)(event);
    });

  /**
   * 使用动画样式钩子生成动态样式
   * @returns 包含动画样式的对象
   */
  const animatedStyle = useAnimatedStyle(
    () => ({
      // 定义元素的变换属性，包括平移和缩放
      transform: [
        { translateX: translate.x.value },
        { translateY: translate.y.value },
        { translateX: focal.x.value },
        { translateY: focal.y.value },
        { scale: scale.value },
      ],
    }),
    // 当这些值发生变化时，重新计算样式
    [translate.x, translate.y, focal.x, focal.y, scale]
  );

  /**
   * 获取当前缩放和移动状态下的相关信息
   * @returns 包含容器信息、缩放后尺寸、可见区域和变换信息的对象
   */
  const getInfo: GetInfoCallback = () => {
    // 计算总的 x 轴平移量
    const totalTranslateX = translate.x.value + focal.x.value;

    // 计算总的 y 轴平移量
    const totalTranslateY = translate.y.value + focal.y.value;
    return {
      // 容器信息
      container: {
        width,
        height,
        center,
      },
      // 缩放后的尺寸
      scaledSize: {
        width: width * scale.value,
        height: height * scale.value,
      },
      // 可见区域信息
      visibleArea: {
        x: Math.abs(totalTranslateX - (width * (scale.value - 1)) / 2),
        y: Math.abs(totalTranslateY - (height * (scale.value - 1)) / 2),
        width,
        height,
      },
      // 变换信息
      transformations: {
        translateX: totalTranslateX,
        translateY: totalTranslateY,
        scale: scale.value,
      },
    };
  };

  // 同时处理捏合手势和捏合时的平移手势
  const pinchPanGestures = Gesture.Simultaneous(
    pinchGesture,
    panWhilePinchingGesture
  );
  // 排他处理双击手势和单击手势，即两者只会触发其一
  const tapGestures = Gesture.Exclusive(doubleTapGesture, singleTapGesture);
  // 根据是否启用双击或单击手势，组合不同的手势
  const gestures =
    isDoubleTapEnabled || isSingleTapEnabled
      ? Gesture.Race(pinchPanGestures, panOnlyGesture, tapGestures)
      : pinchPanGestures;

  // 返回手势组合、动画样式、缩放方法、重置方法和获取信息方法
  return { gestures, animatedStyle, zoom, reset, getInfo };
};
