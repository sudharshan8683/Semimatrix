import fs from 'fs';
import path from 'path';
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
  private persistPath = path.resolve(process.cwd(), 'uploads', 'users_store.json');

  private loadPersistedUsers() {
    try {
      if (fs.existsSync(this.persistPath)) {
        const raw = fs.readFileSync(this.persistPath, 'utf-8');
        const list: UserEntity[] = JSON.parse(raw);
        const col = this.store.getCollection(this.collectionName);
        for (const u of list) {
          if (!col.has(u._id)) {
            col.set(u._id, u);
          }
        }
      }
    } catch (_) {}
  }

  private savePersistedUsers() {
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

  async findByEmail(email: string): Promise<UserEntity | null> {
    const normalized = email.toLowerCase().trim();
    if (this.isMongooseActive()) {
      return (await UserModel.findOne({ email: normalized }))?.toObject() ?? null;
    }
    this.loadPersistedUsers();
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
    this.loadPersistedUsers();
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
    this.savePersistedUsers();
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
