export interface TextHeightMapOptions {
    text: string;
    width?: number;
    height?: number;
    fontSize?: number;
    fontFamily?: string;
    blur?: number;
    mode?: 'emboss' | 'engrave';
    offsetY?: number;
}

export function generateTextHeightMap(options: TextHeightMapOptions): HTMLCanvasElement {
    const {
        text,
        width = 1024,
        height = 1024,
        fontSize = 40,
        fontFamily = 'Arial, sans-serif',
        blur = 5,
        mode = 'emboss',
        offsetY = -50
    } = options;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error("2D Canvas Context is not supported in this environment.");
    }

    const bgColor = mode === 'emboss' ? '#000000' : '#FFFFFF';
    const textColor = mode === 'emboss' ? '#FFFFFF' : '#000000';

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    ctx.filter = `blur(${blur}px)`;

    ctx.fillStyle = textColor;
    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillText(text, width / 2, (height / 2) + offsetY);

    return canvas;
}


export function convertHeightToNormalMap(
    heightCanvas: HTMLCanvasElement,
    strength: number = 2.0
): HTMLCanvasElement {
    const width = heightCanvas.width;
    const height = heightCanvas.height;

    // Create a new canvas for the normal map
    const normalCanvas = document.createElement('canvas');
    normalCanvas.width = width;
    normalCanvas.height = height;
    const ctx = normalCanvas.getContext('2d');
    const heightCtx = heightCanvas.getContext('2d');

    if (!ctx || !heightCtx) return normalCanvas;

    // Read the grayscale pixel data from the height map
    const heightData = heightCtx.getImageData(0, 0, width, height);
    const normalData = ctx.createImageData(width, height);

    const getVal = (x: number, y: number) => {
        // Clamp to edges to avoid wrapping artifacts
        const cx = Math.max(0, Math.min(width - 1, x));
        const cy = Math.max(0, Math.min(height - 1, y));
        // Return just the Red channel (since it's grayscale, R=G=B)
        return heightData.data[(cy * width + cx) * 4];
    };

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // Sample neighbors (Sobel-style gradient)
            const left = getVal(x - 1, y);
            const right = getVal(x + 1, y);
            const up = getVal(x, y - 1);
            const down = getVal(x, y + 1);

            // Calculate slopes
            const dx = (left - right) / 255.0 * strength;
            const dy = (up - down) / 255.0 * strength;
            const dz = 1.0; // The "Up" vector

            // Normalize the vector (length = 1)
            const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
            const nx = dx / length;
            const ny = dy / length;
            const nz = dz / length;

            // Map from [-1, 1] range to [0, 255] RGB color space
            const i = (y * width + x) * 4;
            normalData.data[i] = Math.round((nx + 1.0) * 127.5);     // Red (X)
            normalData.data[i + 1] = Math.round((ny + 1.0) * 127.5); // Green (Y)
            normalData.data[i + 2] = Math.round((nz + 1.0) * 127.5); // Blue (Z)
            normalData.data[i + 3] = 255;                            // Alpha
        }
    }

    ctx.putImageData(normalData, 0, 0);
    return normalCanvas;
}