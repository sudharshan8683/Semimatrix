import { UserModel, UserRole } from '../models/User.js';
import { BaseEntity, InMemoryStore } from './base.repository.js';
import mongoose from 'mongoose';

export interface UserEntity extends BaseEntity {
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  workspaceId: string;
  lastLoginAt?: Date;
}

export class UserRepository {
  private store = InMemoryStore.getInstance();
  private collectionName = 'users';

  private isMongooseActive(): boolean {
    return mongoose.connection.readyState === 1;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const normalized = email.toLowerCase().trim();
    if (this.isMongooseActive()) {
      return (await UserModel.findOne({ email: normalized }))?.toObject() ?? null;
    }
    const col = this.store.getCollection(this.collectionName);
    for (const user of col.values()) {
      if ((user as UserEntity).email === normalized) {
        return { ...(user as UserEntity) };
      }
    }
    return null;
  }

  async findById(id: string): Promise<UserEntity | null> {
    if (this.isMongooseActive()) {
      return (await UserModel.findById(id))?.toObject() ?? null;
    }
    return (this.store.getCollection(this.collectionName).get(id) as UserEntity) ?? null;
  }

  async create(data: Omit<UserEntity, '_id' | 'createdAt' | 'updatedAt'>): Promise<UserEntity> {
    const id = new mongoose.Types.ObjectId().toHexString();
    const doc: UserEntity = {
      ...data,
      email: data.email.toLowerCase().trim(),
      _id: id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (this.isMongooseActive()) {
      const created = await UserModel.create(doc);
      return created.toObject() as UserEntity;
    }

    this.store.getCollection(this.collectionName).set(id, doc);
    return { ...doc };
  }

  async updateLastLogin(id: string): Promise<void> {
    const now = new Date();
    if (this.isMongooseActive()) {
      await UserModel.updateOne({ _id: id }, { lastLoginAt: now });
      return;
    }
    const col = this.store.getCollection(this.collectionName);
    const existing = col.get(id);
    if (existing) {
      existing.lastLoginAt = now;
      col.set(id, existing);
    }
  }

  async deleteByWorkspace(workspaceId: string): Promise<number> {
    if (this.isMongooseActive()) {
      const res = await UserModel.deleteMany({ workspaceId });
      return res.deletedCount || 0;
    }
    const col = this.store.getCollection(this.collectionName);
    let count = 0;
    for (const [id, user] of col.entries()) {
      if ((user as UserEntity).workspaceId === workspaceId) {
        col.delete(id);
        count++;
      }
    }
    return count;
  }
}

export const userRepository = new UserRepository();
