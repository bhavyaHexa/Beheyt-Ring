import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { CameraControls } from '@react-three/drei';
import { rootStore } from '../../managers/stateManager';

interface CameraTransitionControllerProps {
    controls: CameraControls | null;
}

export const CameraTransitionController = observer(({ controls }: CameraTransitionControllerProps) => {
    const { designManager } = rootStore;

    useEffect(() => {
        if (!controls) return;

        if (designManager.currentView === 'engrave') {
            // Adjust minDistance to allow close zoom
            controls.minDistance = 0;

            // Set transition smoothTime to be slightly slower/cinematic
            controls.smoothTime = 0.8;

            // Transition camera smoothly to the engrave view
            controls.setLookAt(0, 2.5, -5.5, 0, 0, 0, true).then(() => {
                // Restore default smoothTime for manual control once transition completes
                controls.smoothTime = 0.25;
            });
        } else {
            // Set transition smoothTime to be slightly slower/cinematic
            controls.smoothTime = 0.8;

            // Transition back to home view smoothly
            controls.setLookAt(0, 0, 10, 0, 0, 0, true).then(() => {
                // Restore default smoothTime for manual control once transition completes
                controls.smoothTime = 0.25;

                // Only restore minDistance if we are still on the home view
                if (designManager.currentView === 'home') {
                    controls.minDistance = 5;
                }
            });
        }
    }, [designManager.currentView, controls]);

    return null;
});

export default CameraTransitionController;
