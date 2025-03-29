import { Student, StudentSchema } from "../../domain/models/Student.ts";
import { StudentRepository } from "../../ports/repositories/StudentRepository.ts";

/**
 * File-based implementation of StudentRepository
 * Stores student data in JSON files for persistence
 */
export class FileStudentRepository implements StudentRepository {
  private readonly dataDir: string;
  private readonly studentsDir: string;
  private students: Map<string, Student> = new Map();
  private initialized = false;

  constructor(dataDir = "./data") {
    this.dataDir = dataDir;
    this.studentsDir = `${dataDir}/students`;
  }

  /**
   * Initialize the repository by creating necessary directories
   * and loading existing data
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return;

    // Ensure directories exist
    try {
      await Deno.mkdir(this.studentsDir, { recursive: true });
    } catch (error) {
      if (!(error instanceof Deno.errors.AlreadyExists)) {
        throw error;
      }
    }

    // Load existing students
    await this.loadStudents();

    this.initialized = true;
  }

  /**
   * Load all student data from files
   */
  private async loadStudents(): Promise<void> {
    try {
      for await (const entry of Deno.readDir(this.studentsDir)) {
        if (entry.isFile && entry.name.endsWith(".json")) {
          const fileContent = await Deno.readTextFile(`${this.studentsDir}/${entry.name}`);
          const studentData = JSON.parse(fileContent);
          
          // Parse dates
          studentData.createdAt = new Date(studentData.createdAt);
          studentData.updatedAt = new Date(studentData.updatedAt);
          
          // Validate with schema
          const result = StudentSchema.safeParse(studentData);
          if (result.success) {
            this.students.set(result.data.id, result.data);
          } else {
            console.error(`Invalid student data in file ${entry.name}:`, result.error);
          }
        }
      }
    } catch (error) {
      console.error("Error loading students:", error);
    }
  }

  /**
   * Save a student to file
   */
  private async saveStudentToFile(student: Student): Promise<void> {
    const filePath = `${this.studentsDir}/${student.id}.json`;
    await Deno.writeTextFile(filePath, JSON.stringify(student, null, 2));
  }

  /**
   * Find a student by ID
   */
  async findById(id: string): Promise<Student | null> {
    await this.initialize();
    return this.students.get(id) || null;
  }

  /**
   * Find a student by username
   */
  async findByUsername(username: string): Promise<Student | null> {
    await this.initialize();
    for (const student of this.students.values()) {
      if (student.username === username) {
        return student;
      }
    }
    return null;
  }

  /**
   * Save a new student or update an existing one
   */
  async save(studentData: Omit<Student, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<Student> {
    await this.initialize();

    const now = new Date();
    let student: Student;

    if (studentData.id && this.students.has(studentData.id)) {
      // Update existing student
      const existingStudent = this.students.get(studentData.id)!;
      student = {
        ...existingStudent,
        ...studentData,
        updatedAt: now,
      };
    } else {
      // Create new student
      // Generate a random UUID
      const id = crypto.randomUUID();
      student = {
        ...studentData,
        id: studentData.id || id,
        createdAt: now,
        updatedAt: now,
      } as Student;
    }

    // Save to memory and file
    this.students.set(student.id, student);
    await this.saveStudentToFile(student);

    return student;
  }

  /**
   * Delete a student by ID
   */
  async delete(id: string): Promise<boolean> {
    await this.initialize();

    if (!this.students.has(id)) {
      return false;
    }

    // Remove from memory
    this.students.delete(id);

    // Remove file
    try {
      const filePath = `${this.studentsDir}/${id}.json`;
      await Deno.remove(filePath);
      return true;
    } catch (error) {
      console.error(`Error deleting student ${id}:`, error);
      return false;
    }
  }

  /**
   * List all students
   */
  async findAll(): Promise<Student[]> {
    await this.initialize();
    return Array.from(this.students.values());
  }

  /**
   * Authenticate a student using username and PIN
   */
  async authenticate(username: string, pin?: string): Promise<Student | null> {
    await this.initialize();

    const student = await this.findByUsername(username);
    
    if (!student) {
      return null;
    }

    // If student has PIN, it must match
    if (student.pin && pin !== student.pin) {
      return null;
    }

    return student;
  }
}
