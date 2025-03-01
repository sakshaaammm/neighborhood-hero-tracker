
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
  User,
  Award,
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [isLoadingPoints, setIsLoadingPoints] = useState(true);
  const [myIssues, setMyIssues] = useState<any[]>([]);
  const [isLoadingIssues, setIsLoadingIssues] = useState(true);

  const { user, isAuthenticated } = useAuth();

  const companies = [
    "Metro Supermarket",
    "City Hospital",
    "Urban Transport",
    "Green Energy Co.",
    "Local Pharmacy",
  ];

  const [vouchers, setVouchers] = useState([
    { id: 1, title: "10% Hospital Discount", points: 100, redeemed: false },
    { id: 2, title: "Shopping Gift Card $50", points: 200, redeemed: false },
    { id: 3, title: "Utility Bill Discount", points: 150, redeemed: true },
  ]);

  const [topReporters, setTopReporters] = useState([
    { id: 1, name: "John Doe", points: 500, issues: 15 },
    { id: 2, name: "Jane Smith", points: 450, issues: 12 },
    { id: 3, name: "Mike Johnson", points: 400, issues: 10 },
  ]);

  useEffect(() => {
    // Fetch user points if authenticated
    const fetchUserData = async () => {
      if (!isAuthenticated || !user) return;
      
      setIsLoadingPoints(true);
      
      try {
        // Get user profile and points
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('points, username')
          .eq('id', user.id)
          .single();
          
        if (profileError) {
          console.error("Error fetching profile:", profileError);
        } else if (profileData) {
          setUserPoints(profileData.points || 0);
        }
        
        // Fetch user's submitted issues
        const { data: issuesData, error: issuesError } = await supabase
          .from('issues')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (issuesError) {
          console.error("Error fetching user issues:", issuesError);
        } else if (issuesData) {
          setMyIssues(issuesData.map(issue => ({
            ...issue,
            date: new Date(issue.created_at || Date.now()).toLocaleDateString(),
          })));
        }
        
        // Fetch top reporters
        const { data: topData, error: topError } = await supabase
          .from('profiles')
          .select('id, username, points')
          .order('points', { ascending: false })
          .limit(5);
          
        if (topError) {
          console.error("Error fetching top reporters:", topError);
        } else if (topData) {
          // For each user, count their issues
          const topWithIssues = await Promise.all(topData.map(async (reporter) => {
            const { count, error } = await supabase
              .from('issues')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', reporter.id);
              
            return {
              id: reporter.id,
              name: reporter.username || "Anonymous",
              points: reporter.points || 0,
              issues: count || 0
            };
          }));
          
          setTopReporters(topWithIssues);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to load user data");
      } finally {
        setIsLoadingPoints(false);
        setIsLoadingIssues(false);
      }
    };

    fetchUserData();
    
    // Set up a subscription for real-time updates to the user's points
    const pointsSubscription = supabase
      .channel('profiles-changes')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user?.id}` }, 
        (payload) => {
          console.log('Profile change received:', payload);
          // Update points if they changed
          if (payload.new && payload.new.points !== undefined) {
            setUserPoints(payload.new.points || 0);
            toast.success(`Your points have been updated: ${payload.new.points}`);
          }
        }
      )
      .subscribe();
      
    // Set up a subscription for new issues
    const issuesSubscription = supabase
      .channel('user-issues-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'issues', filter: `user_id=eq.${user?.id}` }, 
        (payload) => {
          console.log('Issue change received:', payload);
          // Refresh user issues when there's a change
          if (user) {
            supabase
              .from('issues')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .then(({ data, error }) => {
                if (!error && data) {
                  setMyIssues(data.map(issue => ({
                    ...issue,
                    date: new Date(issue.created_at || Date.now()).toLocaleDateString(),
                  })));
                }
              });
          }
        }
      )
      .subscribe();
      
    return () => {
      pointsSubscription.unsubscribe();
      issuesSubscription.unsubscribe();
    };
  }, [isAuthenticated, user]);

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
    if (!isAuthenticated || !user) {
      toast.error("You must be logged in to report a problem");
      return;
    }
    
    if (!formData.title || !formData.description || !formData.location) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // First, if there's an image, upload it to Supabase storage
      let imageUrl = null;
      
      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('issue-images')
          .upload(fileName, selectedImage);
          
        if (uploadError) {
          console.error("Error uploading image:", uploadError);
          toast.error("Failed to upload image");
        } else if (uploadData) {
          // Get the public URL for the uploaded image
          const { data: { publicUrl } } = supabase.storage
            .from('issue-images')
            .getPublicUrl(uploadData.path);
            
          imageUrl = publicUrl;
        }
      }
      
      // Now create the issue record
      const { data, error } = await supabase
        .from('issues')
        .insert([
          {
            title: formData.title,
            description: formData.description,
            location: formData.location,
            user_id: user.id,
            image_url: imageUrl,
            status: 'pending',
          }
        ])
        .select();
        
      if (error) {
        console.error("Error creating issue:", error);
        toast.error("Failed to submit issue");
        return;
      }
      
      if (data) {
        // Update globalIssues for backward compatibility
        const newIssue = {
          id: data[0].id,
          title: data[0].title,
          description: data[0].description,
          location: data[0].location,
          status: 'pending',
          reporter: user.email || "Current User",
          user_id: user.id,
          date: new Date().toLocaleDateString(),
          image: imageUrl
        };
        
        if (typeof window !== 'undefined') {
          window.globalIssues = [...(window.globalIssues || []), newIssue];
        }
        
        toast.success("Problem reported successfully!");
        
        // Reset form
        setFormData({ title: "", description: "", location: "" });
        setSelectedImage(null);
        setImagePreview(null);
      }
    } catch (error) {
      console.error("Error in submit:", error);
      toast.error("An error occurred while submitting your report");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoucherRedeem = (voucher: any) => {
    setSelectedVoucher(voucher);
    setShowCompanies(true);
  };

  const handleCompanySelect = async (company: string) => {
    if (!user || !selectedVoucher) {
      toast.error("Something went wrong");
      setShowCompanies(false);
      return;
    }
    
    try {
      // Check if user has enough points
      if (userPoints < selectedVoucher.points) {
        toast.error("You don't have enough points for this voucher");
        setShowCompanies(false);
        return;
      }
      
      // Create a record of the voucher redemption
      const { error } = await supabase.from('user_vouchers').insert({
        user_id: user.id,
        voucher_id: selectedVoucher.id,
        redeemed_at_company: company
      });
      
      if (error) {
        console.error("Error redeeming voucher:", error);
        toast.error("Failed to redeem voucher");
        setShowCompanies(false);
        return;
      }
      
      // Deduct the points
      const { error: pointsError } = await supabase.rpc('award_points', {
        user_id: user.id,
        points_to_award: -selectedVoucher.points
      });
      
      if (pointsError) {
        console.error("Error deducting points:", pointsError);
        toast.error("Failed to deduct points");
      } else {
        // Update the vouchers list
        setVouchers(vouchers.map(v => 
          v.id === selectedVoucher.id ? { ...v, redeemed: true } : v
        ));
        
        toast.success(`Voucher redeemed at ${company}!`);
      }
    } catch (error) {
      console.error("Error in voucher redemption:", error);
      toast.error("An error occurred during redemption");
    } finally {
      setShowCompanies(false);
      setSelectedVoucher(null);
    }
  };

  return (
    <div className="min-h-screen p-6 space-y-8">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-0" />
      
      <div className="relative z-10">
        {isAuthenticated && (
          <div className="mb-4 glass p-3 rounded-lg flex justify-between items-center">
            <div>
              <span className="text-white/70">Hello, {user?.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="text-yellow-400" />
              <span className="text-yellow-400 font-bold">
                {isLoadingPoints ? "Loading..." : `${userPoints} Points`}
              </span>
            </div>
          </div>
        )}
      
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
              <Button 
                variant="glass" 
                className="w-full button-shine" 
                onClick={handleSubmit}
                disabled={isSubmitting || !isAuthenticated}
              >
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </Button>
              
              {!isAuthenticated && (
                <p className="text-yellow-400 text-center mt-2">
                  You must be logged in to submit a report
                </p>
              )}
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
              {isAuthenticated && (
                <p className="text-yellow-400 mt-2">You have {userPoints} points available</p>
              )}
            </div>
            
            {vouchers.map((voucher) => (
              <Card key={voucher.id} className="p-6 neo-blur hover:scale-105 transition-duration-300">
                <Gift className="w-12 h-12 mb-4 text-yellow-400" />
                <h3 className="text-xl font-semibold mb-2 text-yellow-400">{voucher.title}</h3>
                <p className="text-white/70">{voucher.points} Points</p>
                <Button 
                  variant="glass"
                  className="mt-4 w-full button-shine"
                  disabled={voucher.redeemed || !isAuthenticated || userPoints < voucher.points}
                  onClick={() => handleVoucherRedeem(voucher)}
                >
                  {!isAuthenticated 
                    ? "Login to Redeem" 
                    : voucher.redeemed 
                      ? "Redeemed" 
                      : userPoints < voucher.points
                        ? "Not Enough Points"
                        : "Redeem Now"}
                </Button>
              </Card>
            ))}
          </div>
        )}

        {selectedTab === "progress" && (
          <div className="space-y-6 animate-fadeIn">
            <Card className="p-6 neo-blur">
              <h2 className="text-2xl font-semibold mb-4 text-yellow-400 text-glow">
                <TypedText text="My Reports" speed={70} className="font-bold" />
              </h2>
              
              {isLoadingIssues ? (
                <p className="text-white/70">Loading your reports...</p>
              ) : myIssues.length > 0 ? (
                <div className="space-y-4">
                  {myIssues.map((issue) => (
                    <div key={issue.id} className="p-4 glass rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-yellow-400">{issue.title}</h3>
                        <div className={`px-3 py-1 rounded-full text-xs ${
                          issue.status === 'completed' ? 'bg-green-400/20 text-green-400' :
                          issue.status === 'in_progress' ? 'bg-yellow-400/20 text-yellow-400' :
                          'bg-blue-400/20 text-blue-400'
                        }`}>
                          {issue.status}
                        </div>
                      </div>
                      <p className="text-white/70">{issue.description}</p>
                      <div className="flex items-center gap-2 text-sm text-white/50">
                        <Clock size={16} />
                        <span>{issue.date}</span>
                        <span>•</span>
                        <MapPin size={16} />
                        <span>{issue.location}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/70">You haven't reported any issues yet.</p>
              )}
            </Card>
            
            <Card className="p-6 neo-blur">
              <h2 className="text-2xl font-semibold mb-4 text-yellow-400 text-glow">
                <TypedText text="Top Contributors" speed={70} className="font-bold" />
              </h2>
              <p className="text-white/70 mb-4">See how you rank among the city's problem solvers</p>
              
              <div className="space-y-4">
                {topReporters.map((reporter) => (
                  <div
                    key={reporter.id}
                    className="flex items-center justify-between p-4 glass rounded-lg"
                  >
                    <div>
                      <h3 className="font-semibold text-yellow-400">{reporter.name}</h3>
                      <p className="text-white/70">{reporter.issues} Issues Reported</p>
                    </div>
                    <div className="text-right">
                      <p className="text-yellow-400 font-bold">{reporter.points} Points</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
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
