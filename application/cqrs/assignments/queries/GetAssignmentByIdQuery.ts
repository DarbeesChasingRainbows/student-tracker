import { Query } from "../../core/Query.ts";
import { Assignment } from "../../../../domain/models/Assignment.ts";

/**
 * Query to get an assignment by ID
 */
export class GetAssignmentByIdQuery implements Query<Assignment | null> {
  readonly queryType = "GetAssignmentById";

  constructor(
    public readonly id: string
  ) {}
}
