import { QueryHandler } from "../../core/QueryHandler.ts";
import { GetStudentByIdQuery } from "./GetStudentByIdQuery.ts";
import { Student } from "../../../../domain/models/Student.ts";
import { StudentRepository } from "../../../../ports/repositories/StudentRepository.ts";

/**
 * Handler for the GetStudentByIdQuery
 */
export class GetStudentByIdQueryHandler implements QueryHandler<GetStudentByIdQuery, Student | null> {
  constructor(private studentRepository: StudentRepository) {}

  /**
   * Execute the query to get a student by ID
   * @param query The query containing the student ID
   * @returns The student if found, null otherwise
   */
  async execute(query: GetStudentByIdQuery): Promise<Student | null> {
    return await this.studentRepository.findById(query.id);
  }
}
