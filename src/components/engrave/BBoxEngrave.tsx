import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { engraveManager } from '../../managers/engraveManager';
import { generateTextHeightMap } from '../../utils/normalUtils';

interface BBoxEngraveProps {
    textOffsetX?: number;
}

const BBoxEngrave = observer(({ textOffsetX = 0 }: BBoxEngraveProps) => {
    const text = engraveManager.engraving || '';

    useEffect(() => {
        if (!text) {
            console.log("BBoxEngrave: No text engraved");
            return;
        }

        // Generate the height map canvas using the same settings
        const canvas = generateTextHeightMap({
            text: text,
            mode: 'engrave',
            blur: 0.01,
            offsetY: 0,
            offsetX: textOffsetX
        });

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { width, height } = canvas;
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        let minX = width;
        let maxX = 0;
        let minY = height;
        let maxY = 0;
        let found = false;

        // Scan pixels
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];

                // For 'engrave' mode, background is white (#FFFFFF), text is black (#000000)
                // Any pixel that is significantly darker than white is part of the text
                if (r < 240 || g < 240 || b < 240) {
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                    found = true;
                }
            }
        }

        if (found) {
            console.log(`BBoxEngrave - Text: "${text}", OffsetX: ${textOffsetX}`);
            console.log(`Bounding Box -> minX: ${minX}, maxX: ${maxX}, minY: ${minY}, maxY: ${maxY}`);
        } else {
            console.log(`BBoxEngrave - Text: "${text}", OffsetX: ${textOffsetX} -> No pixels found`);
        }
    }, [text, textOffsetX]);

    return null;
});

export default BBoxEngrave;
