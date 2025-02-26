import { useState } from "react";
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
import { useNavigate } from "react-router-dom";

// Initialize global issues array if it doesn't exist
if (typeof window !== 'undefined' && !window.hasOwnProperty('globalIssues')) {
  (window as any).globalIssues = [];
}
declare global {
  interface Window {
    globalIssues: any[];
  }
}

export default function UserDashboard() {
  const navigate = useNavigate();
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

  // Sample companies for voucher redemption
  const companies = [
    "Metro Supermarket",
    "City Hospital",
    "Urban Transport",
    "Green Energy Co.",
    "Local Pharmacy",
  ];

  // Mock data
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.description || !formData.location) {
      toast.error("Please fill in all fields");
      return;
    }

    // Validate location format (latitude,longitude)
    const [lat, lng] = formData.location.split(',').map(Number);
    if (isNaN(lat) || isNaN(lng)) {
      toast.error("Location must be in format: latitude,longitude (e.g., 40.7128,-74.0060)");
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

    // Add to window.globalIssues instead of globalIssues
    window.globalIssues.push(newIssue);
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
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm z-0" />
      
      <div className="relative z-10">
        <div className="flex flex-wrap gap-4 mb-8">
          <Button
            onClick={() => setSelectedTab("report")}
            className={`glass ${selectedTab === "report" ? "bg-white/20" : ""}`}
          >
            <MapPin className="mr-2" />
            Report Problem
          </Button>
          <Button
            onClick={() => setSelectedTab("vouchers")}
            className={`glass ${selectedTab === "vouchers" ? "bg-white/20" : ""}`}
          >
            <Gift className="mr-2" />
            Vouchers
          </Button>
          <Button
            onClick={() => setSelectedTab("progress")}
            className={`glass ${selectedTab === "progress" ? "bg-white/20" : ""}`}
          >
            <TrendingUp className="mr-2" />
            Track Progress
          </Button>
        </div>

        {selectedTab === "report" && (
          <Card className="p-6 glass animate-fadeIn">
            <h2 className="text-2xl font-semibold mb-4 text-glow">Report a Problem</h2>
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
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Location (format: latitude,longitude)"
                  className="w-full p-2 glass"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
                <p className="text-sm text-white/60">Example: 40.7128,-74.0060 (New York)</p>
                <Button
                  className="w-full glass button-shine"
                  onClick={() => navigate("/maps")}
                >
                  <MapPin className="mr-2" />
                  View All Problems on Map
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
                  <Button className="glass button-shine" asChild>
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
                      className="absolute top-2 right-2 glass"
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
              <Button className="w-full glass button-shine" onClick={handleSubmit}>
                Submit Report
              </Button>
            </div>
          </Card>
        )}

        {selectedTab === "vouchers" && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
            {vouchers.map((voucher) => (
              <Card key={voucher.id} className="p-6 glass hover:scale-105 transition-duration-300">
                <Gift className="w-12 h-12 mb-4 text-yellow-400" />
                <h3 className="text-xl font-semibold mb-2 text-glow">{voucher.title}</h3>
                <p className="text-white/70">{voucher.points} Points</p>
                <Button 
                  className="mt-4 w-full glass button-shine"
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
          <Card className="p-6 glass animate-fadeIn">
            <h2 className="text-2xl font-semibold mb-4 text-glow">Top Contributors</h2>
            <div className="space-y-4">
              {topReporters.map((reporter) => (
                <div
                  key={reporter.id}
                  className="flex items-center justify-between p-4 glass rounded-lg"
                >
                  <div>
                    <h3 className="font-semibold text-glow">{reporter.name}</h3>
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
                  className="glass button-shine"
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
