import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { z } from "zod";
import { createStudent } from "../../../domain/models/Student.ts";
import { studentRepository } from "../../../infrastructure/repositories/index.ts";

// Student creation form schema
const StudentSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  // Email is now optional for homeschoolers
  email: z.string().email("Please enter a valid email address").optional(),
  grade: z.string().min(1, "Please select a grade"),
  // Guardian information is now optional
  guardianName: z.string().min(2, "Guardian name must be at least 2 characters").optional(),
  guardianEmail: z.string().email("Please enter a valid guardian email address").optional(),
  guardianPhone: z.string().min(10, "Please enter a valid phone number").optional(),
  notes: z.string().optional(),
  pinEnabled: z.boolean().optional(),
  pin: z.string().optional()
    .refine(val => !val || val.length === 4, "PIN must be 4 digits")
    .refine(val => !val || /^\d+$/.test(val), "PIN must contain only digits"),
});

type StudentForm = z.infer<typeof StudentSchema>;

// Define the grades for selection
const grades = ["Pre-Kindergarten", "Kindergarten", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"];

interface NewStudentData {
  formErrors?: Record<string, string>;
  formValues?: Partial<StudentForm>;
  success?: boolean;
}

export const handler: Handlers<NewStudentData> = {
  GET(_, ctx) {
    // Initialize with empty form data
    return ctx.render({
      formErrors: {},
      formValues: {
        firstName: "",
        lastName: "",
        email: "",
        grade: "",
        guardianName: "",
        guardianEmail: "",
        guardianPhone: "",
        notes: "",
        pinEnabled: false,
        pin: "",
      },
    });
  },
  
  async POST(req, ctx) {
    const formData = await req.formData();
    
    // Extract form values
    const firstName = formData.get("firstName")?.toString() || "";
    const lastName = formData.get("lastName")?.toString() || "";
    const email = formData.get("email")?.toString() || "";
    const grade = formData.get("grade")?.toString() || "";
    const guardianName = formData.get("guardianName")?.toString() || "";
    const guardianEmail = formData.get("guardianEmail")?.toString() || "";
    const guardianPhone = formData.get("guardianPhone")?.toString() || "";
    const notes = formData.get("notes")?.toString() || "";
    const pinEnabled = formData.get("pinEnabled") === "on";
    const pin = formData.get("pin")?.toString() || "";
    
    // Prepare form values for validation
    const formValues = {
      firstName,
      lastName,
      email,
      grade,
      guardianName,
      guardianEmail,
      guardianPhone,
      notes,
      pinEnabled,
      pin: pinEnabled ? pin : "",
    };
    
    // Validate form data
    const result = StudentSchema.safeParse(formValues);
    
    if (!result.success) {
      // Return validation errors
      const errors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      
      return ctx.render({
        formErrors: errors,
        formValues,
      });
    }
    
    try {
      // Create a username from first name and last name (lowercase, no spaces)
      const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`.replace(/\s+/g, "");
      
      // Create a student object
      const studentData = createStudent(
        firstName,
        lastName,
        grade,
        username,
        "default-avatar", // Default avatar ID
        {
          email: email || undefined,
          pin: pinEnabled ? pin : undefined,
          guardianName: guardianName || undefined,
          guardianEmail: guardianEmail || undefined,
          guardianPhone: guardianPhone || undefined,
          notes: notes || undefined,
        }
      );
      
      // Save the student to the repository
      await studentRepository.save(studentData);
      
      // Redirect to the students list with a success message
      return new Response("", {
        status: 303,
        headers: { Location: "/admin/students?success=created" },
      });
    } catch (error) {
      console.error("Error creating student:", error);
      
      // Return with a generic error
      return ctx.render({
        formErrors: { _form: "An error occurred while creating the student. Please try again." },
        formValues,
      });
    }
  },
};

// Guardian Information Form Component
function GuardianInfoForm({ 
  formValues, 
  formErrors 
}: { 
  formValues: Partial<StudentForm>; 
  formErrors: Record<string, string>; 
}) {
  return (
    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-xl font-bold text-gray-800 mb-4">Guardian Information (Optional)</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label for="guardianName" class="block text-sm font-medium text-gray-700 mb-1">
            Guardian Name
          </label>
          <input
            type="text"
            id="guardianName"
            name="guardianName"
            value={formValues.guardianName}
            class={`w-full px-3 py-2 border rounded-md ${
              formErrors.guardianName ? "border-red-500" : "border-gray-300"
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          {formErrors.guardianName && (
            <p class="mt-1 text-sm text-red-600">{formErrors.guardianName}</p>
          )}
        </div>
        
        <div>
          <label for="guardianEmail" class="block text-sm font-medium text-gray-700 mb-1">
            Guardian Email
          </label>
          <input
            type="email"
            id="guardianEmail"
            name="guardianEmail"
            value={formValues.guardianEmail}
            class={`w-full px-3 py-2 border rounded-md ${
              formErrors.guardianEmail ? "border-red-500" : "border-gray-300"
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          {formErrors.guardianEmail && (
            <p class="mt-1 text-sm text-red-600">{formErrors.guardianEmail}</p>
          )}
        </div>
        
        <div>
          <label for="guardianPhone" class="block text-sm font-medium text-gray-700 mb-1">
            Guardian Phone
          </label>
          <input
            type="tel"
            id="guardianPhone"
            name="guardianPhone"
            value={formValues.guardianPhone}
            placeholder="(123) 456-7890"
            class={`w-full px-3 py-2 border rounded-md ${
              formErrors.guardianPhone ? "border-red-500" : "border-gray-300"
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          {formErrors.guardianPhone && (
            <p class="mt-1 text-sm text-red-600">{formErrors.guardianPhone}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NewStudent({ data }: PageProps<NewStudentData>) {
  const { formErrors = {}, formValues = {} } = data;
  
  return (
    <div class="max-w-3xl mx-auto p-4">
      <Head>
        <title>Add New Student</title>
      </Head>
      
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-800">Add New Student</h1>
        <p class="text-gray-600">Create a new student record</p>
      </div>
      
      <form method="POST" class="space-y-6">
        {formErrors._form && (
          <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span class="block sm:inline">{formErrors._form}</span>
          </div>
        )}
        
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-bold text-gray-800 mb-4">Student Information</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="firstName" class="block text-sm font-medium text-gray-700 mb-1">
                First Name <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formValues.firstName}
                class={`w-full px-3 py-2 border rounded-md ${
                  formErrors.firstName ? "border-red-500" : "border-gray-300"
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                required
              />
              {formErrors.firstName && (
                <p class="mt-1 text-sm text-red-600">{formErrors.firstName}</p>
              )}
            </div>
            
            <div>
              <label for="lastName" class="block text-sm font-medium text-gray-700 mb-1">
                Last Name <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formValues.lastName}
                class={`w-full px-3 py-2 border rounded-md ${
                  formErrors.lastName ? "border-red-500" : "border-gray-300"
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                required
              />
              {formErrors.lastName && (
                <p class="mt-1 text-sm text-red-600">{formErrors.lastName}</p>
              )}
            </div>
            
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formValues.email}
                class={`w-full px-3 py-2 border rounded-md ${
                  formErrors.email ? "border-red-500" : "border-gray-300"
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {formErrors.email && (
                <p class="mt-1 text-sm text-red-600">{formErrors.email}</p>
              )}
            </div>
            
            <div>
              <label for="grade" class="block text-sm font-medium text-gray-700 mb-1">
                Grade <span class="text-red-500">*</span>
              </label>
              <select
                id="grade"
                name="grade"
                value={formValues.grade}
                class={`w-full px-3 py-2 border rounded-md ${
                  formErrors.grade ? "border-red-500" : "border-gray-300"
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                required
              >
                <option value="">Select Grade</option>
                {grades.map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
              {formErrors.grade && (
                <p class="mt-1 text-sm text-red-600">{formErrors.grade}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Use the GuardianInfoForm component */}
        <GuardianInfoForm formValues={formValues} formErrors={formErrors} />
        
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-bold text-gray-800 mb-4">Additional Information</h2>
          
          <div class="space-y-6">
            <div>
              <label for="notes" class="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={formValues.notes}
                class={`w-full px-3 py-2 border rounded-md ${
                  formErrors.notes ? "border-red-500" : "border-gray-300"
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Any additional information about the student..."
              ></textarea>
              {formErrors.notes && (
                <p class="mt-1 text-sm text-red-600">{formErrors.notes}</p>
              )}
            </div>
            
            <div>
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="font-medium text-gray-800">PIN Access</h3>
                  <p class="text-sm text-gray-600">Enable PIN-based login for this student</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="pinEnabled" 
                    class="sr-only peer" 
                    checked={formValues.pinEnabled}
                  />
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              {formValues.pinEnabled && (
                <div class="mt-3">
                  <label for="pin" class="block text-sm font-medium text-gray-700 mb-1">
                    4-Digit PIN
                  </label>
                  <input
                    type="number"
                    id="pin"
                    name="pin"
                    value={formValues.pin}
                    maxLength={4}
                    pattern="[0-9]{4}"
                    placeholder="Enter 4-digit PIN"
                    class={`w-full px-3 py-2 border rounded-md ${
                      formErrors.pin ? "border-red-500" : "border-gray-300"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  <p class="mt-1 text-xs text-gray-500">
                    The student will use this PIN to log in to their account
                  </p>
                  {formErrors.pin && (
                    <p class="mt-1 text-sm text-red-600">{formErrors.pin}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div class="flex justify-end space-x-3">
          <a 
            href="/admin/students" 
            class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </a>
          <button
            type="submit"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
          >
            Create Student
          </button>
        </div>
      </form>
    </div>
  );
}
