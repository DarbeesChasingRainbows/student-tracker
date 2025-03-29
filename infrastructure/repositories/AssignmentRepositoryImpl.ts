import { Assignment, AssignmentStatus, AssignmentType } from "../../domain/models/Assignment.ts";
import { AssignmentRepository } from "../../ports/repositories/AssignmentRepository.ts";
import { Database } from "../database/db.ts";

export class AssignmentRepositoryImpl implements AssignmentRepository {
  private db = Database.getInstance().getRepository<Assignment>("assignments");

  async findById(id: string): Promise<Assignment | null> {
    return await this.db.findById(id);
  }

  async save(assignment: Omit<Assignment, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<Assignment> {
    return await this.db.save(assignment);
  }

  async delete(id: string): Promise<boolean> {
    return await this.db.delete(id);
  }

  async findByCreator(creatorId: string): Promise<Assignment[]> {
    return await this.db.find(assignment => assignment.createdBy === creatorId);
  }

  async findByType(type: AssignmentType): Promise<Assignment[]> {
    return await this.db.find(assignment => assignment.type === type);
  }

  async findByStatus(status: AssignmentStatus): Promise<Assignment[]> {
    return await this.db.find(assignment => assignment.status === status);
  }

  async findAll(): Promise<Assignment[]> {
    return await this.db.findAll();
  }

  async updateStatus(id: string, status: AssignmentStatus): Promise<Assignment | null> {
    const assignment = await this.findById(id);
    if (!assignment) {
      return null;
    }

    const updatedAssignment = {
      ...assignment,
      status,
      updatedAt: new Date(),
    };

    return await this.db.save(updatedAssignment);
  }
}
