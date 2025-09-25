import Image from "next/image";
import Link from "next/link";

import { getDeterministicTagColor, getTagInitials, getTagTextColorClass } from "@/utils/tagHelpers";

import { Button } from "./button";
import { useRouter } from "next/router";

export interface RecipeCardProps {
  id: string;
  title: string;
  slug : string ;
  description?: string | null;
  href: string;                     // e.g. node.uri or `/recipes/${slug}`
  featuredImageUrl?: string | null; // from GraphQL
  dietary?: string[] | null;
  totalTime?: number | null;        // minutes
  difficulty?: string | null;       // "easy" | "medium" | "hard" | ...
  servings?: number | null;         // optional if you have it on the list node
  className?: string;
}

export default function RecipeCard({
  id,
  title,
  slug , 
  description,
  href,
  featuredImageUrl,
  dietary = [],
  totalTime,
  difficulty,
  servings,
  className,
}: RecipeCardProps) {


  const fmtTime = (m?: number | null) =>
    typeof m === "number" && m > 0 ? `${m} min` : null;

  const fmtDifficulty = (d?: string | null) =>
    d ? d.replace(/^\w/, (c) => c.toUpperCase()) : null;

  const metaBits = [fmtTime(totalTime), fmtDifficulty(difficulty), servings ? `${servings} servings` : null]
    .filter(Boolean)
    .join(" · ");

  const imgSrc =
    featuredImageUrl ||
    "/images/placeholder-recipe.jpg"; // keep a local placeholder in public/


  return (
    <div
      className={`rounded-3xl overflow-hidden bg-(--background) border-1 border-(--dark)/16 ${className ?? ""}`}
      data-recipe-id={id}
    >
      {/* Container pour l'image avec aspect ratio fixe */}
      <div className="relative rounded-xl w-full aspect-[5/3] sm:aspect-[3/2] lg:aspect-[8/3]">
        <Image
          src={imgSrc}
          fill
          alt={`Image de la recette ${title}`}
          className="object-cover rounded-xl"
          sizes="(max-width: 640px) 90vw, (max-width: 768px) 45vw, (max-width: 1024px) 50vw, 50vw"
          priority={false}
        />
      </div>

      {/* Card content  */}
      <div className="p-4 bg-(--light)">
        <h4 className="montserrat text-xl lg:text-2xl font-bold mb-3">
          {title}
        </h4>

        <p className="text-sm text-(--dark) mb-4 font-light lg:text-base lg:tracking-wide">
          {description}
        </p>


        {/* Diet tags */}
        {!!dietary?.length && (
          <div className="flex flex-wrap items-center gap-2">
            {dietary.map((tag, i) => {
              const bg = getDeterministicTagColor(tag);
              const fg = getTagTextColorClass(bg);
              const initials = getTagInitials(tag);
              return (
                <span
                  key={`${tag}-${i}`}
                  className={`rounded-full w-9 h-9 ${bg} ${fg} font-bold text-xs grid place-items-center transition-transform hover:scale-110`}
                  title={tag.replace(/-/g, " ")}
                >
                  {initials}
                </span> 
              );
            })}
          </div>
        )}

        <div className="flex flex-col lg:items-center gap-4 lg:justify-between lg:flex-row mt-10 lg:mt-13">
          <span className="text-sm text-(--dark)">{metaBits}</span>
          <Button variant="outline" className="uppercase font-medium"   asChild>                                                        
                  <Link href={`/recipe/${slug}`}>View recipe</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
