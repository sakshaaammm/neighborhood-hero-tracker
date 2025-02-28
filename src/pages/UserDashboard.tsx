
import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Gift,
  TrendingUp,
  Upload,
  FileText,
  Clock,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";

// Initialize global issues if it doesn't exist
if (typeof window !== 'undefined' && !window.hasOwnProperty('globalIssues')) {
  (window as any).globalIssues = [];
}

declare global {
  interface Window {
    globalIssues: any[];
  }
}

const sampleProblems = [
  { id: 1, title: "Pothole", category: "Road Infrastructure" },
  { id: 2, title: "Street Light", category: "Public Lighting" },
  { id: 3, title: "Garbage", category: "Sanitation" },
  { id: 4, title: "Tree Fallen", category: "Environment" },
  { id: 5, title: "Water Leakage", category: "Utilities" },
  { id: 6, title: "Traffic Signal", category: "Traffic Management" },
  { id: 7, title: "Graffiti", category: "Public Property" },
  { id: 8, title: "Park Maintenance", category: "Public Spaces" },
];

const generateDescription = (title: string, category: string) => {
  const descriptions = {
    "Pothole": "A significant road surface depression causing potential vehicle damage and traffic hazards.",
    "Street Light": "Non-functional street light creating visibility issues and safety concerns in the area.",
    "Garbage": "Accumulated waste requiring immediate collection and disposal to maintain cleanliness.",
    "Tree Fallen": "Fallen tree blocking pathway/road, requiring urgent removal for safety.",
    "Water Leakage": "Water pipe leakage causing water wastage and potential road damage.",
    "Traffic Signal": "Malfunctioning traffic signal creating traffic management issues.",
    "Graffiti": "Unauthorized graffiti on public property requiring cleaning.",
    "Park Maintenance": "Park facilities requiring maintenance and repair for public safety.",
  };
  return descriptions[title as keyof typeof descriptions] || 
    `Issue related to ${category} requiring immediate attention.`;
};

// Typing text component
const TypedText = ({ text, speed = 50, className = "" }: { text: string; speed?: number; className?: string }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const currentIndex = useRef(0);

  useEffect(() => {
    if (isTyping && currentIndex.current < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex.current]);
        currentIndex.current += 1;
      }, speed);
      
      if (currentIndex.current >= text.length) {
        setIsTyping(false);
      }
      
      return () => clearTimeout(timer);
    } else if (!isTyping && currentIndex.current === text.length) {
      // Reset typing after a delay
      const resetTimer = setTimeout(() => {
        setDisplayedText("");
        currentIndex.current = 0;
        setIsTyping(true);
      }, 3000);
      
      return () => clearTimeout(resetTimer);
    }
  }, [displayedText, isTyping, text, speed]);

  return <span className={className}>{displayedText}<span className="animate-pulse">|</span></span>;
};

