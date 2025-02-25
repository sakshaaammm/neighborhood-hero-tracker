
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

export default function UserDashboard() {
  const [selectedTab, setSelectedTab] = useState<"report" | "vouchers" | "progress">("report");

  // Mock data - replace with actual data from your backend
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
              />
              <textarea
                placeholder="Problem Description"
                className="w-full p-2 glass h-32"
              />
              <Button className="glass button-shine">
                <Upload className="mr-2" />
                Upload Media
              </Button>
              <Button className="w-full glass button-shine">Submit Report</Button>
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
      </div>
    </div>
  );
}
