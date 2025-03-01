
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Plus, ArrowUp, ArrowDown, MoreVertical, Trophy, Filter, Gift, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";

// Define types
interface Issue {
  id: number;
  title: string;
  description: string;
  location: string;
  status: string;
  created_at: string;
  image_url?: string;
}

interface Reporter {
  id: string;
  name: string;
  points: number;
  issues: number;
}

interface Company {
  id: number;
  name: string;
  logo: string;
  rewards: Reward[];
}

interface Reward {
  id: number;
  name: string;
  points: number;
  description: string;
}

// Sample data for companies and their rewards
const sampleCompanies: Company[] = [
  {
    id: 1,
    name: "GreenMart",
    logo: "🛒",
    rewards: [
      { id: 1, name: "10% Discount", points: 100, description: "Get 10% off your next purchase" },
      { id: 2, name: "Free Coffee", points: 50, description: "Enjoy a free coffee with any purchase" }
    ]
  },
  {
    id: 2,
    name: "EcoTech",
    logo: "💻",
    rewards: [
      { id: 3, name: "Recycling Kit", points: 150, description: "Home recycling starter kit" },
      { id: 4, name: "Phone Charger", points: 200, description: "Eco-friendly solar phone charger" }
    ]
  },
  {
    id: 3,
    name: "ParkView Cafe",
    logo: "☕",
    rewards: [
      { id: 5, name: "Free Sandwich", points: 120, description: "Redeem for a free sandwich" },
      { id: 6, name: "Breakfast Deal", points: 80, description: "Coffee and pastry combo" }
    ]
  }
];

