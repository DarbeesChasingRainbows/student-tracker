import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { z } from "zod";

// Student login form schema
const StudentLoginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  pin: z.string().length(4, "PIN must be exactly 4 digits").optional(),
});

type StudentLoginForm = z.infer<typeof StudentLoginSchema>;

// Available avatars
const avatars = [
  { id: "avatar1", src: "/avatars/avatar1.svg", alt: "Student avatar 1" },
  { id: "avatar2", src: "/avatars/avatar2.svg", alt: "Student avatar 2" },
  { id: "avatar3", src: "/avatars/avatar3.svg", alt: "Student avatar 3" },
  { id: "avatar4", src: "/avatars/avatar4.svg", alt: "Student avatar 4" },
  { id: "avatar5", src: "/avatars/avatar5.svg", alt: "Student avatar 5" },
  { id: "avatar6", src: "/avatars/avatar6.svg", alt: "Student avatar 6" },
];

interface StudentPortalData {
  formErrors?: Record<string, string>;
  formValues?: StudentLoginForm;
}

export const handler: Handlers<StudentPortalData> = {
  async POST(req, ctx) {
    const formData = await req.formData();
    const username = formData.get("username")?.toString() || "";
    const pin = formData.get("pin")?.toString() || undefined;
    const avatarId = formData.get("avatarId")?.toString();

    // Validate form data
    const result = StudentLoginSchema.safeParse({ username, pin });
    
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
        formValues: { username, pin },
      });
    }

    // In a real app, we would authenticate the student here
    // For now, redirect to the student dashboard
    const redirectUrl = avatarId 
      ? `/student/dashboard?username=${encodeURIComponent(username)}&avatarId=${encodeURIComponent(avatarId)}`
      : `/student/select-avatar?username=${encodeURIComponent(username)}`;
    
    return new Response("", {
      status: 303,
      headers: { Location: redirectUrl },
    });
  },
};

export default function StudentPortal({ data }: PageProps<StudentPortalData>) {
  const { formErrors = {}, formValues = { username: "", pin: "" } } = data || {};
  
  return (
    <div class="max-w-md mx-auto">
      <Head>
        <title>Student Portal - Login</title>
      </Head>
      
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-blue-700">Student Portal</h1>
        <p class="text-gray-600 mt-2">Log in to access your assignments</p>
      </div>
      
      <div class="bg-white rounded-lg shadow-md p-6">
        <form method="POST" class="space-y-4">
          <div>
            <label for="username" class="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formValues.username}
              class={`w-full px-3 py-2 border rounded-md ${
                formErrors.username ? "border-red-500" : "border-gray-300"
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              required
            />
            {formErrors.username && (
              <p class="mt-1 text-sm text-red-600">{formErrors.username}</p>
            )}
          </div>
          
          <div>
            <label for="pin" class="block text-sm font-medium text-gray-700 mb-1">
              PIN (Optional)
            </label>
            <input
              type="password"
              id="pin"
              name="pin"
              value={formValues.pin}
              placeholder="4-digit PIN"
              maxlength="4"
              class={`w-full px-3 py-2 border rounded-md ${
                formErrors.pin ? "border-red-500" : "border-gray-300"
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            {formErrors.pin && (
              <p class="mt-1 text-sm text-red-600">{formErrors.pin}</p>
            )}
            <p class="mt-1 text-xs text-gray-500">
              If you have a PIN, enter it here. Otherwise, leave blank.
            </p>
          </div>
          
          <button
            type="submit"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
