import { Icon } from "./icon";




export default function SocialMedia({ className , socialMedia }: { className?: string , socialMedia : string[] }) {
  return (
    <div
      className={`social_media flex justify-center items-center gap-4 ${className}`}
    >

      {socialMedia.map((name: string, index: number) => (
        <Icon
          name={name}
          size={24}
          className="hover:scale-110 transition-transform cursor-pointer"
        />
      ))}
    </div>
  );
}
