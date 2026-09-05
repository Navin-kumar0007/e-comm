import { prisma } from "@/lib/db/prisma";
import { Crown, Sparkles, TrendingUp, Medal } from "lucide-react";
import AwardPointsDialog from "./award-points-dialog";

export default async function AdminPointsPage() {
  const users = await prisma.user.findMany({
    orderBy: { points: "desc" },
    select: { id: true, name: true, email: true, points: true }
  });

  // Filter out users with 0 points for the leaderboard, or show top 50
  const leaderboard = users.filter(u => u.points > 0).slice(0, 50);
  
  const getTier = (points: number) => {
    if (points >= 1500) return { name: "Platinum Vanilla", color: "bg-slate-600 text-white" };
    if (points >= 500) return { name: "Gold Saffron", color: "bg-yellow-600 text-white" };
    return { name: "Silver Clove", color: "bg-zinc-500 text-white" };
  };

  const totalPointsCirculating = users.reduce((acc, curr) => acc + curr.points, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-heading font-bold text-gray-900">Spice Points Hub</h1>
        <p className="text-muted-foreground mt-1">Manage loyalty program and customer tiers</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Points in Circulation</p>
            <p className="text-3xl font-bold text-gray-900">{totalPointsCirculating.toLocaleString()} <span className="text-sm font-normal text-gray-500">(₹{Math.floor(totalPointsCirculating/10).toLocaleString()} value)</span></p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Medal className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Active Members</p>
            <p className="text-3xl font-bold text-gray-900">{users.filter(u => u.points > 0).length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          <Crown className="w-5 h-5 text-amber-500" />
          <h2 className="font-bold text-gray-900">Points Leaderboard</h2>
        </div>
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 font-medium text-gray-500 w-12 text-center">Rank</th>
              <th className="p-4 font-medium text-gray-500">Customer</th>
              <th className="p-4 font-medium text-gray-500">Tier</th>
              <th className="p-4 font-medium text-gray-500">Points</th>
              <th className="p-4 font-medium text-gray-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {leaderboard.map((user, index) => {
              const tier = getTier(user.points);
              return (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-center font-bold text-gray-400">#{index + 1}</td>
                  <td className="p-4">
                    <div className="font-bold text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${tier.color}`}>
                      {tier.name}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-primary text-lg">
                    {user.points.toLocaleString()}
                  </td>
                  <td className="p-4 flex gap-2 justify-end">
                    <AwardPointsDialog userId={user.id} userName={user.name} currentPoints={user.points} />
                  </td>
                </tr>
              )
            })}
            {leaderboard.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">No members with points yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
