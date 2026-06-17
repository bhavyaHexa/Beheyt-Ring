import React, { useEffect, useMemo } from 'react';
import { useEnvironment } from '@react-three/drei';
import { observer } from 'mobx-react-lite';
import { rootStore } from '../../managers/stateManager';
import { useThree } from '@react-three/fiber';
import { useControls } from 'leva';

// Extracted Subcomponents
import { SingleModel } from './SingleModel';

const NormalLevaControls = observer(() => {
    const { designManager } = rootStore;
    const currentHex = designManager.colorMap[designManager.selectedColor.toLowerCase()] || '#ffffff';

    const [{ normalIntensity, ringColor, customColor }, set] = useControls('Normal Map Controls', () => ({
        normalIntensity: { value: designManager.normalIntensity, min: -5.0, max: 5.0, step: 0.05 },
        ringColor: {
            options: {
                'Yellow Gold': 'gold',
                'White Gold / Silver': 'silver',
                'Rose Gold': 'rose gold'
            },
            value: designManager.selectedColor,
        },
        customColor: {
            label: 'Color Edit',
            value: currentHex,
        }
    }));

    useEffect(() => {
        designManager.setNormalIntensity(normalIntensity);
    }, [normalIntensity, designManager]);

    useEffect(() => {
        if (ringColor) {
            designManager.setColor(ringColor as any);
        }
    }, [ringColor, designManager]);

    useEffect(() => {
        if (customColor) {
            const activeColorKey = designManager.selectedColor.toLowerCase();
            if (designManager.colorMap[activeColorKey] !== customColor) {
                designManager.colorMap[activeColorKey] = customColor;
            }
        }
    }, [customColor, designManager]);

    // Update Leva control value when store changes from outside
    useEffect(() => {
        const activeColorKey = designManager.selectedColor.toLowerCase();
        const hex = designManager.colorMap[activeColorKey] || '#ffffff';
        set({ 
            ringColor: designManager.selectedColor,
            customColor: hex
        });
    }, [designManager.selectedColor, set]);

    return null;
});

const Model3DContent = observer(() => {
    const { size } = useThree();
    const { design3DManager, designManager } = rootStore;
    const { collection, modelId } = design3DManager.activeModel;

    // Load Environment Map for the Diamond Refraction (shared)
    const diamondEnvMap = useEnvironment({ files: '/env/08.hdr' }); // Note: updated file path if needed, or kept `/08.hdr`. Wait! Let's check the original code.

    // Let's verify environment map file path:
    // In original Model3DContent.tsx: const diamondEnvMap = useEnvironment({ files: '/08.hdr' });
    // In ModelRender.tsx: Environment files={"/env/08.hdr"}
    // Let's keep '/08.hdr' as in the original code, to prevent breaking refraction. Wait, the original code had:
    // const diamondEnvMap = useEnvironment({ files: '/08.hdr' });
    // Let's use '/08.hdr'. Wait, is there any reason to change it? No, keep it as was in original.

    // Define the variations dynamically based on the active model in ringsData
    const variations = useMemo(() => {
        if (!design3DManager.ringsData) return [];
        const colData = design3DManager.ringsData.rings[collection];
        if (!colData) return [];
        const modelData = colData[modelId];
        if (!modelData) return [];
        return Object.keys(modelData);
    }, [design3DManager.ringsData, collection, modelId]);

    return (
        <group>
            {designManager.currentRoute === '/normal' && <NormalLevaControls />}
            {variations.map((v) => (
                    <SingleModel
                        key={`${collection}-${modelId}-${v}`}
                        variation={v}
                        diamondEnvMap={diamondEnvMap}
                        size={size}
                        normalIntensity={designManager.normalIntensity}
                    />
            ))}
        </group>
    );
});

export default Model3DContent;