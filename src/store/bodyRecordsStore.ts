import { create } from "zustand";
import { getDatabase } from "../database/init";
import { BodyRecord } from "../types";

interface BodyRecordsStore {
  records: BodyRecord[];
  loadRecords: () => Promise<void>;
  addRecord: (record: Omit<BodyRecord, "id" | "created_at">) => Promise<void>;
  deleteRecord: (id: number) => Promise<void>;
  getRecordById: (id: number) => Promise<BodyRecord | null>;
}

export const useBodyRecordsStore = create<BodyRecordsStore>((set) => ({
  records: [],

  loadRecords: async () => {
    const db = getDatabase();
    const records = await db.getAllAsync<BodyRecord>(
      "SELECT * FROM body_records ORDER BY date DESC"
    );
    set({ records });
  },

  addRecord: async (record) => {
    const db = getDatabase();
    const created_at = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO body_records (user_id, date, weight, height, neck_perimeter, waist_perimeter, hip_perimeter, bicep_perimeter, thigh_perimeter, calf_perimeter, shoulder_perimeter, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.user_id,
        record.date,
        record.weight,
        record.height,
        record.neck_perimeter ?? null,
        record.waist_perimeter ?? null,
        record.hip_perimeter ?? null,
        record.bicep_perimeter ?? null,
        record.thigh_perimeter ?? null,
        record.calf_perimeter ?? null,
        record.shoulder_perimeter ?? null,
        created_at,
      ]
    );

    await useBodyRecordsStore.getState().loadRecords();
  },

  deleteRecord: async (id) => {
    const db = getDatabase();
    await db.runAsync("DELETE FROM body_records WHERE id = ?", [id]);
    await useBodyRecordsStore.getState().loadRecords();
  },

  getRecordById: async (id) => {
    const db = getDatabase();
    const record = await db.getFirstAsync<BodyRecord>(
      "SELECT * FROM body_records WHERE id = ?",
      [id]
    );
    return record || null;
  },
}));
