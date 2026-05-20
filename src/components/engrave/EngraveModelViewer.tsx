import React from 'react';
import EngraveModelDesign from './EngraveModelDesign';
import { engraveManager } from '../../managers/engraveManager';

const EngraveModelViewer: React.FC = () => {
    const handleDownload = () => {
        const canvas = document.querySelector('canvas');
        if (canvas) {
            const dataURL = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataURL;
            link.download = "my-engraving.png";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className="flex w-full h-screen overflow-hidden pointer-events-none">
            {/* Sidebar / Design UI */}
            <div className="pointer-events-auto">
                <EngraveModelDesign />
            </div>

            {/* 3D Viewport Overlay Area */}
            <div className="flex-1 relative">
                {/* Download button — positioned over the canvas */}
                <div className="absolute bottom-4 right-4 flex gap-2 z-10 pointer-events-auto">
                    <button
                        onClick={handleDownload}
                        className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors shadow-md"
                    >
                        ⬇ Download Render
                    </button>
                    <button
                        onClick={() => engraveManager.triggerUVDownload()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-md font-semibold"
                    >
                        🗺️ Download UVs
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EngraveModelViewer;