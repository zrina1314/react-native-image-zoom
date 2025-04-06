// 导入React状态钩子和类型定义
import { useState } from 'react';  // 用于管理组件状态
import type { LayoutChangeEvent } from 'react-native';  // 布局事件类型
import type { ZoomableLayoutState, ZoomableUseLayoutProps } from '../types';  // 自定义类型

// 布局管理自定义钩子
export const useZoomableLayout = ({ onLayout }: ZoomableUseLayoutProps) => {
  // 初始化布局状态对象
  const [state, setState] = useState<ZoomableLayoutState>({
    x: 0,            // 容器X坐标
    y: 0,            // 容器Y坐标
    width: 0,        // 容器宽度
    height: 0,       // 容器高度
    center: { x: 0, y: 0 },  // 中心点坐标
  });

  // 布局变化处理函数
  const onZoomableLayout = (event: LayoutChangeEvent) => {
    // 从原生事件中获取布局信息
    const { layout } = event.nativeEvent;
    const { x, y, width, height } = layout;

    // 计算中心点坐标
    const center = {
      x: x + width / 2,  // X轴中心点
      y: y + height / 2, // Y轴中心点
    };

    // 执行外部传入的布局回调（如果存在）
    if (typeof onLayout === 'function') {
      onLayout(event);
    }

    // 更新布局状态
    setState({ ...layout, center });
  };

  // 返回布局状态和处理函数
  return { ...state, onZoomableLayout };  // 展开状态对象并暴露布局方法
};
