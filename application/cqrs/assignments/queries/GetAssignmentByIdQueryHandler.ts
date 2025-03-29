import { QueryHandler } from "../../core/QueryHandler.ts";
import { GetAssignmentByIdQuery } from "./GetAssignmentByIdQuery.ts";
import { Assignment } from "../../../../domain/models/Assignment.ts";
import { AssignmentRepository } from "../../../../ports/repositories/AssignmentRepository.ts";

/**
 * Handler for the GetAssignmentByIdQuery
 */
export class GetAssignmentByIdQueryHandler implements QueryHandler<GetAssignmentByIdQuery, Assignment | null> {
  constructor(private assignmentRepository: AssignmentRepository) {}

  /**
   * Execute the query to get an assignment by ID
   * @param query The query containing the assignment ID
   * @returns The assignment if found, null otherwise
   */
  async execute(query: GetAssignmentByIdQuery): Promise<Assignment | null> {
    return await this.assignmentRepository.findById(query.id);
  }
}
