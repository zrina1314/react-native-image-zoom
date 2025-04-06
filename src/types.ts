import { ForwardedRef } from 'react';
import type {
  ImageProps,             // 图片组件属性
  ImageSourcePropType,   // 图片源类型
  LayoutRectangle,       // 布局矩形信息
  ViewProps,             // 视图组件属性
} from 'react-native';
import type {
  GestureStateChangeEvent,        // 手势状态变化事件
  PanGestureHandlerEventPayload,  // 拖拽手势事件数据
  PinchGestureHandlerEventPayload, // 捏合手势事件数据
  TapGestureHandlerEventPayload,  // 点击手势事件数据
} from 'react-native-gesture-handler';  // 手势处理库类型
import {
  AnimatableValue,       // 可动画化值类型
  AnimateProps,          // 动画属性
  SharedValue,           // 共享值类型
} from 'react-native-reanimated';  // Reanimated动画库类型



/////////////////定义各种手势回调类型//////////////////////
/**
 * 捏合开始回调
 * @description
 *
 */
export type OnPinchStartCallback = (
  event: GestureStateChangeEvent<PinchGestureHandlerEventPayload>
) => void;

/** 捏合结束回调 */
export type OnPinchEndCallback = (
  event: GestureStateChangeEvent<PinchGestureHandlerEventPayload>,
  /** 手势是否成功完成 */
  success: boolean
) => void;

/** 拖拽开始回调 */
export type OnPanStartCallback = (
  event: GestureStateChangeEvent<PanGestureHandlerEventPayload>
) => void;

/** 拖拽结束回调 */
export type OnPanEndCallback = (
  event: GestureStateChangeEvent<PanGestureHandlerEventPayload>,
  /** 拖拽是否成功 */
  success: boolean
) => void;

/** 单击回调 */
export type OnSingleTapCallback = (
  event: GestureStateChangeEvent<TapGestureHandlerEventPayload>
) => void;

// 缩放类型枚举
export enum ZOOM_TYPE {
  /** 放大操作 */
  ZOOM_IN = 'ZOOM_IN',
  /** 缩小操作 */
  ZOOM_OUT = 'ZOOM_OUT',
}

// 程序化缩放回调类型
export type ProgrammaticZoomCallback = (event: {
  /** 目标缩放值 */
  scale: number;
  /** X坐标焦点 */
  x: number;
  /** Y坐标焦点 */
  y: number;
}) => void;

// 双击和程序化缩放回调别名
export type OnDoubleTapCallback = (zoomType: ZOOM_TYPE) => void;
export type OnProgrammaticZoomCallback = (zoomType: ZOOM_TYPE) => void;

// 获取组件信息回调类型
export type GetInfoCallback = () => {
  /** 容器信息 */
  container: {
    /** 容器宽度 */
    width: number;
    /** 容器高度 */
    height: number;
    /** 中心点坐标 */
    center: { x: number; y: number };
  };
  /** 缩放后尺寸 */
  scaledSize: {
    width: number;
    height: number;
  };
  /** 可视区域 */
  visibleArea: {
    /** X起始位置 */
    x: number;
    /** Y起始位置 */
    y: number;
    /** 可视宽度 */
    width: number;
    /** 可视高度 */
    height: number;
  };
  /** 当前变换值 */
  transformations: {
    /** X轴平移 */
    translateX: number;
    /** Y轴平移 */
    translateY: number;
    /** 缩放比例 */
    scale: number;
  };
};

/** 动画值类型枚举 */
export enum ANIMATION_VALUE {
  /** 缩放动画 */
  SCALE = 'SCALE',
  /** X焦点动画 */
  FOCAL_X = 'FOCAL_X',
  /** Y焦点动画 */
  FOCAL_Y = 'FOCAL_Y',
  /** X平移动画 */
  TRANSLATE_X = 'TRANSLATE_X',
  /** Y平移动画 */
  TRANSLATE_Y = 'TRANSLATE_Y',
}

/** 重置动画结束回调类型 */
export type OnResetAnimationEndCallback = (
  /** 是否全部完成 */
  finished?: boolean,
  /** 各动画值状态 */
  values?: Record<
    ANIMATION_VALUE,
    {
      /** 最后值 */
      lastValue: number;
      /** 是否完成 */
      finished?: boolean;
      /** 当前值 */
      current?: AnimatableValue;
    }
  >
) => void;

