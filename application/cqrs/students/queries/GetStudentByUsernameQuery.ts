import { Query } from "../../core/Query.ts";
import { Student } from "../../../../domain/models/Student.ts";

/**
 * Query to get a student by username
 */
export class GetStudentByUsernameQuery implements Query<Student | null> {
  readonly queryType = "GetStudentByUsername";

  constructor(
    public readonly username: string
  ) {}
}
