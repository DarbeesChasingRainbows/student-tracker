// Core CQRS interfaces and classes
export type { Command } from "./core/Command.ts";
export type { Query } from "./core/Query.ts";
export type { CommandHandler } from "./core/CommandHandler.ts";
export type { QueryHandler } from "./core/QueryHandler.ts";
export type { CommandDispatcher } from "./core/CommandDispatcher.ts";
export type { QueryDispatcher } from "./core/QueryDispatcher.ts";

// Infrastructure implementations
export { SimpleCommandDispatcher } from "./infrastructure/SimpleCommandDispatcher.ts";
export { SimpleQueryDispatcher } from "./infrastructure/SimpleQueryDispatcher.ts";

// CQRS Registry and Service
export { CqrsRegistry } from "./CqrsRegistry.ts";
export { CqrsService } from "./CqrsService.ts";

// Student Commands
export { CreateStudentCommand } from "./students/commands/CreateStudentCommand.ts";
export { UpdateStudentCommand } from "./students/commands/UpdateStudentCommand.ts";
export { DeleteStudentCommand } from "./students/commands/DeleteStudentCommand.ts";

// Student Queries
export { GetStudentByIdQuery } from "./students/queries/GetStudentByIdQuery.ts";
export { GetAllStudentsQuery } from "./students/queries/GetAllStudentsQuery.ts";
export { GetStudentByUsernameQuery } from "./students/queries/GetStudentByUsernameQuery.ts";