/** 缩放组件属性类型 */
export type ZoomProps = {
  /**
   * 允许的最小缩放比例
   * @default 1
   */
  minScale?: number;
  /**
   * 允许的最大缩放比例
   * @default 5
   */
  maxScale?: number;
  /**
   * 自定义缩放共享值（用于外部控制）
   * @default useSharedValue(1)
   */
  scale?: SharedValue<number>;
  /**
   * 双击缩放比例
   * @default 3
   */
  doubleTapScale?: number;
  /**
   * 最大拖拽触点数
   * @default 2
   */
  maxPanPointers?: number;
  /**
   * 是否启用拖拽
   * @default true
   */
  isPanEnabled?: boolean;
  /**
   * 是否启用捏合缩放
   * @default true
   */
  isPinchEnabled?: boolean;
  /**
   * 是否启用单击事件
   * @default false
   */
  isSingleTapEnabled?: boolean;
  /**
   * 是否启用双击缩放
   * @default false
   */
  isDoubleTapEnabled?: boolean;
  /**
   * 交互开始回调
   */
  onInteractionStart?: () => void;
  /**
   * 交互结束回调
   */
  onInteractionEnd?: () => void;
  /**
   * 捏合开始回调
   */
  onPinchStart?: OnPinchStartCallback;
  /**
   * 捏合结束回调
   */
  onPinchEnd?: OnPinchEndCallback;
  /**
   * 拖拽开始回调
   */
  onPanStart?: OnPanStartCallback;
  /**
   * 拖拽结束回调
   */
  onPanEnd?: OnPanEndCallback;
  /**
   * 单击回调
   */
  onSingleTap?: OnSingleTapCallback;
  /**
   * 双击回调
   */
  onDoubleTap?: OnDoubleTapCallback;
  /**
   * 程序化缩放回调
   */
  onProgrammaticZoom?: OnProgrammaticZoomCallback;
  /**
   * 重置动画结束回调
   * @param finished 是否全部动画完成
   * @param values 各动画值状态
   */
  onResetAnimationEnd?: OnResetAnimationEndCallback;
};

/** 组合动画属性和视图属性 */
export type ZoomableProps = AnimateProps<ViewProps> & ZoomProps;

/** 自定义Hook属性类型 */
export type UseZoomableProps = ZoomProps & {
  /** 组件引用转发 */
  ref: ForwardedRef<ZoomableRef>;
  /**
   * 布局变化回调
   */
  onLayout?: ZoomableProps['onLayout'];
};

/** 图片缩放组件属性（继承视图属性） */
export type ImageZoomProps = Omit<AnimateProps<ImageProps>, 'source'> &
  ZoomProps & {
    /**
     * 图片URI（优先于source）
     * @default ''
     */
    uri?: string;
    /**
     * 标准图片源属性
     */
    source?: ImageSourcePropType;
  };

/** 布局Hook属性 */
export type ZoomableUseLayoutProps = Pick<ZoomableProps, 'onLayout'>;

/** 布局状态类型（扩展布局矩形） */
export type ZoomableLayoutState = LayoutRectangle & {
  /**
   * 容器中心点坐标
   */
  center: {
    /** X轴中心点 */
    x: number;
    /** Y轴中心点 */
    y: number;
  };
};

/** 手势Hook属性（组合布局状态和缩放属性） */
export type ZoomableUseGesturesProps = Pick<
  ZoomableLayoutState,
  'width' | 'height' | 'center'
> &
  Pick<
    ZoomableProps,
    | 'minScale'
    | 'maxScale'
    | 'scale'
    | 'doubleTapScale'
    | 'maxPanPointers'
    | 'isPanEnabled'
    | 'isPinchEnabled'
    | 'isSingleTapEnabled'
    | 'isDoubleTapEnabled'
    | 'onInteractionStart'
    | 'onInteractionEnd'
    | 'onPinchStart'
    | 'onPinchEnd'
    | 'onPanStart'
    | 'onPanEnd'
    | 'onSingleTap'
    | 'onDoubleTap'
    | 'onProgrammaticZoom'
    | 'onResetAnimationEnd'
  >;

/** 组件引用暴露方法 */
export type ZoomableRef = {
  /**
   * 重置缩放状态
   */
  reset: () => void;
  /**
   * 程序化缩放控制
   */
  zoom: ProgrammaticZoomCallback;
  /**
   * 获取组件当前状态信息
   */
  getInfo: GetInfoCallback;
};

/** 图片缩放组件引用别名 */
export type ImageZoomRef = ZoomableRef;
