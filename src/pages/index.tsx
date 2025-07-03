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
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";

const explore = [
  {
    icon: "/images/breakfest.svg",
    label: "breakfest",
  },
  {
    icon: "/images/lunch.svg",
    label: "lunch",
  },
  {
    icon: "/images/dinner.svg",
    label: "dinner",
  },
  {
    icon: "/images/dessert.svg",
    label: "dessert",
  },
  {
    icon: "/images/quickbit.svg",
    label: "quick bite!",
  },
];

export default function Home() {
  return (
    <div className="mx-layout grid gap-5">
      {/* Hero section  */}
      <div className="hero relative">
        {/* Image Container with Overlay */}
        <div className="relative h-[600px] w-full lg:h-full overflow-hidden rounded-5xl">
          <img
            src="/images/Hero.svg"
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
      <div className=" border-1 overflow-x-hidden rounded-5xl border-(--dark)/20 p-4   mb-10">
        <h3 className="uppercase mb-9 ps-6">featured recipes</h3>

        <Carousel className="w-full hidden md:block md:max-w-full">
          <CarouselContent className=" ">
            {Array.from({ length: 5 }).map((_, index) => (
              <CarouselItem
                key={index}
                className="pl-3  basis-full lg:basis-1/2"
              >
                <div className="">
                  <RecipeCard
                    image="/images/recipeImage1.svg"
                    title="Savory Herb-Infused Chicken"
                    description="Indulge in the rich and savory symphony of flavors with our Savory Herb-Infused Chicken"
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
          <CarouselPrevious variant={null} className="w-40" />
          <CarouselNext variant={null} />
        </Carousel>

        {/* Mobile: Scroll horizontal natif */}
        <div className="md:hidden w-full">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-2 px-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex-none max-w-xs sm:w-[320px]">
                <RecipeCard
                  image="/images/recipeImage1.svg"
                  title="Savory Herb-Infused Chicken"
                  description="Indulge in the rich and savory symphony of flavors with our Savory Herb-Infused Chicken"
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
            ))}
          </div>
        </div>
      </div>

      {/* Explore recipes  */}
      <div>
        <div className="text-center">
          <Button
            variant="tag"
            className="uppercase mb-3 text-base font-medium"
          >
            recipes
          </Button>
          <h3 className="pb-4 leading-none">
            Embark on a
            <br />
            journey
          </h3>
          <p className="text-sm mx-auto text-(--dark)/80 font-light max-w-2xs mb-10 lg:tracking-wide lg:max-w-lg ">
            With our diverse collection of recipes we have something to satisfy
            every palate.
          </p>
          <Button variant="outline">VIEW ALL RECIPES</Button>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 my-10">
          {Array.from({ length: 6 }).map((_, index) => (
            <RecipeCard
              image="/images/recipeImage1.svg"
              title="Savory Herb-Infused Chicken"
              description="Indulge in the rich and savory symphony of flavors with our Savory Herb-Infused Chicken"
              diet={[
                "dairy-free",
                "gluten free",
                "egg free",
                "grain free",
                "no bake",
                "high-protein",
              ]}
            />
          ))}
        </div>
        <div className="text-center">
          <Button variant="outline">VIEW ALL RECIPES</Button>
        </div>
      </div>

      {/* About us  */}
      <div className=" lg:flex lg:gap-3 p-2 lg:p-4 border-1 border-(--dark)/20 rounded-5xl">
        <div className="flex-1">
          <div className="flex h-[45%] flex-col lg:flex-row lg:justify-between lg:items-end">
            <div className="pt-8 px-2 lg:pt-0">
              <Button
                variant="tag"
                className="uppercase mb-3 text-base font-medium"
              >
                about us
              </Button>
              <h3 className="pb-4 leading-none">
                Our Culinary
                <br />
                Chronicle
              </h3>
              <p className="text-sm  text-(--dark)/80 font-light max-w-2xs mb-5 lg:mb-10 lg:tracking-wide lg:max-w-lg ">
                Our journey is crafted with dedication, creativity, and an
                unrelenting commitment to delivering delightful culinary
                experiences. Join us in savoring the essence of every dish and
                the stories that unfold.
              </p>
              <Button variant="outline" className="hidden lg:block">
                READ MORE
              </Button>
            </div>

            <div className="h-[100%]">
              <img
                src="/images/about1.svg"
                alt="about2"
                className="w-full h-full object-cover aspect-square rounded-2xl hidden lg:block"
              />
              <img
                src="/images/aboutm1.svg"
                alt="about2"
                className="w-full h-full object-cover aspect-square rounded-2xl lg:hidden"
              />
            </div>
          </div>
          <div
            className="mt-2 lg:mt-3 overflow-hidden"
            style={{ height: "calc(55% - 12px)" }}
          >
            <div className="h-full w-full">
              <img
                src="/images/about3.svg"
                alt="about3"
                className="w-full h-full object-cover rounded-2xl hidden lg:block"
              />
              <img
                src="/images/aboutm2.svg"
                alt="about2"
                className="w-full h-full object-cover aspect-square rounded-2xl lg:hidden"
              />
            </div>
          </div>
        </div>
        <div className="mt-2 lg:w-[30%]">
          <div className="h-full">
            <img
              src="/images/about2.svg"
              alt="about3"
              className="object-cover w-full h-full rounded-2xl hidden lg:block"
            />
            <img
              src="/images/aboutm3.svg"
              alt="about3"
              className="object-cover w-full h-full rounded-2xl lg:hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
