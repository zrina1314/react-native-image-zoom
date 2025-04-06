// 导入React核心钩子和Reanimated共享值钩子
import { useCallback } from 'react'; // 用于记忆回调函数
import { useSharedValue } from 'react-native-reanimated'; // 创建动画共享值

/** 交互ID管理自定义钩子 */
export const useInteractionId = () => {
  // 创建共享字符串值用于存储交互ID
  const interactionId = useSharedValue(''); // 初始值为空字符串

  /** 获取当前交互ID的worklet函数 */
  const getInteractionId = useCallback(() => {
    'worklet'; // 声明为Reanimated工作线程函数
    return interactionId.value; // 返回当前交互ID值
  }, [interactionId]); // 依赖interactionId共享值

  /** 更新交互ID的方法 */
  const updateInteractionId = useCallback(() => {
    interactionId.value = `${new Date().valueOf()}`; // 用时间戳生成唯一ID
  }, [interactionId]); // 依赖interactionId共享值

  // 返回对外暴露的方法
  return { getInteractionId, updateInteractionId }; // 组成对象返回
};
