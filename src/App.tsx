import React, { useEffect } from "react"
import { observer } from "mobx-react-lite"
import DesignManager from "./components/DesignManager/DesignManager"
import ModelRender from "./components/Design3DManager/ModelRender"
import SheetManager from "./components/SheetManager/SheetManager"
import { rootStore } from "./managers/stateManager"

const App = observer(() => {
    const { designManager } = rootStore;

    useEffect(() => {
        const handleLocationChange = () => {
            designManager.setCurrentRoute(window.location.pathname);
        };
        window.addEventListener("popstate", handleLocationChange);
        return () => {
            window.removeEventListener("popstate", handleLocationChange);
        };
    }, [designManager]);

    const isNormalRoute = designManager.currentRoute === "/normal";

    return (
        <div className="app-container">
            <ModelRender />

            <div className="ui-overlay flex flex-col gap-4">
                <DesignManager />
            </div>

            {isNormalRoute && <SheetManager />}
        </div >
    )
});


export default App;