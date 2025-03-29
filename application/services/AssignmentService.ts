import { Assignment, AssignmentStatus, AssignmentType } from "../../domain/models/Assignment.ts";
import { Question } from "../../domain/models/Question.ts";
import { StudentAssignment, StudentAssignmentStatus, createStudentAssignment } from "../../domain/models/StudentAssignment.ts";
import { StudentAnswer } from "../../domain/models/StudentAnswer.ts";
import { AssignmentRepository } from "../../ports/repositories/AssignmentRepository.ts";
import { QuestionRepository } from "../../ports/repositories/QuestionRepository.ts";
import { StudentAssignmentRepository } from "../../ports/repositories/StudentAssignmentRepository.ts";
import { StudentAnswerRepository } from "../../ports/repositories/StudentAnswerRepository.ts";

/**
 * Service for handling assignment-related business logic
 */
export class AssignmentService {
  constructor(
    private assignmentRepo: AssignmentRepository,
    private questionRepo: QuestionRepository,
    private studentAssignmentRepo: StudentAssignmentRepository,
    private studentAnswerRepo: StudentAnswerRepository,
  ) {}

  /**
   * Create a new assignment
   */
  async createAssignment(assignment: Omit<Assignment, "id" | "createdAt" | "updatedAt">): Promise<Assignment> {
    return await this.assignmentRepo.save(assignment);
  }

  /**
   * Assign an assignment to a student
   */
  async assignToStudent(assignmentId: string, studentId: string): Promise<StudentAssignment> {
    const assignment = await this.assignmentRepo.findById(assignmentId);
    if (!assignment) {
      throw new Error(`Assignment not found: ${assignmentId}`);
    }

    if (assignment.status !== AssignmentStatus.ASSIGNED) {
      // Update assignment status to assigned if it's not already
      await this.assignmentRepo.updateStatus(assignmentId, AssignmentStatus.ASSIGNED);
    }

    const studentAssignment = createStudentAssignment(studentId, assignmentId);
    return await this.studentAssignmentRepo.save(studentAssignment);
  }

  /**
   * Grade a student assignment
   */
  async gradeStudentAssignment(studentAssignmentId: string): Promise<StudentAssignment> {
    const studentAssignment = await this.studentAssignmentRepo.findById(studentAssignmentId);
    if (!studentAssignment) {
      throw new Error(`Student assignment not found: ${studentAssignmentId}`);
    }

    if (studentAssignment.status !== StudentAssignmentStatus.SUBMITTED) {
      throw new Error("Cannot grade an assignment that hasn't been submitted");
    }

    const answers = await this.studentAnswerRepo.findByStudentAssignmentId(studentAssignmentId);
    const assignment = await this.assignmentRepo.findById(studentAssignment.assignmentId);
    
    if (!assignment) {
      throw new Error(`Assignment not found: ${studentAssignment.assignmentId}`);
    }

    // Calculate the score based on the percentage of correct answers
    // Note: Essay questions might need manual grading and may not have isCorrect set
    const gradableAnswers = answers.filter(a => a.isCorrect !== undefined);
    const correctAnswers = gradableAnswers.filter(a => a.isCorrect === true);
    
    const score = gradableAnswers.length > 0 
      ? (correctAnswers.length / gradableAnswers.length) * 100 
      : 0;

    // Update the student assignment with the score and status
    const updatedAssignment: StudentAssignment = {
      ...studentAssignment,
      score,
      status: StudentAssignmentStatus.GRADED,
      gradedAt: new Date(),
      updatedAt: new Date(),
    };

    // Check if an adaptive reassignment is needed
    const needsAdaptiveReassignment = 
      score < assignment.settings.adaptiveReassignThreshold &&
      !studentAssignment.isAdaptive; // Only create adaptive assignments for original assignments

    const savedAssignment = await this.studentAssignmentRepo.save(updatedAssignment);

    if (needsAdaptiveReassignment) {
      await this.createAdaptiveReassignment(savedAssignment, assignment, answers);
    }

    return savedAssignment;
  }

