
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
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

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

  const handleSubmit = () => {
    if (!formData.title || !formData.description || !formData.location) {
      toast.error("Please fill in all fields");
      return;
    }

    const newIssue = {
      id: Date.now(),
      ...formData,
      status: "pending",
      reporter: "Demo User",
      date: new Date().toISOString().split('T')[0],
      image: imagePreview,
    };

    // Add to window.globalIssues
    window.globalIssues = [...(window.globalIssues || []), newIssue];
    toast.success("Problem reported successfully!");
    
    // Reset form
    setFormData({ title: "", description: "", location: "" });
    setSelectedImage(null);
    setImagePreview(null);
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
