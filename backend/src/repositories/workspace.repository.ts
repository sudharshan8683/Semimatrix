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

  private isMongooseActive(): boolean {
    return mongoose.connection.readyState === 1;
  }

  async findById(id: string): Promise<WorkspaceEntity | null> {
    if (this.isMongooseActive()) {
      return (await WorkspaceModel.findById(id))?.toObject() ?? null;
    }
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
      return created.toObject() as WorkspaceEntity;
    }

    this.store.getCollection(this.collectionName).set(id, doc);
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
