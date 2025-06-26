import { Button } from "@/components/ui/button";
import RecipeCard from "@/components/ui/recipeCard";
import Image from "next/image";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const explore = [
  {
    icon: "/images/home/explore/breakfest.svg",
    label: "breakfest",
  },
  {
    icon: "/images/home/explore/lunch.svg",
    label: "lunch",
  },
  {
    icon: "/images/home/explore/dinner.svg",
    label: "dinner",
  },
  {
    icon: "/images/home/explore/dessert.svg",
    label: "dessert",
  },
  {
    icon: "/images/home/explore/quickbit.svg",
    label: "quick bite!",
  },
];

export default function Home() {
  return (
    <div className="mx-layout grid gap-5">
      <div className="hero relative">
        {/* Image Container with Overlay */}
        <div className="relative h-[600px] w-full lg:h-full overflow-hidden rounded-5xl">
          <img
            src="/images/home/Hero.svg"
            alt="hero_image"
            className="w-full h-full object-cover
"
          />
          {/* Transparent Black Overlay */}
          <div
            className="absolute inset-0 bg-black/30 
"
          ></div>
        </div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
          <h2 className="montserrat text-5xl lg:text-7xl text-(--background) uppercase font-black text-center">
            Unleash Culinary Excellence
          </h2>
          <p className=" text-md lg:text-lg text-(--background) text-center font-medium my-4 max-w-sm mx-auto">
            Explore a world of flavors, discover handcrafted recipes, and let
            the aroma of our passion for cooking fill your kitchen
          </p>
          <Button
            variant="secondary"
            className="my-6 uppercase text-md lg:text-base font-medium lg:px-8"
          >
            explore recipes
          </Button>
        </div>
      </div>
      {/* Explore section  */}
      <div className="rounded-5xl bg-(--primary4) py-10 px-6 lg:flex lg:justify-between lg:items-end lg:gap-3">
        <div className="lg:flex-1">
          <Button
            variant="tag"
            className="uppercase mb-3 text-base font-medium"
          >
            EXPLORE
          </Button>
          <h3 className="pb-4 leading-none">
            Our diverse
            <br />
            Palette
          </h3>
          <p className="text-sm text-(--dark)/80 font-light max-w-2xs mb-10 lg:tracking-wide lg:max-w-lg ">
            If you are a breakfast enthusiast, a connoisseur of savory delights,
            or on the lookout for irresistible desserts, our curated selection
            has something to satisfy every palate.
          </p>
          <Button variant="outline">SEE MORE</Button>
        </div>
        <div className="mt-16 lg:mt-4 lg:flex-1">
          {explore.map((item, key) => (
            <div className="tem flex justify-between items-center border-b-2 border-(--dark)/10 py-4 mb-4">
              <img src={item?.icon} alt="image" />
              <span className="uppercase text-(--dark) text-base font-semibold">
                {item?.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Featured recipes */}

      <div className=" w-screen border-1 rounded-5xl border-(--dark)/20 p-4">
        <h3 className="uppercase mb-9 ps-6">featured recipes</h3>
        <Carousel className="w-screen">
          <CarouselContent className="-ml-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <CarouselItem key={index} className="pl-1  lg:basis-1/2">
                <div className="p-1">
                  <RecipeCard
                    image="/images/home/recipeImage1.svg"
                    title="Savory Herb-Infused Chicken"
                    description="Indulge in the rich and savory symphony of flavors with our Savory Herb-Infused Chicken"
                    className="mb-3 w-screen"
                    diet={[
                      "dairy-free",
                      "gluten free",
                      "egg free",
                      "grain free",
                      "no bake",
                      "high-protein",
                    ]}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>

      {/* 
      <div className="flex gap-5">


      <RecipeCard
        image="/images/home/recipeImage1.svg"
        title="Savory Herb-Infused Chicken"
        description="Indulge in the rich and savory symphony of flavors with our Savory Herb-Infused Chicken"
        className="mb-5"
        diet={["dairy-free", "gluten free", "egg free", "grain free", "no bake", "high-protein"]}
      />
      </div> */}


      
    </div>

    // Hero section
  );
}
