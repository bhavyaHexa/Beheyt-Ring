import { makeAutoObservable } from "mobx";
import { RootStore } from "./stateManager";

export interface SheetRecord {
    id: string;
    collectionName: string;
    modelNumber: string;
    meshName: string;
    normalMapName: string;
    normalValue: number;
    timestamp: string;
}

export class SheetManagerStore {
    rootStore: RootStore;
    records: SheetRecord[] = [];

    constructor(rootStore: RootStore) {
        makeAutoObservable(this, { rootStore: false });
        this.rootStore = rootStore;
        this.loadRecords();
    }

    loadRecords() {
        try {
            const saved = localStorage.getItem("hx_sheet_records");
            if (saved) {
                this.records = JSON.parse(saved);
            }
        } catch (e) {
            console.error("Failed to load sheet records from localStorage", e);
        }
    }

    saveRecordsToStorage() {
        try {
            localStorage.setItem("hx_sheet_records", JSON.stringify(this.records));
        } catch (e) {
            console.error("Failed to save sheet records to localStorage", e);
        }
    }

    addRecord(collectionName: string, modelNumber: string, meshName: string, normalMapName: string, normalValue: number) {
        // Find existing record with same collection, model, and mesh
        const existingIndex = this.records.findIndex(
            r => r.collectionName.toLowerCase() === collectionName.toLowerCase() &&
                 r.modelNumber === modelNumber &&
                 r.meshName.toLowerCase() === meshName.toLowerCase()
        );

        const newRecord: SheetRecord = {
            id: Math.random().toString(36).substring(2, 9),
            collectionName,
            modelNumber,
            meshName,
            normalMapName,
            normalValue,
            timestamp: new Date().toLocaleString()
        };

        if (existingIndex > -1) {
            // Update existing record
            this.records[existingIndex] = {
                ...this.records[existingIndex],
                normalMapName,
                normalValue,
                timestamp: newRecord.timestamp
            };
        } else {
            // Add new record
            this.records.push(newRecord);
        }

        this.saveRecordsToStorage();
    }

    deleteRecord(id: string) {
        this.records = this.records.filter(r => r.id !== id);
        this.saveRecordsToStorage();
    }

    clearRecords() {
        this.records = [];
        this.saveRecordsToStorage();
    }

    exportToCSV() {
        if (this.records.length === 0) return;
        
        const headers = ["Collection Name", "Model Number", "Mesh Name", "Normal Map Name", "Normal Value", "Saved At"];
        const rows = this.records.map(r => [
            r.collectionName,
            r.modelNumber,
            r.meshName,
            r.normalMapName,
            r.normalValue.toString(),
            r.timestamp
        ]);

        const csvContent = [headers.join(","), ...rows.map(e => e.map(val => `"${val.replace(/'/g, "''").replace(/"/g, '""')}"`).join(","))].join("\n");
        // UTF-8 BOM
        const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `saved_normals_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}
