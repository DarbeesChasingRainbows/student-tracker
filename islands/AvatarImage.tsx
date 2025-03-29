import { JSX } from "preact";

export default function AvatarImage({ src, username }: { src: string; username: string }): JSX.Element {
  return (
    <img 
      src={src} 
      alt="Student avatar"
      class="w-14 h-14 object-cover"
      onError={(e) => {
        // Fallback for missing avatar images
        const target = e.target as HTMLImageElement;
        target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(username) + "&background=random";
      }}
    />
  );
}
