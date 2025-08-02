import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Building2, Plus, Edit, Trash2, Check } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

interface CompanyProfile {
  id?: string;
  company: string;
  industry: string;
  role: string;
  audience: string;
  voice: string;
  safety: string;
  bannedTerms: string[];
  isActive?: boolean;
}

export default function ManageCompanies() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAddingCompany, setIsAddingCompany] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyProfile | null>(null);

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/users/me"],
    queryFn: () => apiRequest("GET", "/api/users/me").then(res => res.json()),
  }) as { data: User | undefined; isLoading: boolean };

  // Mock companies for now - in real implementation this would come from API
  const [companies, setCompanies] = useState<CompanyProfile[]>([
    {
      id: "1",
      company: user?.company || "Current Company",
      industry: user?.industry || "Technology",
      role: user?.role || "Creator",
      audience: user?.audience || "General audience",
      voice: user?.voice || "Friendly",
      safety: user?.safety || "standard",
      bannedTerms: user?.bannedTerms || [],
      isActive: true
    }
  ]);

  const [newCompany, setNewCompany] = useState<CompanyProfile>({
    company: "",
    industry: "",
    role: "",
    audience: "",
    voice: "friendly",
    safety: "standard",
    bannedTerms: []
  });

  const switchToCompanyMutation = useMutation({
    mutationFn: async (companyProfile: CompanyProfile) => {
      const response = await apiRequest("PUT", "/api/users/me", {
        company: companyProfile.company,
        industry: companyProfile.industry,
        role: companyProfile.role,
        audience: companyProfile.audience,
        voice: companyProfile.voice,
        safety: companyProfile.safety,
        bannedTerms: companyProfile.bannedTerms
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      // Update active company in local state
      setCompanies(prev => prev.map(c => ({ ...c, isActive: c.id === editingCompany?.id })));
      toast({
        title: "Company switched",
        description: "Your active company profile has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Switch failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSwitchCompany = (company: CompanyProfile) => {
    switchToCompanyMutation.mutate(company);
  };

  const handleAddCompany = () => {
    if (!newCompany.company.trim()) {
      toast({
        title: "Company name required",
        description: "Please enter a company name.",
        variant: "destructive"
      });
      return;
    }

    const company: CompanyProfile = {
      ...newCompany,
      id: Date.now().toString(),
      isActive: false
    };

    setCompanies(prev => [...prev, company]);
    setNewCompany({
      company: "",
      industry: "",
      role: "",
      audience: "",
      voice: "friendly",
      safety: "standard",
      bannedTerms: []
    });
    setIsAddingCompany(false);
    
    toast({
      title: "Company added",
      description: "New company profile has been created.",
    });
  };

  const handleDeleteCompany = (companyId: string) => {
    setCompanies(prev => prev.filter(c => c.id !== companyId));
    toast({
      title: "Company deleted",
      description: "Company profile has been removed.",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading companies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocation("/profile")}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Profile</span>
          </Button>
          <div className="flex items-center space-x-3">
            <Building2 className="w-6 h-6 text-slate-600" />
            <h1 className="text-xl font-semibold text-slate-900">Manage Companies</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <p className="text-slate-600 mb-4">
            Manage multiple company profiles to switch between different brand contexts when generating hooks.
          </p>
          
          <Dialog open={isAddingCompany} onOpenChange={setIsAddingCompany}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Add Company</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Company Profile</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="new-company">Company Name *</Label>
                    <Input
                      id="new-company"
                      value={newCompany.company}
                      onChange={(e) => setNewCompany(prev => ({ ...prev, company: e.target.value }))}
                      placeholder="Company name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-role">Your Role</Label>
                    <Input
                      id="new-role"
                      value={newCompany.role}
                      onChange={(e) => setNewCompany(prev => ({ ...prev, role: e.target.value }))}
                      placeholder="Your role at this company"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="new-industry">Industry</Label>
                  <Select 
                    value={newCompany.industry} 
                    onValueChange={(value) => setNewCompany(prev => ({ ...prev, industry: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="fitness">Fitness</SelectItem>
                      <SelectItem value="food">Food & Beverage</SelectItem>
                      <SelectItem value="beauty">Beauty & Fashion</SelectItem>
                      <SelectItem value="entertainment">Entertainment</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="new-audience">Target Audience</Label>
                  <Textarea
                    id="new-audience"
                    value={newCompany.audience}
                    onChange={(e) => setNewCompany(prev => ({ ...prev, audience: e.target.value }))}
                    placeholder="Describe the target audience for this company"
                    className="h-20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Brand Voice</Label>
                    <Select 
                      value={newCompany.voice} 
                      onValueChange={(value) => setNewCompany(prev => ({ ...prev, voice: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="authoritative">Authoritative</SelectItem>
                        <SelectItem value="playful">Playful</SelectItem>
                        <SelectItem value="contrarian">Contrarian</SelectItem>
                        <SelectItem value="luxury">Luxury</SelectItem>
                        <SelectItem value="minimal">Minimal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Content Safety</Label>
                    <Select 
                      value={newCompany.safety} 
                      onValueChange={(value) => setNewCompany(prev => ({ ...prev, safety: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="family-friendly">Family-friendly</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="edgy">Edgy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <Button variant="outline" onClick={() => setIsAddingCompany(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddCompany}>
                    Add Company
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Companies Grid */}
        <div className="grid gap-4">
          {companies.map((company) => (
            <Card key={company.id} className={`${company.isActive ? 'ring-2 ring-primary' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Building2 className="w-5 h-5 text-slate-600" />
                    <div>
                      <CardTitle className="text-lg">{company.company}</CardTitle>
                      <p className="text-sm text-slate-500">{company.role} • {company.industry}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {company.isActive && (
                      <div className="flex items-center space-x-1 text-green-600 text-sm font-medium">
                        <Check className="w-4 h-4" />
                        <span>Active</span>
                      </div>
                    )}
                    {!company.isActive && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSwitchCompany(company)}
                        disabled={switchToCompanyMutation.isPending}
                      >
                        Switch to this
                      </Button>
                    )}
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    {companies.length > 1 && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteCompany(company.id!)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-slate-700">Audience</p>
                    <p className="text-slate-600">{company.audience || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-700">Voice</p>
                    <p className="text-slate-600 capitalize">{company.voice}</p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-700">Safety</p>
                    <p className="text-slate-600 capitalize">{company.safety}</p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-700">Banned Terms</p>
                    <p className="text-slate-600">{company.bannedTerms.length} terms</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}