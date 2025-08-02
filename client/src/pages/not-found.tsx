import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-navy mb-2">Page Not Found</h1>
            <p className="text-slate mb-6">
              The page you're looking for doesn't exist or has been moved.
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={() => setLocation("/")}
                className="w-full bg-navy hover:bg-navy/90 text-white"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Home
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.history.back()}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
