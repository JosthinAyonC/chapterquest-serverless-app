/// <reference types="vite/client" />

declare module 'react-pageflip' {
  import type { Component, ReactNode } from 'react';

  export interface FlipBookProps {
    className?: string;
    width: number;
    height: number;
    size?: 'fixed' | 'stretch';
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    showCover?: boolean;
    mobileScrollSupport?: boolean;
    drawShadow?: boolean;
    usePortrait?: boolean;
    children?: ReactNode;
  }

  export default class HTMLFlipBook extends Component<FlipBookProps> {}
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_APP_ENV?: 'prod' | 'dev' | 'local';
  /** Local only — override reading timer to N seconds (e.g. "1") */
  readonly VITE_DEV_TIMER_SECONDS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
