import React, { Component, ErrorInfo, ReactNode } from 'react';
import { removeCustomModel } from '../utils/modelStorage';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ModelErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('[ModelErrorBoundary] Caught 3D Model loading error:', error);
    // Automatically purge broken custom model so future renders don't keep failing
    removeCustomModel().catch(() => {});
    this.props.onError?.(error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }

    return this.props.children;
  }
}