export default function UserDashboard() {
  const [selectedTab, setSelectedTab] = useState<"report" | "vouchers" | "progress">("report");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
  });
  const [showCompanies, setShowCompanies] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [recentIssues, setRecentIssues] = useState<any[]>([]);
  const [isLoadingIssues, setIsLoadingIssues] = useState(true);
  const { user } = useAuth();

  const companies = [
    "Metro Supermarket",
    "City Hospital",
    "Urban Transport",
    "Green Energy Co.",
    "Local Pharmacy",
  ];

  const vouchers = [
    { id: 1, title: "10% Hospital Discount", points: 100, redeemed: false },
    { id: 2, title: "Shopping Gift Card $50", points: 200, redeemed: false },
    { id: 3, title: "Utility Bill Discount", points: 150, redeemed: true },
  ];

  const topReporters = [
    { id: 1, name: "John Doe", points: 500, issues: 15 },
    { id: 2, name: "Jane Smith", points: 450, issues: 12 },
    { id: 3, name: "Mike Johnson", points: 400, issues: 10 },
  ];

  // Fetch recent issues reported by the current user
  useEffect(() => {
    const fetchUserIssues = async () => {
      if (!user) {
        setIsLoadingIssues(false);
        return;
      }

      try {
        // First try to fetch from Supabase
        const { data, error } = await supabase
          .from('issues')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          setRecentIssues(data);
        } else {
          // If no data in Supabase, fall back to window.globalIssues
          const userIssues = window.globalIssues
            .filter(issue => issue.reporter === "Demo User")
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
          
          setRecentIssues(userIssues);
        }
      } catch (error) {
        console.error("Error fetching user issues:", error);
        toast.error("Failed to load recent issues");
        
        // Fall back to window.globalIssues
        const userIssues = window.globalIssues
          .filter(issue => issue.reporter === "Demo User")
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5);
        
        setRecentIssues(userIssues);
      } finally {
        setIsLoadingIssues(false);
      }
    };

    fetchUserIssues();
  }, [user]);

  const handleSampleProblemSelect = (problem: typeof sampleProblems[0]) => {
    setFormData({
      title: problem.title,
      description: generateDescription(problem.title, problem.category),
      location: formData.location,
    });
    toast.success("Problem template loaded");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const getCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFormData(prev => ({
            ...prev,
            location: `${latitude},${longitude}`
          }));
          toast.success("Current location detected");
        },
        (error) => {
          toast.error("Error getting location: " + error.message);
        }
      );
    } else {
      toast.error("Geolocation is not supported by your browser");
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.location) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      let imageUrl = null;
      
      // Upload image to Supabase Storage if available
      if (selectedImage && user) {
        const fileExt = selectedImage.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;
        
        try {
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('issue_images')
            .upload(filePath, selectedImage);
            
          if (uploadError) {
            throw uploadError;
          }
          
          if (uploadData) {
            // Get public URL for the uploaded image
            const { data: { publicUrl } } = supabase.storage
              .from('issue_images')
              .getPublicUrl(filePath);
              
            imageUrl = publicUrl;
          }
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError);
          // Continue without image if upload fails
        }
      }

      // Create issue object
      const newIssue = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        image_url: imageUrl || imagePreview,
        user_id: user?.id || 'anonymous',
      };

      // Try to save to Supabase if user is authenticated
      if (user) {
        const { data, error } = await supabase
          .from('issues')
          .insert([newIssue])
          .select();
          
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          // Add to recent issues
          setRecentIssues(prevIssues => [data[0], ...prevIssues.slice(0, 4)]);
        }
      }

      // Also save to window.globalIssues for demo purposes
      const localIssue = {
        id: Date.now(),
        ...formData,
        status: "pending",
        reporter: "Demo User",
        date: new Date().toISOString().split('T')[0],
        image: imagePreview,
      };
      
      window.globalIssues = [...(window.globalIssues || []), localIssue];
      
      // If not saved to Supabase, add to recent issues
      if (!user) {
        setRecentIssues(prevIssues => [localIssue, ...prevIssues.slice(0, 4)]);
      }
      
      toast.success("Problem reported successfully!");
      
      // Reset form
      setFormData({ title: "", description: "", location: "" });
      setSelectedImage(null);
      setImagePreview(null);
    } catch (error) {
      console.error("Error submitting issue:", error);
      toast.error("Failed to submit report. Please try again.");
    }
  };

  const handleVoucherRedeem = (voucher: any) => {
    setSelectedVoucher(voucher);
    setShowCompanies(true);
  };

  const handleCompanySelect = (company: string) => {
    toast.success(`Voucher redeemed at ${company}!`);
    setShowCompanies(false);
    setSelectedVoucher(null);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'text-green-400';
      case 'in progress':
        return 'text-blue-400';
      case 'pending':
      default:
        return 'text-yellow-400';
    }
  };

  return (
    <div className="min-h-screen p-6 space-y-8">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-0" />
      
      <div className="relative z-10">
        <div className="flex flex-wrap gap-4 mb-8">
          <Button
            onClick={() => setSelectedTab("report")}
            variant="glass"
            className={selectedTab === "report" ? "bg-white/20 shadow-lg shadow-white/10" : ""}
          >
            <MapPin className="mr-2" />
            Report Problem
          </Button>
          <Button
            onClick={() => setSelectedTab("vouchers")}
            variant="glass"
            className={selectedTab === "vouchers" ? "bg-white/20 shadow-lg shadow-white/10" : ""}
          >
            <Gift className="mr-2" />
            Vouchers
          </Button>
          <Button
            onClick={() => setSelectedTab("progress")}
            variant="glass"
            className={selectedTab === "progress" ? "bg-white/20 shadow-lg shadow-white/10" : ""}
          >
            <TrendingUp className="mr-2" />
            Track Progress
          </Button>
        </div>

        {selectedTab === "report" && (
          <Card className="p-6 neo-blur animate-fadeIn">
            <h2 className="text-2xl font-semibold mb-2 text-yellow-400 text-glow">
              <TypedText text="Report a Problem" speed={70} className="font-bold" />
            </h2>
            <p className="text-white/70 mb-4">Select from common issues or create your own report</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
              {sampleProblems.map((problem) => (
                <Button
                  key={problem.id}
                  onClick={() => handleSampleProblemSelect(problem)}
                  variant="glass"
                >
                  {problem.title}
                </Button>
              ))}
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Problem Title"
                className="w-full p-2 glass"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              <textarea
                placeholder="Problem Description"
                className="w-full p-2 glass h-32"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Location (e.g., '123 Main St' or coordinates)"
                  className="flex-1 p-2 glass"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
                <Button 
                  variant="glass"
                  className="button-shine"
                  onClick={getCurrentLocation}
                >
                  <MapPin className="mr-2" />
                  Get Location
                </Button>
              </div>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="image-upload"
                  onChange={handleImageChange}
                />
                <label htmlFor="image-upload">
                  <Button variant="glass" className="button-shine" asChild>
                    <span>
                      <Upload className="mr-2" />
                      Upload Media
                    </span>
                  </Button>
                </label>
                {imagePreview && (
                  <div className="relative w-full max-w-md">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="rounded-lg w-full h-48 object-cover"
                    />
                    <Button
                      variant="glass"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview(null);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
              <Button variant="glass" className="w-full button-shine" onClick={handleSubmit}>
                Submit Report
              </Button>
            </div>
          </Card>
        )}

        {selectedTab === "vouchers" && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
            <div className="col-span-full mb-2">
              <h2 className="text-2xl font-semibold text-yellow-400 text-glow">
                <TypedText text="Available Vouchers" speed={70} className="font-bold" />
              </h2>
              <p className="text-white/70">Redeem your points for exclusive benefits</p>
            </div>
            
            {vouchers.map((voucher) => (
              <Card key={voucher.id} className="p-6 neo-blur hover:scale-105 transition-duration-300">
                <Gift className="w-12 h-12 mb-4 text-yellow-400" />
                <h3 className="text-xl font-semibold mb-2 text-yellow-400">{voucher.title}</h3>
                <p className="text-white/70">{voucher.points} Points</p>
                <Button 
                  variant="glass"
                  className="mt-4 w-full button-shine"
                  disabled={voucher.redeemed}
                  onClick={() => handleVoucherRedeem(voucher)}
                >
                  {voucher.redeemed ? "Redeemed" : "Redeem Now"}
                </Button>
              </Card>
            ))}
          </div>
        )}

        {selectedTab === "progress" && (
          <Card className="p-6 neo-blur animate-fadeIn">
            <h2 className="text-2xl font-semibold mb-2 text-yellow-400 text-glow">
              <TypedText text="Your Recent Issues" speed={70} className="font-bold" />
            </h2>
            <p className="text-white/70 mb-4">Track the status of problems you've reported</p>
            
            <div className="space-y-4">
              {isLoadingIssues ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-white/70">Loading your recent issues...</p>
                </div>
              ) : recentIssues.length > 0 ? (
                recentIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="flex flex-col md:flex-row gap-4 p-4 glass rounded-lg"
                  >
                    {(issue.image_url || issue.image) && (
                      <div className="flex-shrink-0">
                        <img 
                          src={issue.image_url || issue.image} 
                          alt={issue.title} 
                          className="w-full md:w-24 h-24 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    <div className="flex-grow">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-yellow-400">{issue.title}</h3>
                        <span className={`text-sm px-2 py-1 rounded-full bg-white/10 ${getStatusColor(issue.status)}`}>
                          {issue.status || "Pending"}
                        </span>
                      </div>
                      <p className="text-white/70 text-sm line-clamp-2 mt-1">{issue.description}</p>
                      <div className="flex items-center mt-2 text-xs text-white/50">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>{issue.created_at ? new Date(issue.created_at).toLocaleDateString() : issue.date}</span>
                        <MapPin className="w-3 h-3 ml-3 mr-1" />
                        <span className="truncate">{issue.location}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center p-8 glass rounded-lg">
                  <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
                  <h3 className="text-yellow-400 text-lg font-semibold">No Issues Found</h3>
                  <p className="text-white/70 mt-2">You haven't reported any issues yet. Use the Report Problem tab to get started.</p>
                </div>
              )}
            </div>
          </Card>
        )}

        <Dialog open={showCompanies} onOpenChange={setShowCompanies}>
          <DialogContent className="glass">
            <DialogHeader>
              <DialogTitle>Select Redemption Location</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              {companies.map((company) => (
                <Button
                  key={company}
                  variant="glass"
                  className="button-shine"
                  onClick={() => handleCompanySelect(company)}
                >
                  {company}
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
