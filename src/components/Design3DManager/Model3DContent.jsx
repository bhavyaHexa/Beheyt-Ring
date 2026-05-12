import React, { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { observer } from 'mobx-react-lite';
import { rootStore } from '../../managers/stateManager';

// 3D Rendering Component
const Model3DContent = observer(() => {
    const { design3DManager } = rootStore;
    const url = design3DManager.activeModel.modelUrl || "/BehytRings/Briljant/546/4.5mm/Beheyt Briljant_546_V1.1.glb";

    console.log("Rendering Model URL:", url)

    useEffect(() => {
        // Alert only if we have data loaded but no URL for the selection
        if (!url && design3DManager.ringsData) {
            alert("model is not present");
        }
    }, [url, design3DManager.ringsData]);

    if (!url) return null;

    const { scene } = useGLTF(url);
    return <primitive object={scene} rotation={[-Math.PI / 2, 0, Math.PI / 3]} />;
});

export default Model3DContent;
