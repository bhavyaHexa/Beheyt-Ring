import React from 'react';
import { CameraControls } from '@react-three/drei';

interface CameraControllerProps {
    minDistance: number;
    cameraRef: React.RefObject<CameraControls | null>;
}

export const CameraController = ({ minDistance, cameraRef }: CameraControllerProps) => {
    return (
        <CameraControls
            ref={cameraRef}
            makeDefault
            minDistance={minDistance}
            maxDistance={10}
            smoothTime={0.25}
            draggingSmoothTime={0.1}
            dollySpeed={0.5}
            truckSpeed={0} // Keep model centered by disabling panning
        />
    );
};

export default CameraController;
