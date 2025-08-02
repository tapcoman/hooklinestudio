import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  RotateCcw, 
  Settings, 
  Plus,
  MoreHorizontal,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MobileBottomBarProps {
  onExport?: () => void;
  onGenerateMore?: () => void;
  onNewHook?: () => void;
  onToggleView?: () => void;
  isExporting?: boolean;
  isGenerating?: boolean;
  useTriModalView?: boolean;
  hasHooks?: boolean;
  className?: string;
}

export function MobileBottomBar({
  onExport,
  onGenerateMore,
  onNewHook,
  onToggleView,
  isExporting = false,
  isGenerating = false,
  useTriModalView = true,
  hasHooks = false,
  className = ''
}: MobileBottomBarProps) {
  return (
    <nav 
      className={`bg-white border-t border-slate-200 px-4 py-3 safe-area-padding-bottom ${className}`}
      role="navigation"
      aria-label="Primary actions"
    >
      <div className="flex items-center justify-between space-x-3">
        {/* Primary Action - New Hook */}
        <Button
          onClick={onNewHook}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-12 font-medium shadow-sm touch-target"
          aria-label="Create new hook"
        >
          <Plus className="w-5 h-5 mr-2" aria-hidden="true" />
          New Hook
        </Button>

        {/* Export Button */}
        <Button
          variant="outline"
          onClick={onExport}
          disabled={!hasHooks || isExporting}
          className="h-12 px-4 border-slate-200 touch-target"
          aria-label={isExporting ? "Exporting hooks..." : "Export hooks to CSV"}
        >
          <Download className="w-5 h-5" aria-hidden="true" />
          {isExporting && <span className="ml-2 text-xs">...</span>}
        </Button>

        {/* Generate More Button */}
        <Button
          variant="outline"
          onClick={onGenerateMore}
          disabled={!hasHooks || isGenerating}
          className="h-12 px-4 border-slate-200 touch-target"
          aria-label={isGenerating ? "Generating more hooks..." : "Generate 10 more hooks"}
        >
          <RotateCcw className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} aria-hidden="true" />
          {isGenerating && <span className="ml-2 text-xs">...</span>}
        </Button>

        {/* More Options Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="h-12 px-4 border-slate-200 touch-target"
              aria-label="More options"
            >
              <MoreHorizontal className="w-5 h-5" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56 mb-2">
            <DropdownMenuItem onClick={onToggleView} className="flex items-center justify-between">
              <div className="flex items-center">
                {useTriModalView ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                <span>{useTriModalView ? 'Classic View' : 'Tri-Modal View'}</span>
              </div>
              {useTriModalView && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                  ✨
                </Badge>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Action Status Indicators */}
      {(isExporting || isGenerating) && (
        <div className="mt-2 flex justify-center">
          <div className="flex items-center space-x-2 text-xs text-slate-600">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            <span>
              {isExporting && "Exporting hooks..."}
              {isGenerating && "Generating new hooks..."}
            </span>
          </div>
        </div>
      )}
    </nav>
  );
}

// CSS for safe area support (add to global CSS)
export const mobileBottomBarStyles = `
  .safe-area-padding-bottom {
    padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
  }
`;