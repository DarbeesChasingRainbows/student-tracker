import { Query } from "../../core/Query.ts";
import { Assignment } from "../../../../domain/models/Assignment.ts";

/**
 * Query to get all assignments
 */
export class GetAllAssignmentsQuery implements Query<Assignment[]> {
  readonly queryType = "GetAllAssignments";

  constructor() {}
}
