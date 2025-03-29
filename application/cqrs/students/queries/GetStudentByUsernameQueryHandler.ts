import { QueryHandler } from "../../core/QueryHandler.ts";
import { GetStudentByUsernameQuery } from "./GetStudentByUsernameQuery.ts";
import { Student } from "../../../../domain/models/Student.ts";
import { StudentRepository } from "../../../../ports/repositories/StudentRepository.ts";

/**
 * Handler for the GetStudentByUsernameQuery
 */
export class GetStudentByUsernameQueryHandler implements QueryHandler<GetStudentByUsernameQuery, Student | null> {
  constructor(private studentRepository: StudentRepository) {}

  /**
   * Execute the query to get a student by username
   * @param query The query containing the username
   * @returns The student if found, null otherwise
   */
  async execute(query: GetStudentByUsernameQuery): Promise<Student | null> {
    return await this.studentRepository.findByUsername(query.username);
  }
}
