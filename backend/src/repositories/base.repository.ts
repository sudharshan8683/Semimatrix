import mongoose from 'mongoose';

export interface BaseEntity {
  _id: string;
  workspaceId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: any;
}

import fs from 'fs';
import path from 'path';

export class InMemoryStore {
  private static instance: InMemoryStore;
  private collections: Map<string, Map<string, BaseEntity>> = new Map();

  private constructor() {}

  public static getInstance(): InMemoryStore {
    if (!InMemoryStore.instance) {
      InMemoryStore.instance = new InMemoryStore();
    }
    return InMemoryStore.instance;
  }

  private getStoreFilePath(name: string): string {
    return path.resolve(process.cwd(), 'uploads', `.store_${name}.json`);
  }

  public getCollection(name: string): Map<string, BaseEntity> {
    if (!this.collections.has(name)) {
      const colMap = new Map<string, BaseEntity>();
      try {
        const filePath = this.getStoreFilePath(name);
        if (fs.existsSync(filePath)) {
          const raw = fs.readFileSync(filePath, 'utf-8');
          const list: BaseEntity[] = JSON.parse(raw);
          for (const item of list) {
            colMap.set(item._id, item);
          }
        }
      } catch (_) {}
      this.collections.set(name, colMap);
    }
    return this.collections.get(name)!;
  }

  public persistCollection(name: string): void {
    try {
      const col = this.getCollection(name);
      const filePath = this.getStoreFilePath(name);
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const list = Array.from(col.values());
      fs.writeFileSync(filePath, JSON.stringify(list, null, 2), 'utf-8');
    } catch (_) {}
  }

  public clearAll(): void {
    this.collections.clear();
  }
}

export abstract class BaseRepository<T extends BaseEntity> {
  protected collectionName: string;
  protected model?: mongoose.Model<any>;
  protected store: InMemoryStore;

  constructor(collectionName: string, model?: mongoose.Model<any>) {
    this.collectionName = collectionName;
    this.model = model;
    this.store = InMemoryStore.getInstance();
  }

  protected isMongooseActive(): boolean {
    return mongoose.connection.readyState === 1 && !!this.model;
  }

  protected generateId(): string {
    return new mongoose.Types.ObjectId().toHexString();
  }

  // Strictly workspace-scoped findById
  async findById(workspaceId: string, id: string): Promise<T | null> {
    if (this.isMongooseActive()) {
      return (await this.model!.findOne({ _id: id, workspaceId }))?.toObject() ?? null;
    }
    const col = this.store.getCollection(this.collectionName);
    const item = col.get(id);
    if (!item) return null;
    if (item.workspaceId && item.workspaceId !== workspaceId) return null;
    return { ...item } as T;
  }

  // Strictly workspace-scoped findAll
  async find(workspaceId: string, filter: Record<string, any> = {}, options: { limit?: number; sort?: any } = {}): Promise<T[]> {
    if (this.isMongooseActive()) {
      let q = this.model!.find({ ...filter, workspaceId });
      if (options.sort) q = q.sort(options.sort);
      if (options.limit) q = q.limit(options.limit);
      const docs = await q.exec();
      return docs.map((d) => d.toObject() as T);
    }

    const col = this.store.getCollection(this.collectionName);
    let items = Array.from(col.values()).filter((item) => {
      if (item.workspaceId && item.workspaceId !== workspaceId) return false;
      for (const [key, val] of Object.entries(filter)) {
        if (item[key] !== val) return false;
      }
      return true;
    });

    if (options.sort) {
      const sortField = Object.keys(options.sort)[0];
      const sortDir = options.sort[sortField];
      items.sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (valA < valB) return sortDir === 1 ? -1 : 1;
        if (valA > valB) return sortDir === 1 ? 1 : -1;
        return 0;
      });
    }

    if (options.limit) {
      items = items.slice(0, options.limit);
    }

    return items.map((i) => ({ ...i })) as T[];
  }

  // Create document tied to workspaceId
  async create(workspaceId: string, data: Omit<T, '_id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const now = new Date();
    const id = this.generateId();
    const docData: any = {
      ...data,
      _id: id,
      id: id,
      workspaceId,
      createdAt: now,
      updatedAt: now
    };

    if (this.isMongooseActive()) {
      const created = await this.model!.create(docData);
      return created.toObject() as T;
    }

    const col = this.store.getCollection(this.collectionName);
    col.set(id, docData);
    this.store.persistCollection(this.collectionName);
    return { ...docData } as T;
  }

  // Strictly workspace-scoped update
  async update(workspaceId: string, id: string, updates: Partial<T>): Promise<T | null> {
    if (this.isMongooseActive()) {
      const updated = await this.model!.findOneAndUpdate(
        { _id: id, workspaceId },
        { $set: updates, updatedAt: new Date() },
        { new: true }
      );
      return updated ? (updated.toObject() as T) : null;
    }

    const col = this.store.getCollection(this.collectionName);
    const existing = col.get(id);
    if (!existing || existing.workspaceId !== workspaceId) return null;

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };
    col.set(id, updated);
    this.store.persistCollection(this.collectionName);
    return { ...updated } as T;
  }

  // Strictly workspace-scoped delete
  async delete(workspaceId: string, id: string): Promise<boolean> {
    if (this.isMongooseActive()) {
      const res = await this.model!.deleteOne({ _id: id, workspaceId });
      return res.deletedCount === 1;
    }

    const col = this.store.getCollection(this.collectionName);
    const existing = col.get(id);
    if (!existing || existing.workspaceId !== workspaceId) return false;
    const deleted = col.delete(id);
    this.store.persistCollection(this.collectionName);
    return deleted;
  }

  // Delete all records belonging to a workspace (for delete-my-data compliance)
  async deleteManyByWorkspace(workspaceId: string): Promise<number> {
    if (this.isMongooseActive()) {
      const res = await this.model!.deleteMany({ workspaceId });
      return res.deletedCount || 0;
    }

    const col = this.store.getCollection(this.collectionName);
    let count = 0;
    for (const [id, item] of col.entries()) {
      if (item.workspaceId === workspaceId) {
        col.delete(id);
        count++;
      }
    }
    if (count > 0) {
      this.store.persistCollection(this.collectionName);
    }
    return count;
  }
}
