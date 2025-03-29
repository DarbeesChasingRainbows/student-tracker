// Simple in-memory database for development purposes
// In a production environment, this would be replaced with a real database connection

// Generic type for all entities
interface Entity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Generic repository implementation
export class InMemoryDatabase<T extends Entity> {
  private entities: Map<string, T> = new Map();

  constructor(private entityName: string) {}

  findById(id: string): Promise<T | null> {
    return Promise.resolve(this.entities.get(id) || null);
  }

  findAll(): Promise<T[]> {
    return Promise.resolve(Array.from(this.entities.values()));
  }

  save(entity: Partial<T> & { id?: string }): Promise<T> {
    const id = entity.id || crypto.randomUUID();
    const now = new Date();
    
    const savedEntity = {
      ...(entity as Partial<T>),
      id,
      createdAt: entity.id ? (this.entities.get(id)?.createdAt || now) : now,
      updatedAt: now,
    } as T;
    
    this.entities.set(id, savedEntity);
    return Promise.resolve(savedEntity);
  }

  delete(id: string): Promise<boolean> {
    if (!this.entities.has(id)) {
      return Promise.resolve(false);
    }
    
    this.entities.delete(id);
    return Promise.resolve(true);
  }

  find(predicate: (entity: T) => boolean): Promise<T[]> {
    return Promise.resolve(Array.from(this.entities.values()).filter(predicate));
  }

  findOne(predicate: (entity: T) => boolean): Promise<T | null> {
    const entities = Array.from(this.entities.values());
    return Promise.resolve(entities.find(predicate) || null);
  }
}

// Database singleton to manage all repositories
export class Database {
  private static instance: Database;
  private repositories: Map<string, InMemoryDatabase<Entity>> = new Map();

  private constructor() {}

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  getRepository<T extends Entity>(entityName: string): InMemoryDatabase<T> {
    if (!this.repositories.has(entityName)) {
      this.repositories.set(entityName, new InMemoryDatabase<T>(entityName));
    }
    return this.repositories.get(entityName) as InMemoryDatabase<T>;
  }
}