export default function UserDashboard() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [newIssue, setNewIssue] = useState({
    title: "",
    description: "",
    location: "",
    image_url: "",
  });
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isReporting, setIsReporting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [isRewardDialogOpen, setIsRewardDialogOpen] = useState<boolean>(false);

  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!user) return;
    fetchUserIssues(user.id);
    fetchUserPoints(user.id);
  }, [user]);

  const fetchUserIssues = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("issues")
        .select("*")
        .eq("user_id", userId);

      if (error) {
        console.error("Error fetching issues:", error);
        setError(error.message);
        toast.error("Failed to load issues");
      } else {
        setIssues(data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPoints = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("points")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching user points:", error);
      } else if (data) {
        setUserPoints(data.points || 0);
      }
    } catch (error) {
      console.error("Unexpected error fetching user points:", error);
    }
  };

  const reportIssue = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.from("issues").insert([
        {
          ...newIssue,
          user_id: user.id,
          status: "pending",
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.error("Error reporting issue:", error);
        toast.error("Failed to report issue");
      } else {
        toast.success("Issue reported successfully!");
        setNewIssue({ title: "", description: "", location: "", image_url: "" });
        setIsReporting(false);
        fetchUserIssues(user.id); // Refresh issues
      }
    } catch (error) {
      console.error("Unexpected error reporting issue:", error);
      toast.error("An unexpected error occurred");
    }
  };

  const handleRewardSelection = (reward: Reward) => {
    setSelectedReward(reward);
    setIsRewardDialogOpen(true);
  };

  const handleRedeemReward = () => {
    if (!selectedReward || !user) return;
    
    // Check if user has enough points
    if (userPoints < selectedReward.points) {
      toast.error("Not enough points to redeem this reward");
      return;
    }

    // In a real app, this would create a record in the user_vouchers table
    // For demo purposes, we'll just simulate it
    toast.success(`You've redeemed: ${selectedReward.name}`);
    
    // Simulate updating user points
    const newPoints = userPoints - selectedReward.points;
    setUserPoints(newPoints);
    
    // Close dialog
    setIsRewardDialogOpen(false);
    setSelectedReward(null);
  };

  const sortedIssues = [...issues].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
  });

  const filteredIssues = sortedIssues.filter((issue) => {
    const matchesSearch =
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || issue.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">User Dashboard</h1>
      
      {/* Points Display */}
      <div className="bg-gradient-to-r from-green-200 to-blue-200 p-4 rounded-lg mb-4 flex justify-between items-center">
        <div className="flex items-center">
          <Trophy className="h-6 w-6 text-yellow-500 mr-2" />
          <div>
            <h2 className="text-lg font-semibold">Your Points</h2>
            <p className="text-2xl font-bold">{userPoints}</p>
          </div>
        </div>
        <div>
          <Button variant="default" className="bg-green-600 hover:bg-green-700">
            <Gift className="mr-2 h-4 w-4" /> View Rewards
          </Button>
        </div>
      </div>

      <Tabs defaultValue="my_issues" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="my_issues">My Issues</TabsTrigger>
          <TabsTrigger value="report_issue">Report Issue</TabsTrigger>
          <TabsTrigger value="rewards">Rewards Marketplace</TabsTrigger>
        </TabsList>

        <TabsContent value="my_issues">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">My Reported Issues</h2>
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  placeholder="Search issues..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-xs"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="mr-2 h-4 w-4" /> Filter by Status
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setFilterStatus("all")}>
                      All
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterStatus("pending")}>
                      Pending
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setFilterStatus("in_progress")}
                    >
                      In Progress
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterStatus("completed")}>
                      Completed
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                >
                  {sortOrder === "asc" ? (
                    <>
                      <ArrowUp className="mr-2 h-4 w-4" />
                      Oldest First
                    </>
                  ) : (
                    <>
                      <ArrowDown className="mr-2 h-4 w-4" />
                      Newest First
                    </>
                  )}
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-4">Loading issues...</div>
            ) : error ? (
              <div className="text-center text-red-500 py-4">{error}</div>
            ) : filteredIssues.length === 0 ? (
              <div className="text-center py-4">No issues found.</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredIssues.map((issue) => (
                      <TableRow key={issue.id}>
                        <TableCell>{issue.title}</TableCell>
                        <TableCell>{issue.location}</TableCell>
                        <TableCell>
                          <Badge variant={issue.status === "completed" ? "outline" : "secondary"}>
                            {issue.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(issue.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {issue.status === "completed" ? (
                            <span className="text-green-600 font-medium">+50</span>
                          ) : (
                            <span className="text-gray-400">Pending</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="report_issue">
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4">Report a New Issue</h2>
            <div className="grid gap-4">
              <div>
                <Input
                  type="text"
                  placeholder="Issue Title"
                  value={newIssue.title}
                  onChange={(e) =>
                    setNewIssue({ ...newIssue, title: e.target.value })
                  }
                />
              </div>
              <div>
                <Input
                  type="text"
                  placeholder="Location"
                  value={newIssue.location}
                  onChange={(e) =>
                    setNewIssue({ ...newIssue, location: e.target.value })
                  }
                />
              </div>
              <div>
                <Input
                  type="text"
                  placeholder="Description"
                  value={newIssue.description}
                  onChange={(e) =>
                    setNewIssue({ ...newIssue, description: e.target.value })
                  }
                />
              </div>
              <div>
                <Input
                  type="text"
                  placeholder="Image URL (optional)"
                  value={newIssue.image_url}
                  onChange={(e) =>
                    setNewIssue({ ...newIssue, image_url: e.target.value })
                  }
                />
              </div>
              <Button onClick={reportIssue} className="w-full">
                Report Issue
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="rewards">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sampleCompanies.map((company) => (
              <Card key={company.id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-100 to-purple-100 pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">
                      <span className="mr-2 text-2xl">{company.logo}</span>
                      {company.name}
                    </CardTitle>
                    <ShoppingBag className="h-5 w-5 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <h3 className="font-medium text-sm text-gray-500 mb-2">Available Rewards:</h3>
                  {company.rewards.map((reward) => (
                    <div 
                      key={reward.id} 
                      className="border rounded p-3 mb-2 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleRewardSelection(reward)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold">{reward.name}</h4>
                          <p className="text-sm text-gray-600">{reward.description}</p>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          <Trophy className="mr-1 h-3 w-3" /> 
                          {reward.points} pts
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Reward Redemption Dialog */}
      <Dialog open={isRewardDialogOpen} onOpenChange={setIsRewardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redeem Reward</DialogTitle>
            <DialogDescription>
              Are you sure you want to redeem this reward?
            </DialogDescription>
          </DialogHeader>
          
          {selectedReward && (
            <div className="py-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{selectedReward.name}</h3>
                <Badge variant="outline">
                  <Trophy className="mr-1 h-3 w-3" /> 
                  {selectedReward.points} points
                </Badge>
              </div>
              
              <p className="text-gray-700 mb-4">{selectedReward.description}</p>
              
              <div className="bg-gray-100 p-3 rounded-md flex justify-between items-center">
                <span className="text-sm">Your current points:</span>
                <span className="font-bold">{userPoints}</span>
              </div>
              
              {userPoints < selectedReward.points && (
                <p className="text-red-500 mt-2 text-sm">
                  You don't have enough points for this reward.
                </p>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRewardDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleRedeemReward}
              disabled={!selectedReward || userPoints < selectedReward.points}
            >
              Redeem Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
