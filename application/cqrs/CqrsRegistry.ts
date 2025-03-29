import { CommandDispatcher } from "./core/CommandDispatcher.ts";
import { QueryDispatcher } from "./core/QueryDispatcher.ts";
import { SimpleCommandDispatcher } from "./infrastructure/SimpleCommandDispatcher.ts";
import { SimpleQueryDispatcher } from "./infrastructure/SimpleQueryDispatcher.ts";

// Student Commands and Handlers
import { CreateStudentCommand } from "./students/commands/CreateStudentCommand.ts";
import { CreateStudentCommandHandler } from "./students/commands/CreateStudentCommandHandler.ts";
import { UpdateStudentCommand } from "./students/commands/UpdateStudentCommand.ts";
import { UpdateStudentCommandHandler } from "./students/commands/UpdateStudentCommandHandler.ts";
import { DeleteStudentCommand } from "./students/commands/DeleteStudentCommand.ts";
import { DeleteStudentCommandHandler } from "./students/commands/DeleteStudentCommandHandler.ts";

// Student Queries and Handlers
import { GetStudentByIdQuery } from "./students/queries/GetStudentByIdQuery.ts";
import { GetStudentByIdQueryHandler } from "./students/queries/GetStudentByIdQueryHandler.ts";
import { GetAllStudentsQuery } from "./students/queries/GetAllStudentsQuery.ts";
import { GetAllStudentsQueryHandler } from "./students/queries/GetAllStudentsQueryHandler.ts";
import { GetStudentByUsernameQuery } from "./students/queries/GetStudentByUsernameQuery.ts";
import { GetStudentByUsernameQueryHandler } from "./students/queries/GetStudentByUsernameQueryHandler.ts";

// Assignment Commands and Handlers
import { CreateAssignmentCommand } from "./assignments/commands/CreateAssignmentCommand.ts";
import { CreateAssignmentCommandHandler } from "./assignments/commands/CreateAssignmentCommandHandler.ts";
import { UpdateAssignmentCommand } from "./assignments/commands/UpdateAssignmentCommand.ts";
import { UpdateAssignmentCommandHandler } from "./assignments/commands/UpdateAssignmentCommandHandler.ts";
import { DeleteAssignmentCommand } from "./assignments/commands/DeleteAssignmentCommand.ts";
import { DeleteAssignmentCommandHandler } from "./assignments/commands/DeleteAssignmentCommandHandler.ts";

// Assignment Queries and Handlers
import { GetAssignmentByIdQuery } from "./assignments/queries/GetAssignmentByIdQuery.ts";
import { GetAssignmentByIdQueryHandler } from "./assignments/queries/GetAssignmentByIdQueryHandler.ts";
import { GetAllAssignmentsQuery } from "./assignments/queries/GetAllAssignmentsQuery.ts";
import { GetAllAssignmentsQueryHandler } from "./assignments/queries/GetAllAssignmentsQueryHandler.ts";

// Repositories
import { studentRepository, assignmentRepository } from "../../infrastructure/repositories/index.ts";

/**
 * Registry for all CQRS command and query handlers
 * This class is responsible for registering all handlers with the dispatchers
 */
export class CqrsRegistry {
  private static commandDispatcher: CommandDispatcher = new SimpleCommandDispatcher();
  private static queryDispatcher: QueryDispatcher = new SimpleQueryDispatcher();
  private static initialized = false;

  /**
   * Initialize the CQRS registry by registering all handlers
   */
  static initialize(): void {
    if (this.initialized) return;

    // Register Student Command Handlers
    this.registerStudentCommandHandlers();

    // Register Student Query Handlers
    this.registerStudentQueryHandlers();
    
    // Register Assignment Command Handlers
    this.registerAssignmentCommandHandlers();
    
    // Register Assignment Query Handlers
    this.registerAssignmentQueryHandlers();

    this.initialized = true;
  }

  /**
   * Register all student command handlers
   */
  private static registerStudentCommandHandlers(): void {
    // Create Student
    this.commandDispatcher.registerHandler(
      CreateStudentCommand.prototype.commandType,
      new CreateStudentCommandHandler(studentRepository)
    );

    // Update Student
    this.commandDispatcher.registerHandler(
      UpdateStudentCommand.prototype.commandType,
      new UpdateStudentCommandHandler(studentRepository)
    );

    // Delete Student
    this.commandDispatcher.registerHandler(
      DeleteStudentCommand.prototype.commandType,
      new DeleteStudentCommandHandler(studentRepository)
    );
  }

  /**
   * Register all student query handlers
   */
  private static registerStudentQueryHandlers(): void {
    // Get Student by ID
    this.queryDispatcher.registerHandler(
      GetStudentByIdQuery.prototype.queryType,
      new GetStudentByIdQueryHandler(studentRepository)
    );

    // Get All Students
    this.queryDispatcher.registerHandler(
      GetAllStudentsQuery.prototype.queryType,
      new GetAllStudentsQueryHandler(studentRepository)
    );

    // Get Student by Username
    this.queryDispatcher.registerHandler(
      GetStudentByUsernameQuery.prototype.queryType,
      new GetStudentByUsernameQueryHandler(studentRepository)
    );
  }
  
  /**
   * Register all assignment command handlers
   */
  private static registerAssignmentCommandHandlers(): void {
    // Create Assignment
    this.commandDispatcher.registerHandler(
      CreateAssignmentCommand.prototype.commandType,
      new CreateAssignmentCommandHandler(assignmentRepository)
    );

    // Update Assignment
    this.commandDispatcher.registerHandler(
      UpdateAssignmentCommand.prototype.commandType,
      new UpdateAssignmentCommandHandler(assignmentRepository)
    );

    // Delete Assignment
    this.commandDispatcher.registerHandler(
      DeleteAssignmentCommand.prototype.commandType,
      new DeleteAssignmentCommandHandler(assignmentRepository)
    );
  }

  /**
   * Register all assignment query handlers
   */
  private static registerAssignmentQueryHandlers(): void {
    // Get Assignment by ID
    this.queryDispatcher.registerHandler(
      GetAssignmentByIdQuery.prototype.queryType,
      new GetAssignmentByIdQueryHandler(assignmentRepository)
    );

    // Get All Assignments
    this.queryDispatcher.registerHandler(
      GetAllAssignmentsQuery.prototype.queryType,
      new GetAllAssignmentsQueryHandler(assignmentRepository)
    );
  }

  /**
   * Get the command dispatcher
   */
  static getCommandDispatcher(): CommandDispatcher {
    if (!this.initialized) {
      this.initialize();
    }
    return this.commandDispatcher;
  }

  /**
   * Get the query dispatcher
   */
  static getQueryDispatcher(): QueryDispatcher {
    if (!this.initialized) {
      this.initialize();
    }
    return this.queryDispatcher;
  }
}
