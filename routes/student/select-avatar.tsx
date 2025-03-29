import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";

// Available avatars
const avatars = [
  { id: "avatar1", src: "/avatars/avatar1.png", alt: "Student avatar 1" },
  { id: "avatar2", src: "/avatars/avatar2.png", alt: "Student avatar 2" },
  { id: "avatar3", src: "/avatars/avatar3.png", alt: "Student avatar 3" },
  { id: "avatar4", src: "/avatars/avatar4.png", alt: "Student avatar 4" },
  { id: "avatar5", src: "/avatars/avatar5.png", alt: "Student avatar 5" },
  { id: "avatar6", src: "/avatars/avatar6.png", alt: "Student avatar 6" },
];

interface AvatarSelectionData {
  username: string;
}

export const handler: Handlers<AvatarSelectionData> = {
  GET(req, ctx) {
    const url = new URL(req.url);
    const username = url.searchParams.get("username") || "";
    
    if (!username) {
      // Redirect back to login if no username
      return new Response("", {
        status: 303,
        headers: { Location: "/student" },
      });
    }
    
    return ctx.render({ username });
  },
};

export default function SelectAvatar({ data }: PageProps<AvatarSelectionData>) {
  const { username } = data;
  
  return (
    <div class="max-w-2xl mx-auto">
      <Head>
        <title>Select Your Avatar</title>
      </Head>
      
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-blue-700">Choose Your Avatar</h1>
        <p class="text-gray-600 mt-2">Hi {username}, select an avatar to represent you</p>
      </div>
      
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
          {avatars.map((avatar) => (
            <div key={avatar.id} class="text-center">
              <a 
                href={`/student/dashboard?username=${encodeURIComponent(username)}&avatarId=${encodeURIComponent(avatar.id)}`}
                class="block p-4 border-2 border-transparent rounded-lg hover:border-blue-500 transition-colors"
              >
                <div class="bg-gray-100 rounded-full w-24 h-24 mx-auto mb-3 overflow-hidden flex items-center justify-center">
                  <img 
                    src={avatar.src} 
                    alt={avatar.alt}
                    class="w-20 h-20 object-cover"
                    onError={(e) => {
                      // Fallback for missing avatar images
                      const target = e.target as HTMLImageElement;
                      target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(username) + "&background=random";
                    }}
                  />
                </div>
                <p class="text-sm font-medium text-gray-700">{avatar.alt}</p>
              </a>
            </div>
          ))}
        </div>
        
        <div class="mt-6 text-center">
          <a 
            href="/student" 
            class="text-blue-600 hover:text-blue-800 font-medium"
          >
            &larr; Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}
