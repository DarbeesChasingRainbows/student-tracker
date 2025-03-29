import { QueryHandler } from "../../core/QueryHandler.ts";
import { GetAllAssignmentsQuery } from "./GetAllAssignmentsQuery.ts";
import { Assignment } from "../../../../domain/models/Assignment.ts";
import { AssignmentRepository } from "../../../../ports/repositories/AssignmentRepository.ts";

/**
 * Handler for the GetAllAssignmentsQuery
 */
export class GetAllAssignmentsQueryHandler implements QueryHandler<GetAllAssignmentsQuery, Assignment[]> {
  constructor(private assignmentRepository: AssignmentRepository) {}

  /**
   * Execute the query to get all assignments
   * @param query The query to get all assignments
   * @returns Array of all assignments
   */
  async execute(_query: GetAllAssignmentsQuery): Promise<Assignment[]> {
    return await this.assignmentRepository.findAll();
  }
}
