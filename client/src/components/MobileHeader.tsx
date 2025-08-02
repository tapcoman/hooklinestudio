import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { 
  Menu, 
  X, 
  Heart, 
  History, 
  Settings, 
  Building2, 
  LogOut, 
  CreditCard,
  User as UserIcon,
  Plus
} from 'lucide-react';
import { useLocation } from 'wouter';
import { useFirebaseAuth } from '@/hooks/use-firebase-auth';
import type { User } from '@shared/schema';

interface MobileHeaderProps {
  user?: User;
  credits?: { remainingCredits: number; isAtLimit: boolean };
  onNewHook?: () => void;
}

export function MobileHeader({ user, credits, onNewHook }: MobileHeaderProps) {
  const [, setLocation] = useLocation();
  const { logoutMutation } = useFirebaseAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const logoUrl = "/assets/logo.png";

  const closeMenu = () => setIsMenuOpen(false);

  const menuItems = [
    {
      icon: Plus,
      label: "New Hook",
      action: () => {
        onNewHook?.();
        closeMenu();
      },
      isPrimary: true
    },
    {
      icon: Heart,
      label: "Favorites",
      action: () => {
        setLocation("/favorites");
        closeMenu();
      }
    },
    {
      icon: History,
      label: "History",
      action: () => {
        setLocation("/history");
        closeMenu();
      }
    },
    {
      icon: Settings,
      label: "Profile Settings",
      action: () => {
        setLocation("/profile");
        closeMenu();
      }
    },
    {
      icon: Building2,
      label: "Manage Companies",
      action: () => {
        setLocation("/profile/companies");
        closeMenu();
      }
    },
    {
      icon: CreditCard,
      label: "Billing & Plans",
      action: () => {
        setLocation("/billing");
        closeMenu();
      }
    }
  ];

  return (
    <div className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-3">
          <img 
            src={logoUrl} 
            alt="Hook Line Studio" 
            className="w-8 h-8 object-contain"
          />
          <span className="font-semibold text-slate-900 text-sm">HLS</span>
        </div>

        {/* Center - Credits or Status */}
        <div className="flex items-center">
          {credits && !user?.isPremium && (
            <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 text-xs px-2 py-1">
              {credits.remainingCredits} credits
            </Badge>
          )}
          {user?.isPremium && (
            <Badge className="bg-blue-600 text-white text-xs px-2 py-1">
              Premium
            </Badge>
          )}
        </div>

        {/* Menu Trigger */}
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="p-2">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          
          <SheetContent side="right" className="w-80 p-0">
            <SheetHeader className="p-6 pb-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-lg font-semibold">Menu</SheetTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeMenu}
                  className="p-1 h-auto"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {/* User Info */}
              <div className="flex items-center space-x-3 mt-4">
                {user?.profileImageUrl ? (
                  <img 
                    src={user.profileImageUrl} 
                    alt="Profile" 
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-slate-600" />
                  </div>
                )}
                <div className="flex-1 text-left">
                  <p className="font-medium text-slate-900 text-sm">
                    {user?.firstName || user?.email}
                  </p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
              </div>

              {/* Company Info */}
              {user?.company && (
                <div className="flex items-center space-x-2 mt-3 p-2 bg-slate-50 rounded-lg">
                  <Building2 className="w-4 h-4 text-slate-600" />
                  <span className="text-sm text-slate-700">{user.company}</span>
                </div>
              )}
            </SheetHeader>

            {/* Navigation Items */}
            <div className="p-6 space-y-2">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={index}
                    variant={item.isPrimary ? "default" : "ghost"}
                    className={`w-full justify-start h-12 text-left ${
                      item.isPrimary 
                        ? "bg-blue-600 hover:bg-blue-700 text-white" 
                        : "hover:bg-slate-50"
                    }`}
                    onClick={item.action}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    <span className="font-medium">{item.label}</span>
                  </Button>
                );
              })}
            </div>

            {/* Logout Button */}
            <div className="absolute bottom-6 left-6 right-6">
              <Button
                variant="outline"
                className="w-full justify-start h-12 border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => {
                  logoutMutation.mutate();
                  closeMenu();
                }}
              >
                <LogOut className="w-5 h-5 mr-3" />
                <span className="font-medium">Log out</span>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}