import { observer } from "mobx-react-lite"
import DesignManager from "./components/DesignManager/DesignManager"
import ModelRender from "./components/Design3DManager/ModelRender"
import SheetManager from "./components/SheetManager/SheetManager"

const App = observer(() => {
    return (
        <div className="app-container">
            <ModelRender />

            <div className="ui-overlay flex flex-col gap-4">
                <DesignManager />
            </div>

            <SheetManager />
        </div >
    )
});

export default App;