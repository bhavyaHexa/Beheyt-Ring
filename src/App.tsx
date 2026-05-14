import { observer } from "mobx-react-lite"
import ModelViewer from "./components/ModelViewer"
import Dropzone from "./components/Dropzone"
import DesignManager from "./components/DesignManager/DesignManager"
import ModelRender from "./components/Design3DManager/ModelRender"

const App = observer(() => {
    return (
        <div className="app-container">
            <ModelRender />

            <div className="ui-overlay flex flex-col gap-4">
                <DesignManager />
            </div>
        </div >
    )
});

export default App;