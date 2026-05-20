import * as THREE from 'three';

/**
 * Generates a PNG image of the UV layout for a given geometry.
 * @param geometry The THREE.BufferGeometry to export UVs from.
 * @param size The size of the output image (default 2048).
 * @param textMaskCanvas Optional canvas containing the text height map to highlight used UVs.
 * @returns An HTMLCanvasElement containing the UV layout.
 */
export function generateUVLayoutCanvas(
    geometry: THREE.BufferGeometry, 
    size: number = 2048,
    textMaskCanvas?: HTMLCanvasElement | null
): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Could not get 2D context');
    }

    // Background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, size, size);

    // UV Attribute
    const uvAttribute = geometry.getAttribute('uv');
    if (!uvAttribute) {
        console.warn('Geometry has no UV attribute');
        return canvas;
    }

    const index = geometry.getIndex();
    const uvArray = uvAttribute.array;

    const drawTriangles = (context: CanvasRenderingContext2D) => {
        context.beginPath();
        const drawTriangle = (i1: number, i2: number, i3: number) => {
            const u1 = uvArray[i1 * 2] * size;
            const v1 = (1 - uvArray[i1 * 2 + 1]) * size; // Flip Y for canvas
            const u2 = uvArray[i2 * 2] * size;
            const v2 = (1 - uvArray[i2 * 2 + 1]) * size;
            const u3 = uvArray[i3 * 2] * size;
            const v3 = (1 - uvArray[i3 * 2 + 1]) * size;

            context.moveTo(u1, v1);
            context.lineTo(u2, v2);
            context.lineTo(u3, v3);
            context.lineTo(u1, v1);
        };

        if (index) {
            for (let i = 0; i < index.count; i += 3) {
                drawTriangle(index.getX(i), index.getX(i + 1), index.getX(i + 2));
            }
        } else {
            for (let i = 0; i < uvAttribute.count; i += 3) {
                drawTriangle(i, i + 1, i + 2);
            }
        }
        context.stroke();
    };

    // 1. Draw all UVs in GREY
    ctx.strokeStyle = '#808080'; // Grey color for default UVs
    ctx.lineWidth = 1;
    drawTriangles(ctx);

    // 2. If a text mask is provided, draw ORANGE UVs only where text exists
    if (textMaskCanvas) {
        // Create an offscreen canvas for the orange UVs
        const orangeCanvas = document.createElement('canvas');
        orangeCanvas.width = size;
        orangeCanvas.height = size;
        const oCtx = orangeCanvas.getContext('2d')!;

        oCtx.strokeStyle = '#FFA500'; // Orange color
        oCtx.lineWidth = 1;
        drawTriangles(oCtx);

        // We also need the text mask stretched to this size
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = size;
        maskCanvas.height = size;
        const mCtx = maskCanvas.getContext('2d')!;
        mCtx.drawImage(textMaskCanvas, 0, 0, size, size);

        // Determine if text is black or white based on mode. 'engrave' has white bg, black text.
        // We will read the pixels and apply the mask to orangeCanvas directly.
        const orangeData = oCtx.getImageData(0, 0, size, size);
        const maskData = mCtx.getImageData(0, 0, size, size);

        // We assume that the text is the "darker" part (engrave mode) or the "lighter" part (emboss mode).
        // Let's just check the center pixel or corner pixel to see background color.
        // Usually, corner (0,0) is background.
        const isBgWhite = maskData.data[0] > 128;

        for (let i = 0; i < maskData.data.length; i += 4) {
            const r = maskData.data[i];
            
            // Check if this pixel is part of the text
            const isText = isBgWhite ? (r < 128) : (r > 128);

            if (!isText) {
                // If it's not text, clear the orange pixel
                orangeData.data[i + 3] = 0;
            }
        }
        
        oCtx.putImageData(orangeData, 0, 0);

        // Draw the masked orange UVs over the grey UVs
        ctx.drawImage(orangeCanvas, 0, 0);
    }

    // Optional: Add some branding or info
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '24px Arial';
    ctx.fillText('UV Layout Export', 20, 40);

    return canvas;
}

/**
 * Downloads the UV layout of a geometry as a PNG image.
 */
export function downloadUVLayout(
    geometry: THREE.BufferGeometry, 
    size: number = 2048, 
    filename: string = 'uvmap.png',
    textMaskCanvas?: HTMLCanvasElement | null
) {
    const canvas = generateUVLayoutCanvas(geometry, size, textMaskCanvas);
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
}
