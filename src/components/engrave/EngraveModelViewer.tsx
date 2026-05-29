import React from 'react';
import EngraveModelDesign from './EngraveModelDesign';
import { engraveManager } from '../../managers/engraveManager';

const EngraveModelViewer: React.FC = () => {
    return (
        <div className="flex w-full h-screen overflow-hidden pointer-events-none">
            {/* Sidebar / Design UI */}
            <div className="pointer-events-auto">
                <EngraveModelDesign />
            </div>
        </div>
    );
};

export default EngraveModelViewer;