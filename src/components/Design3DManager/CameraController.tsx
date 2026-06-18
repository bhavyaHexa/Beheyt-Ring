import React from 'react';
import { CameraControls } from '@react-three/drei';

interface CameraControllerProps {
    cameraRef: React.RefObject<CameraControls | null>;
}

export const CameraController = ({ cameraRef }: CameraControllerProps) => {
    return (
        <CameraControls
            ref={cameraRef}
            makeDefault
            maxDistance={10}
            smoothTime={0.25}
            draggingSmoothTime={0.1}
            dollySpeed={0.5}
            truckSpeed={0} // Keep model centered by disabling panning
            maxPolarAngle={Math.PI / 2}
        />
    );
};

export default CameraController;
