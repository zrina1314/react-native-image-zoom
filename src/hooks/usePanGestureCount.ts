// 导入React的useRef钩子
import { useRef } from 'react';

/** 拖拽手势计数自定义钩子 */
export const usePanGestureCount = () => {
  /** 使用ref存储当前进行中的拖拽手势数量 */
  const panGestureCount = useRef(0); // 初始化为0

  /** 判断是否有进行中的拖拽手势 */
  const isPanning = () => panGestureCount.current > 0; // 数量大于0返回true

  /** 开始拖拽时增加计数 */
  const startPan = () => panGestureCount.current++; // 每次触发+1

  /** 结束拖拽时减少计数（确保不小于0） */
  const endPan = () => panGestureCount.current > 0 && panGestureCount.current--; // 安全递减

  /** 暴露方法给外部使用 */
  return { isPanning, startPan, endPan };
};
