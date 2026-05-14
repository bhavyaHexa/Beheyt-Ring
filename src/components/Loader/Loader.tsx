import React from "react";
import { Html } from "@react-three/drei";
import "./Loader.css";

const Loader = () => {
    return (
        <Html center>
            <div className="loader-overlay">
                <div className="enterprise-spinner"></div>
            </div>
        </Html>
    );
};

export default Loader;