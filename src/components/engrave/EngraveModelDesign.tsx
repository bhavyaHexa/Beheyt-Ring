import { observer } from 'mobx-react-lite';
import { sceneStore } from '../../stores/SceneStore';
import { rootStore } from '../../managers/stateManager';
import '../../styles/Sidebar.css';

const EngraveModelDesign = observer(() => {
    const { designManager } = rootStore;

    return (
        <aside className="sidebar">
            <button 
                onClick={() => designManager.setCurrentView('home')}
                className="mb-6 text-[0.85rem] font-semibold flex items-center gap-2 text-white/60 hover:text-white transition-colors border-none bg-transparent cursor-pointer"
            >
                ← Back to Design
            </button>

            <div className="sidebar-header">
                <h2>3D Viewer</h2>
            </div>

            <div className="sidebar-content">
                <section className="control-group">
                    <h3>Scene Controls</h3>
                    <div className="control-item">
                        <label>Engraving:</label>
                        <input 
                            type="text" 
                            className="p-2 bg-black/20 border border-white/10 rounded text-white"
                            value={sceneStore.engraving} 
                            onChange={(event) => sceneStore.setEngraving(event.target.value)} 
                        />
                    </div>
                    <div>
                        <label>Your Input</label><br />
                        <span className="text-white/70">{sceneStore.engraving}</span>
                    </div>
                </section>

                <section className="control-group">
                    <h3>Lighting</h3>
                    <div className="control-item">
                        <label htmlFor="ambient-intensity">Ambient Intensity:</label>
                        <input
                            type="range"
                            id="ambient-intensity"
                            min="0"
                            max="2"
                            step="0.1"
                            value={sceneStore.ambientIntensity}
                            onChange={(event) => sceneStore.setAmbientIntensity(Number(event.target.value))}
                        />
                    </div>
                </section>
            </div>
        </aside>
    );
});

export default EngraveModelDesign;
