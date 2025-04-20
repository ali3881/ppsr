import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "../ui/navigation-menu";

const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-blue-600 text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <img src="/images/ppsr-logo.jpg" alt="PPSR Security Check" className="h-10" />
              </Link>
            </div>
            
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent hover:bg-blue-700">Operations</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4">
                      <li>
                        <NavigationMenuLink asChild>
                          <Link
                            to="/change-password"
                            className="block select-none space-y-1 rounded-md p-3 hover:bg-blue-100 hover:text-blue-600"
                          >
                            <div className="text-sm font-medium">Change Password</div>
                            <p className="text-sm text-gray-500">
                              Update your B2G channel password
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <Link
                            to="/status"
                            className="block select-none space-y-1 rounded-md p-3 hover:bg-blue-100 hover:text-blue-600"
                          >
                            <div className="text-sm font-medium">Connection Status</div>
                            <p className="text-sm text-gray-500">
                              Check your B2G channel connection status
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <Link
                            to="/vehicle-search"
                            className="block select-none space-y-1 rounded-md p-3 hover:bg-blue-100 hover:text-blue-600"
                          >
                            <div className="text-sm font-medium">Vehicle Search</div>
                            <p className="text-sm text-gray-500">
                              Search for vehicle by VIN, chassis, or registration
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent hover:bg-blue-700">Resources</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4">
                      <li>
                        <NavigationMenuLink asChild>
                          <a
                            href="https://www.ppsr.gov.au/about-us/connection-methods-ppsr"
                            target="_blank"
                            rel="noreferrer"
                            className="block select-none space-y-1 rounded-md p-3 hover:bg-blue-100 hover:text-blue-600"
                          >
                            <div className="text-sm font-medium">Documentation</div>
                            <p className="text-sm text-gray-500">
                              Official PPSR documentation
                            </p>
                          </a>
                        </NavigationMenuLink>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-grow">
        <Outlet />
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">About PPSR</h3>
              <p className="text-gray-300">
                The Personal Property Securities Register (PPSR) is the single, national online database of security interests in personal property in Australia.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link to="/" className="text-gray-300 hover:text-white">Home</Link></li>
                <li><Link to="/change-password" className="text-gray-300 hover:text-white">Change Password</Link></li>
                <li><Link to="/status" className="text-gray-300 hover:text-white">Connection Status</Link></li>
                <li><Link to="/vehicle-search" className="text-gray-300 hover:text-white">Vehicle Search</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Contact</h3>
              <p className="text-gray-300">
                PPSR Contact Centre: 1300 007 777 <br />
                International: +61 2 6198 0235 <br />
                Monday to Friday 8:30am – 8:00pm (AEST/AEDT)
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} PPSR B2G Portal. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
