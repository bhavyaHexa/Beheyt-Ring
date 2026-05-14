import { useState } from "react"
import ModelViewer from "./components/ModelViewer"
import Dropzone from "./components/Dropzone"
import DesignManager from "./components/DesignManager/DesignManager"
import ModelRender from "./components/Design3DManager/ModelRender"

export default function App() {



    return (
        <div className="app-container">
            <ModelRender />

            <div className="ui-overlay flex flex-col gap-4">
                <DesignManager />
            </div>
        </div >
    )
}