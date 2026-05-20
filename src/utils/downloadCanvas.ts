export function downloadCanvas(canvas: HTMLCanvasElement, filename: string = 'height-map.png'): void {
    const dataURL = canvas.toDataURL('image/png');

    const link = document.createElement('a');
    link.href = dataURL;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}