import { QueryHandler } from "../../core/QueryHandler.ts";
import { GetAllStudentsQuery } from "./GetAllStudentsQuery.ts";
import { Student } from "../../../../domain/models/Student.ts";
import { StudentRepository } from "../../../../ports/repositories/StudentRepository.ts";

/**
 * Handler for the GetAllStudentsQuery
 */
export class GetAllStudentsQueryHandler implements QueryHandler<GetAllStudentsQuery, Student[]> {
  constructor(private studentRepository: StudentRepository) {}

  /**
   * Execute the query to get all students
   * @param query The query to get all students
   * @returns Array of all students
   */
  async execute(_query: GetAllStudentsQuery): Promise<Student[]> {
    return await this.studentRepository.findAll();
  }
}
