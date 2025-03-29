import { Query } from "../../core/Query.ts";
import { Student } from "../../../../domain/models/Student.ts";

/**
 * Query to get all students
 */
export class GetAllStudentsQuery implements Query<Student[]> {
  readonly queryType = "GetAllStudents";

  constructor() {}
}
