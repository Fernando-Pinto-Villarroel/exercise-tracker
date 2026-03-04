import { create } from "zustand";
import { getDatabase } from "../database/init";
import { BodyRecord } from "../types";

const PAGE_SIZE = 10;

interface BodyRecordsStore {
  records: BodyRecord[];
  hasMore: boolean;
  loadRecords: () => Promise<void>;
  loadMoreRecords: () => Promise<void>;
  loadAllRecords: () => Promise<BodyRecord[]>;
  resetRecords: () => void;
  addRecord: (record: Omit<BodyRecord, "id" | "created_at">) => Promise<void>;
  deleteRecord: (id: number) => Promise<void>;
  getRecordById: (id: number) => Promise<BodyRecord | null>;
}

export const useBodyRecordsStore = create<BodyRecordsStore>((set, get) => ({
  records: [],
  hasMore: true,

  loadRecords: async () => {
    const db = getDatabase();
    const records = await db.getAllAsync<BodyRecord>(
      "SELECT * FROM body_records ORDER BY date DESC LIMIT ?",
      [PAGE_SIZE]
    );
    set({ records, hasMore: records.length >= PAGE_SIZE });
  },

  loadMoreRecords: async () => {
    const { records, hasMore } = get();
    if (!hasMore) return;

    const db = getDatabase();
    const moreRecords = await db.getAllAsync<BodyRecord>(
      "SELECT * FROM body_records ORDER BY date DESC LIMIT ? OFFSET ?",
      [PAGE_SIZE, records.length]
    );
    set({
      records: [...records, ...moreRecords],
      hasMore: moreRecords.length >= PAGE_SIZE,
    });
  },

  loadAllRecords: async () => {
    const db = getDatabase();
    return await db.getAllAsync<BodyRecord>(
      "SELECT * FROM body_records ORDER BY date DESC"
    );
  },

  resetRecords: () => {
    set({ records: [], hasMore: true });
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
