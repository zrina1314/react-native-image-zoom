// 导入自定义手势钩子和类型定义
import { useGestures } from '../hooks/useGestures';              // 手势处理逻辑
import { useZoomableLayout } from '../hooks/useZoomableLayout';  // 布局计算逻辑
import { useZoomableHandle } from '../hooks/useZoomableHandle';  // 引用处理逻辑
import type { UseZoomableProps } from '../types';                // 类型定义导入

// 主zoomable钩子，整合各子模块功能
export const useZoomable = ({
  minScale,              // 最小缩放比例
  maxScale,              // 最大缩放比例
  scale,                 // 当前缩放值（可选）
  doubleTapScale,        // 双击缩放级别
  maxPanPointers,        // 最大拖拽触点数
  isPanEnabled,          // 启用拖拽功能
  isPinchEnabled,        // 启用捏合缩放
  isSingleTapEnabled,    // 启用单击事件
  isDoubleTapEnabled,    // 启用双击缩放
  onInteractionStart,    // 交互开始回调
  onInteractionEnd,      // 交互结束回调
  onPinchStart,          // 捏合开始回调
  onPinchEnd,            // 捏合结束回调
  onPanStart,            // 拖拽开始回调
  onPanEnd,              // 拖拽结束回调
  onSingleTap,           // 单击回调
  onDoubleTap,           // 双击回调
  onProgrammaticZoom,    // 程序化缩放回调
  onResetAnimationEnd,   // 重置动画结束回调
  onLayout,              // 布局变化回调
  ref,                   // 组件引用
}: UseZoomableProps) => {
  // 获取容器布局信息
  const { width, height, center, onZoomableLayout } = useZoomableLayout({
    onLayout,  // 透传布局回调
  });

  // 初始化手势功能
  const { animatedStyle, gestures, reset, zoom, getInfo } = useGestures({
    width, height, center, // 容器尺寸和中心点
    minScale, maxScale,      // 缩放范围限制
    scale, doubleTapScale,   // 缩放相关配置
    maxPanPointers,          // 拖拽触点限制
    isPanEnabled, isPinchEnabled,  // 功能开关
    isSingleTapEnabled, isDoubleTapEnabled,  // 点击事件开关
    onInteractionStart, onInteractionEnd,  // 交互状态回调
    onPinchStart, onPinchEnd,    // 捏合事件回调
    onPanStart, onPanEnd,        // 拖拽事件回调
    onSingleTap, onDoubleTap,    // 点击事件回调
    onProgrammaticZoom,          // 外部缩放控制
    onResetAnimationEnd,         // 动画结束事件
  });

  /** 绑定组件引用和操作方法 */
  useZoomableHandle(ref, reset, zoom, getInfo);

  /** 暴露外部需要的属性和方法 */
  return {
    /** 动画样式对象 */
    animatedStyle,
    /** 手势配置集合 */
    gestures,
    /** 布局处理方法 */
    onZoomableLayout
  };
};
