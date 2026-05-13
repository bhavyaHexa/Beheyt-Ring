import { useState } from "react"
import ModelViewer from "./components/ModelViewer"
import Dropzone from "./components/Dropzone"
import DesignManager from "./components/DesignManager/DesignManager"
import ModelRender from "./components/Design3DManager/ModelRender"

export default function App() {
    const [modelURL, setModelURL] = useState("/models/Beheyt Artisanaal_174_V1.10.glb")
    const [modelName, setModelName] = useState("Beheyt Artisanaal_174_V1.10.glb")
    const envURL = "/env/08.hdr"

    console.log(modelURL)

    const handleFileLoaded = (url, name) => {
        setModelURL(url)
        setModelName(name)
    }

    return (
        <div className="app-container">
            <ModelRender />

            <div className="ui-overlay flex flex-col gap-4 pointer-events-auto">
                {/* <div className="top-info">
                <h1>Beheyt Ring Viewer</h1>
                <p>{modelName}</p>
            </div> */}

                <DesignManager />
            </div>

            {/* <ModelViewer modelUrl={modelURL} envUrl={envURL} /> */}

            <Dropzone onFileLoaded={handleFileLoaded} />
        </div >
    )
}