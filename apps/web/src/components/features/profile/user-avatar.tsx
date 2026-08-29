import { UserRound } from "lucide-react";
import Image from "next/image";

export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function UserAvatar({
  avatarUrl,
  className = "size-24",
  displayName,
}: {
  avatarUrl: string | null;
  className?: string;
  displayName: string;
}) {
  return (
    <div
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-[#ed802a] font-bold text-[#ffe2c8] ${className}`}
    >
      {avatarUrl ? (
        <Image
          alt={`${displayName}'s profile photo`}
          className="object-cover"
          fill
          sizes="128px"
          src={avatarUrl}
          unoptimized
        />
      ) : getInitials(displayName) ? (
        <span aria-hidden="true">{getInitials(displayName)}</span>
      ) : (
        <UserRound aria-hidden="true" className="size-10" />
      )}
    </div>
  );
}