  /**
   * Create an adaptive reassignment focusing on questions the student got wrong
   */
  private async createAdaptiveReassignment(
    originalStudentAssignment: StudentAssignment,
    originalAssignment: Assignment,
    answers: StudentAnswer[],
  ): Promise<StudentAssignment> {
    // Get the incorrect answers
    const incorrectAnswers = answers.filter(a => a.isCorrect === false);
    
    if (incorrectAnswers.length === 0) {
      // No incorrect answers, shouldn't happen if we're creating an adaptive assignment
      return originalStudentAssignment;
    }

    // Get the questions for all incorrect answers
    const incorrectQuestionIds = incorrectAnswers.map(a => a.questionId);
    const incorrectQuestions = await Promise.all(
      incorrectQuestionIds.map(id => this.questionRepo.findById(id))
    );
    
    // Get all the tags from incorrect questions to find similar questions
    const tags = incorrectQuestions
      .filter((q): q is Question => q !== null)
      .flatMap(q => q.tags);
    
    // Get additional questions with the same tags
    const adaptiveQuestions = await this.questionRepo.findByTags(tags);
    
    // Filter out questions that were in the original assignment
    const newQuestions = adaptiveQuestions.filter(
      q => !originalAssignment.questionIds.includes(q.id)
    );
    
    // Create a new adaptive assignment
    const adaptiveAssignment: Omit<Assignment, "id" | "createdAt" | "updatedAt"> = {
      title: `Adaptive: ${originalAssignment.title}`,
      description: `This assignment focuses on areas you need to improve from ${originalAssignment.title}`,
      type: originalAssignment.type,
      questionIds: [
        ...incorrectQuestionIds, // Include the questions they got wrong
        ...newQuestions.slice(0, 5).map(q => q.id), // Add up to 5 new questions on similar topics
      ],
      createdBy: originalAssignment.createdBy,
      status: AssignmentStatus.ASSIGNED,
      settings: originalAssignment.settings,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in a week
    };
    
    // Save the new adaptive assignment
    const savedAdaptiveAssignment = await this.assignmentRepo.save(adaptiveAssignment);
    
    // Assign it to the student
    const adaptiveStudentAssignment = createStudentAssignment(
      originalStudentAssignment.studentId,
      savedAdaptiveAssignment.id,
      true, // Mark as adaptive
      originalStudentAssignment.assignmentId // Reference to original assignment
    );
    
    return await this.studentAssignmentRepo.save(adaptiveStudentAssignment);
  }

  /**
   * Start a student assignment (change status to in progress)
   */
  async startStudentAssignment(studentAssignmentId: string): Promise<StudentAssignment> {
    const studentAssignment = await this.studentAssignmentRepo.findById(studentAssignmentId);
    if (!studentAssignment) {
      throw new Error(`Student assignment not found: ${studentAssignmentId}`);
    }

    if (studentAssignment.status !== StudentAssignmentStatus.ASSIGNED) {
      throw new Error("Can only start assignments that are in 'assigned' status");
    }

    const updatedAssignment: StudentAssignment = {
      ...studentAssignment,
      status: StudentAssignmentStatus.IN_PROGRESS,
      startedAt: new Date(),
      updatedAt: new Date(),
    };

    return await this.studentAssignmentRepo.save(updatedAssignment);
  }

  /**
   * Submit a student assignment
   */
  async submitStudentAssignment(studentAssignmentId: string): Promise<StudentAssignment> {
    const studentAssignment = await this.studentAssignmentRepo.findById(studentAssignmentId);
    if (!studentAssignment) {
      throw new Error(`Student assignment not found: ${studentAssignmentId}`);
    }

    if (studentAssignment.status !== StudentAssignmentStatus.IN_PROGRESS) {
      throw new Error("Can only submit assignments that are in progress");
    }

    const updatedAssignment: StudentAssignment = {
      ...studentAssignment,
      status: StudentAssignmentStatus.SUBMITTED,
      submittedAt: new Date(),
      updatedAt: new Date(),
      attempts: studentAssignment.attempts + 1,
    };

    return await this.studentAssignmentRepo.save(updatedAssignment);
  }

  /**
   * Get all assignments for a student
   */
  async getStudentAssignments(studentId: string): Promise<StudentAssignment[]> {
    return await this.studentAssignmentRepo.findByStudentId(studentId);
  }

  /**
   * Get all assignments created by an admin/teacher
   */
  async getAssignmentsByCreator(creatorId: string): Promise<Assignment[]> {
    return await this.assignmentRepo.findByCreator(creatorId);
  }

  /**
   * Get assignments by type
   */
  async getAssignmentsByType(type: AssignmentType): Promise<Assignment[]> {
    return await this.assignmentRepo.findByType(type);
  }
}
