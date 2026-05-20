// CanvasDownloader.tsx
import { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';

interface CanvasDownloaderProps {
    triggerRef: React.MutableRefObject<(() => void) | null>;
    filename?: string;
}

const CanvasDownloader: React.FC<CanvasDownloaderProps> = ({ triggerRef, filename = 'render.png' }) => {
    const { gl } = useThree();

    useEffect(() => {
        // Expose the download function to the outside world via ref
        triggerRef.current = () => {
            const canvas = gl.domElement;
            const dataURL = canvas.toDataURL('image/png');

            const link = document.createElement('a');
            link.href = dataURL;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };
    }, [gl, triggerRef, filename]);

    return null; // renders nothing
};

export default CanvasDownloader;