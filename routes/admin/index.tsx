import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { z } from "zod";

// Admin login form schema
const AdminLoginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type AdminLoginForm = z.infer<typeof AdminLoginSchema>;

export interface AdminPortalData {
  formErrors?: Record<string, string>;
  formValues?: AdminLoginForm;
}

export const handler: Handlers<AdminPortalData> = {
  GET(_, ctx) {
    // Initialize with empty data for GET requests
    return ctx.render({
      formErrors: {},
      formValues: { username: "", password: "" },
    });
  },
  async POST(req, ctx) {
    const formData = await req.formData();
    const username = formData.get("username")?.toString() || "";
    const password = formData.get("password")?.toString() || "";

    // Validate form data
    const result = AdminLoginSchema.safeParse({ username, password });
    
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
        formValues: { username, password },
      });
    }

    // In a real app, we would authenticate the admin here
    // For now, redirect to the admin dashboard
    return new Response("", {
      status: 303,
      headers: { Location: `/admin/dashboard?username=${encodeURIComponent(username)}` },
    });
  },
};

export default function AdminPortal({ data }: PageProps<AdminPortalData>) {
  try {
    console.log('AdminPortal data:', data);
    const { formErrors = {}, formValues = { username: "", password: "" } } = data || {};
    
    return (
      <div class="max-w-md mx-auto">
        <Head>
          <title>Admin Portal - Login</title>
        </Head>
        
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-purple-700">Admin Portal</h1>
          <p class="text-gray-600 mt-2">Log in to manage students and assignments</p>
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
                } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                required
              />
              {formErrors.username && (
                <p class="mt-1 text-sm text-red-600">{formErrors.username}</p>
              )}
            </div>
            
            <div>
              <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formValues.password}
                class={`w-full px-3 py-2 border rounded-md ${
                  formErrors.password ? "border-red-500" : "border-gray-300"
                } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                required
              />
              {formErrors.password && (
                <p class="mt-1 text-sm text-red-600">{formErrors.password}</p>
              )}
            </div>
            
            <button
              type="submit"
              class="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Log In
            </button>
          </form>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering AdminPortal:', error);
    return <p>Error loading admin portal. Please try again later.</p>;
  }
}
