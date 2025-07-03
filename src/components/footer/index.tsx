import { menu, MenuType } from "@/lib/utils";
import { Button } from "../ui/button";
import { Icon } from "../ui/icon";
import { Input } from "../ui/input";
import Link from "next/link";
import SocialMedia from "../ui/socialmedia";

export default function Footer() {
  return (
    <div className="mx-layout my-5 space-y-5">
      {/* Subscribe sub footer   */}
      <div className="rounded-5xl px-4 bg-(--primary3) overflow-hidden">
        <div className="sub_footer relative py-16  text-center z-50">
          <span className="text-lg lg:text-lg text-(--background) font-medium  mx-auto">
            SUBSCRIBE
          </span>
          <h2 className=" my-3 montserrat text-5xl lg:text-7xl text-(--background) uppercase font-black text-center lg:max-w-3xl mx-auto">
            JOIN the fun Subscribe Now!
          </h2>
          <p className=" text-md lg:text-lg text-(--background)/80 text-center font-normal max-w-sm mx-auto">
            Subscribe to our newsletter for a weekly serving of recipes, cooking
            tips, and exclusive insights straight to your inbox.
          </p>
          <div className="lg:flex w-full lg:bg-(--background) lg:rounded-full lg:max-w-md  lg:items-center lg:gap-2 mt-12 lg:py-1.5 lg:px-2 lg:mx-auto">
            <Input
              type="email"
              placeholder="Email Address"
              className="p-6 mb-2 lg:p-0 lg:ps-5 lg:mb-0 lg:border-none"
            />

            <Button
              type="submit"
              variant="default"
              className="hover:bg-(--primary3) transition-colors w-full lg:w-fit p-6 text-md"
            >
              Subscribe
            </Button>
          </div>
        </div>
      </div>

      {/* Footer  */}

      <footer className="rounded-5xl bg-(--dark)  p-6 ">
        <div className="lg:flex lg:justify-between lg:items-center lg:mb-4">
          <div className="flex gap-2 justify-center items-center mb-6 lg:mb-0">
            <Icon name="footerLogo" size={50} />
            <h3 className="  capitalize font-normal text-(--background) text-sm leading-4 pt-1">
              Whisk
              <br />
              Taste
            </h3>
          </div>
          <nav>
            <ul className="lg:flex lg:items-center">
              {menu.map((item: MenuType, index: number) => (
                <li
                  key={index}
                  className="border-b lg:border-b-0 lg:border-r lg:px-4 border-(--background)/10 last:border-b-0 last:border-r-0"
                >
                  <Link
                    href={item.path}
                    className={`
                    block py-3 lg:py-0 uppercase text-base font-medium
                    transition-colors duration-200
                    text-(--background) hover:text-(--background)
                    `}
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <SocialMedia className="my-5 lg:my-0" socialMedia={["fb", "insta", "ytube"]} />
        </div>
        <hr className="border-none h-[1px] bg-(--background)/10 " />
        <span className="text-(--background)/60 uppercase text-center text-sm inline-block w-full mt-5">
          copyright : &copy; {new Date().getFullYear()} whisk taste
        </span>
      </footer>
    </div>
  );
}
