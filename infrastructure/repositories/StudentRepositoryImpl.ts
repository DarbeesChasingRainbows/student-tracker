import { Student } from "../../domain/models/Student.ts";
import { StudentRepository } from "../../ports/repositories/StudentRepository.ts";
import { Database } from "../database/db.ts";

export class StudentRepositoryImpl implements StudentRepository {
  private db = Database.getInstance().getRepository<Student>("students");

  async findById(id: string): Promise<Student | null> {
    return await this.db.findById(id);
  }

  async findByUsername(username: string): Promise<Student | null> {
    return await this.db.findOne(student => student.username === username);
  }

  async save(student: Omit<Student, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<Student> {
    return await this.db.save(student);
  }

  async delete(id: string): Promise<boolean> {
    return await this.db.delete(id);
  }

  async findAll(): Promise<Student[]> {
    return await this.db.findAll();
  }

  async authenticate(username: string, pin?: string): Promise<Student | null> {
    const student = await this.findByUsername(username);
    
    if (!student) {
      return null;
    }
    
    // If student has a PIN set, validate it
    if (student.pin && pin !== student.pin) {
      return null;
    }
    
    return student;
  }
}
