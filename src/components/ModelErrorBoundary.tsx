import React from 'react';

class ModelErrorBoundary extends React.Component<
    { children: React.ReactNode; name?: string },
    { hasError: boolean }
> {
    state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: any, errorInfo: any) {
        console.warn(`ModelErrorBoundary caught an error for ${this.props.name || 'model'}:`, error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return null;
        }
        return this.props.children;
    }
}

export default ModelErrorBoundary;
