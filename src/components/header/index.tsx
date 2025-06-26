
import {
  Menu,
  Search,
  X,
  Bell,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "../ui/button";
import { useState, useEffect } from "react";

interface MenuType {
  title: string;
  path: string;
}

const menu: MenuType[] = [
  {
    title: "home",
    path: "/",
  },
  {
    title: "All Recipes",
    path: "/recipes",
  },
  {
    title: "vegan",
    path: "/recipes/vegan",
  },
  {
    title: "gluten-free",
    path: "/recipes/gluten-free",
  },
  {
    title: "about us",
    path: "/about",
  },
];

export default function Header() {
  const [menuActive, setMenuActive] = useState<boolean>(false);
  const [currentPath, setCurrentPath] = useState<string>("/");
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [searchActive, setSearchActive] = useState<boolean>(false);

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setSearchActive(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const isLinkActive = (path: string) => {
    return currentPath === path || (path !== "/" && currentPath.startsWith(path));
  };

  const renderDesktopMenuItem = (item: MenuType, index: number) => {
    const isActive = isLinkActive(item.path);

    return (
      <li key={index} className="relative group">
        <Link 
          href={item.path}
          className={`
            uppercase text-sm font-medium relative overflow-hidden pb-1
            transition-all duration-300 ease-out
            ${isActive ? 'text-(--dark)' : 'text-(--dark)/20 hover:text-(--dark)'}
          `}
          onClick={() => setCurrentPath(item.path)}
        >
          {item.title}
          <span className={`
            absolute bottom-0 left-0 h-0.5 w-0
            bg-(--primary3) transition-all duration-300 ease-out
            ${isActive ? 'w-full' : 'group-hover:w-full'}
          `} />
        </Link>
      </li>
    );
  };

  const renderMobileMenuItem = (item: MenuType, index: number) => {
    const isActive = isLinkActive(item.path);

    return (
      <li key={index} className="border-b border-(--background)/20 last:border-b-0">
        <Link 
          href={item.path}
          className={`
            block py-4 uppercase text-base font-medium
            transition-colors duration-200
            ${isActive ? 'text-(--background)' : 'text-(--background)/70 hover:text-(--background)'}
          `}
          onClick={() => {
            setCurrentPath(item.path);
            setMenuActive(false);
          }}
        >
          {item.title}
        </Link>
      </li>
    );
  };

  const renderMobileMenu = () => (
    <div className="relative z-[99999] bg-(--dark) rounded-3xl mx-3 py-6 px-7">
      <div className="flex justify-between items-center mb-6">
        <div className="logo flex gap-1 justify-center items-center">
          <Link href="/" onClick={() => setCurrentPath("/")}>
            <Image src="/images/Logo.svg" alt="logo" width={40} height={35} />
          </Link>
          <h3 className="font-bold text-(--background) text-base leading-4 pt-1">
            Whisk<br />Taste
          </h3>
        </div>
        <button 
          className="menu_icon p-2 rounded-full bg-(--background)/20 hover:bg-(--background)/30 transition-colors"
          onClick={() => setMenuActive(false)}
        >
          <X className="text-(--background)" size={22} />
        </button>
      </div>
      
      <nav>
        <ul>
          {menu.map(renderMobileMenuItem)}
        </ul>
      </nav>
      
      <div className="flex justify-between gap-5 items-center mt-8">
        <button className="p-3 rounded-full bg-(--background)/20 hover:bg-(--background)/30 transition-colors">
          <Search size={16} className="text-(--background)" />
        </button>
        <Button variant="default" className="flex-1 bg-(--background)/20 hover:bg-(--background)/30">
          Subscribe
        </Button>
      </div>
      
      <div className="social_media mt-8 mb-3 flex justify-center items-center gap-4">
        <Image src="/images/fb.svg" alt="Facebook" width={24} height={24} className="hover:scale-110 transition-transform cursor-pointer" />
        <Image src="/images/insta.svg" alt="Instagram" width={24} height={24} className="hover:scale-110 transition-transform cursor-pointer" />
        <Image src="/images/ytube.svg" alt="YouTube" width={24} height={24} className="hover:scale-110 transition-transform cursor-pointer" />
      </div>
    </div>
  );

  return (
    <>
      <header className={`
        mx-layout 
        py-4 
        transition-all duration-300
    
      `}>
        <div className={`
          flex justify-between items-center mx-auto py-4 px-7 
          border rounded-full transition-all duration-300
          ${isScrolled 
            ? 'border-gray-200 bg-white/50' 
            : 'border-(--dark)/20 bg-transparent'
          }
        `}>
          {/* Logo */}
          <div className="logo flex gap-1 justify-center items-center">
            <Link href="/" onClick={() => setCurrentPath("/")}>
              <Image src="/images/Logo.svg" alt="logo" width={40} height={35} />
            </Link>
            <h3 className="font-bold text-(--dark) text-base leading-4 pt-1">
              Whisk<br />Taste
            </h3>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hide_mobile">
            <ul className="flex gap-8 justify-center items-center">
              {menu.map(renderDesktopMenuItem)}
            </ul>
          </nav>
          
          {/* Desktop Actions */}
          <div className="flex justify-between gap-3 items-center hide_mobile">
            <button 
              className={`
                p-3 rounded-full transition-all duration-200
                ${searchActive 
                  ? 'bg-(--primary3) text-white' 
                  : 'bg-(--dark)/10 hover:bg-(--dark)/20 text-(--dark)'
                }
              `}
              onClick={(e) => {
                e.stopPropagation();
                setSearchActive(!searchActive);
              }}
            >
              <Search size={16} />
            </button>
            <button className="p-3 rounded-full bg-(--dark)/10 hover:bg-(--dark)/20 transition-colors text-(--dark)">
              <Bell size={16} />
            </button>
            <button className="p-3 rounded-full bg-(--dark)/10 hover:bg-(--dark)/20 transition-colors text-(--dark)">
              <User size={16} />
            </button>
            <Button variant="default" className="hover:bg-(--primary3) transition-colors">
              Subscribe
            </Button>
          </div>
          
          {/* Mobile menu trigger */}
          <button 
            className="menu_icon p-2 rounded-full bg-(--dark)/20 lg:hidden hover:bg-(--dark)/30 transition-colors"
            onClick={() => setMenuActive(!menuActive)}
          >
            <Menu />
          </button>
        </div>
        
        {/* Expandable Search Bar */}
        {searchActive && (
          <div className="mt-4 px-7 hide_mobile">
            <div className="bg-white rounded-full border border-gray-200 shadow-lg p-4 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-3">
                <Search size={20} className="text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search recipes, ingredients, or cooking tips..."
                  className="flex-1 outline-none text-gray-700 placeholder-gray-400"
                  autoFocus
                />
                <button className="px-4 py-2 bg-(--primary3) text-white rounded-full text-sm font-medium hover:bg-(--primary3)/90 transition-colors">
                  Search
                </button>
              </div>
            </div>
          </div>
        )}
      </header>
      
      {/* Mobile menu overlay */}
      {menuActive && (
        <div className="
          bg-[rgba(255,255,255,0.13)]
          shadow-[0_4px_30px_rgba(0,0,0,0.1)]
          backdrop-blur-[11.3px]
          fixed inset-0 z-30
          w-full px-3 pt-20
        ">
          <div className="animate-in zoom-in-95 duration-300">
            {renderMobileMenu()}
          </div>
        </div>
      )}
    </>
  );
}
