import React from 'react';
import EngraveModelDesign from './EngraveModelDesign';
import EngraveModelRender from './EngraveModelRender';
import Loader from '../Loader/Loader';

const EngraveModelViewer: React.FC = () => {
    return (
        <div className="flex w-full h-screen overflow-hidden">
            {/* Sidebar / Design UI */}
            <EngraveModelDesign />

            {/* 3D Viewport */}
            <div className="flex-1 relative">
                <EngraveModelRender />
            </div>
        </div>
    );
};

export default EngraveModelViewer;
