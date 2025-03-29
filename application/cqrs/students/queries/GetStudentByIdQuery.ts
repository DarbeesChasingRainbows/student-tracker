import { Query } from "../../core/Query.ts";
import { Student } from "../../../../domain/models/Student.ts";

/**
 * Query to get a student by ID
 */
export class GetStudentByIdQuery implements Query<Student | null> {
  readonly queryType = "GetStudentById";

  constructor(
    public readonly id: string
  ) {}
}
