// 导入React相关类型和钩子
import { Ref, useImperativeHandle } from 'react';  // Ref类型和命令式句柄钩子
// 导入类型定义
import type {
  GetInfoCallback,         // 获取信息回调类型
  ProgrammaticZoomCallback, // 程序化缩放回调类型
  ZoomableRef,             // 组件引用类型
} from '../types';

// 定义用于暴露组件引用的自定义钩子
export const useZoomableHandle = (
  ref: Ref<unknown> | undefined,  // 接收外部传入的组件引用
  reset: () => void,             // 重置动画方法
  zoom: ProgrammaticZoomCallback, // 缩放控制方法
  getInfo: GetInfoCallback       // 获取当前状态方法
) => {
  // 使用命令式句柄暴露组件方法
  useImperativeHandle(
    ref,
    (): ZoomableRef => ({  // 创建组件引用对象
      reset() {            // 暴露重置方法
        reset();
      },
      zoom(event) {        // 暴露缩放控制方法
        zoom(event);
      },
      getInfo() {          // 暴露状态获取方法
        return getInfo();
      },
    }),
    [reset, zoom, getInfo] // 依赖项：方法更新时重新绑定
  );
};
