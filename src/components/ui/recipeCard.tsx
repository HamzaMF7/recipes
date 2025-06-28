import Image from "next/image";
import { Button } from "./button";
import { Badge } from "./badge";

interface recipesProps {
  image: string;
  title: string;
  description: string;
  className?: string;
  diet?: string[];
}

export default function RecipeCard({
  image,
  title,
  description,
  className,
  diet = [],
}: recipesProps) {
  // function to extract the first words letters
  const extractInitials = (dietTag: string): string => {
    return dietTag
      .split(/[\s-]+/) // Sépare par espaces ou tirets
      .map((word) => word.charAt(0).toUpperCase())
      .join("");
  };

  // Fonction pour générer une couleur basée sur le tag
  const getTagColor = (tag: string): string => {
    const colors = [
      "bg-amber-600",
      "bg-blue-600",
      "bg-green-600",
      "bg-purple-600",
      "bg-red-600",
      "bg-indigo-600",
      "bg-pink-600",
      "bg-teal-600",
      "bg-orange-600",
      "bg-cyan-600",
      "bg-emerald-600",
      "bg-violet-600",
      "bg-rose-600",
      "bg-sky-600",
      "bg-lime-600",
      "bg-fuchsia-600",
    ];

    // Utilise le hash du tag pour sélectionner une couleur consistante
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
      hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Fonction pour déterminer la couleur du texte selon l'arrière-plan
  const getTextColor = (bgColor: string): string => {
    const darkColors = [
      "bg-amber-600",
      "bg-blue-600",
      "bg-purple-600",
      "bg-red-600",
      "bg-indigo-600",
      "bg-pink-600",
      "bg-teal-600",
      "bg-orange-600",
      "bg-violet-600",
      "bg-rose-600",
      "bg-fuchsia-600",
    ];
    return darkColors.includes(bgColor) ? "text-white" : "text-black";
  };
  return (
    <div className={`rounded-3xl overflow-hidden bg-(--background) border-1 border-(--dark)/16  ${className}`}>
      {/* Container pour l'image avec aspect ratio fixe */}
      <div className="relative rounded-xl w-full aspect-[5/3] sm:aspect-[3/2] lg:aspect-[8/3]">
        <Image
          src={image}
          fill
          alt={`Image de la recette ${title}`}
          className="object-cover rounded-xl"
          sizes="(max-width: 640px) 90vw, (max-width: 768px) 45vw, (max-width: 1024px) 50vw, 50vw"
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

        {/* Tags diet */}
        {diet.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {diet.map((tag, index) => {
              const bgColor = getTagColor(tag);
              const textColor = getTextColor(bgColor);
              const initials = extractInitials(tag);

              return (
                <span
                  key={index}
                  className={`rounded-full w-9 h-9 ${bgColor} ${textColor} font-bold text-xs grid place-items-center transition-transform hover:scale-110`}
                  title={tag.replace(/[-]/g, " ")} // Tooltip avec le nom complet
                >
                  {initials}
                </span>
              );
            })}
          </div>
        )}

        <div className=" flex flex-col lg:items-center gap-4 lg:justify-between lg:flex-row  mt-10 lg:mt-13">
          <span>40 Min - easy prep - 3 serves</span>
          <Button variant="outline" className="uppercase font-medium">
            view recipe
          </Button>
        </div>
      </div>
    </div>
  );
}
