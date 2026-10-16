import fs from 'fs';
import path from 'path';
import { WorkspaceModel } from '../models/Workspace.js';
import { BaseEntity, InMemoryStore } from './base.repository.js';
import mongoose from 'mongoose';

export interface WorkspaceEntity extends BaseEntity {
  name: string;
  ownerId?: string;
  retentionDays: number;
}

export class WorkspaceRepository {
  private store = InMemoryStore.getInstance();
  private collectionName = 'workspaces';
  private persistPath = path.resolve(process.cwd(), 'uploads', 'workspaces_store.json');

  private loadPersistedWorkspaces() {
    try {
      if (fs.existsSync(this.persistPath)) {
        const raw = fs.readFileSync(this.persistPath, 'utf-8');
        const list: WorkspaceEntity[] = JSON.parse(raw);
        const col = this.store.getCollection(this.collectionName);
        for (const ws of list) {
          if (!col.has(ws._id)) {
            col.set(ws._id, ws);
          }
        }
      }
    } catch (_) {}
  }

  private savePersistedWorkspaces() {
    try {
      const dir = path.dirname(this.persistPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const col = this.store.getCollection(this.collectionName);
      const list = Array.from(col.values());
      fs.writeFileSync(this.persistPath, JSON.stringify(list, null, 2), 'utf-8');
    } catch (_) {}
  }

  private isMongooseActive(): boolean {
    return mongoose.connection.readyState === 1;
  }

  async findById(id: string): Promise<WorkspaceEntity | null> {
    if (this.isMongooseActive()) {
      return ((await WorkspaceModel.findById(id))?.toObject() as unknown as WorkspaceEntity) ?? null;
    }
    this.loadPersistedWorkspaces();
    return (this.store.getCollection(this.collectionName).get(id) as WorkspaceEntity) ?? null;
  }

  async create(name: string, ownerId?: string): Promise<WorkspaceEntity> {
    const id = new mongoose.Types.ObjectId().toHexString();
    const doc: WorkspaceEntity = {
      _id: id,
      name,
      ownerId,
      retentionDays: 90,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (this.isMongooseActive()) {
      const created = await WorkspaceModel.create(doc);
      return created.toObject() as unknown as WorkspaceEntity;
    }

    this.store.getCollection(this.collectionName).set(id, doc);
    this.savePersistedWorkspaces();
    return { ...doc };
  }

  async delete(id: string): Promise<boolean> {
    if (this.isMongooseActive()) {
      const res = await WorkspaceModel.deleteOne({ _id: id });
      return res.deletedCount === 1;
    }
    return this.store.getCollection(this.collectionName).delete(id);
  }
}

export const workspaceRepository = new WorkspaceRepository();
