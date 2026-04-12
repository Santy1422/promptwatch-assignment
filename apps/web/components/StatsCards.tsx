import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { Globe, Link, BarChart3, Bot } from "lucide-react";

interface StatsCardsProps {
  totalUrls: number;
  uniqueDomains: number;
  avgVisibilityScore: number;
  mostActiveModel: string;
  isLoading: boolean;
}

function getScoreLabel(score: number): { text: string; color: string } {
  if (score > 80) return { text: "Excellent", color: "text-emerald-600" };
  if (score >= 60) return { text: "Good", color: "text-yellow-600" };
  if (score > 0) return { text: "Needs work", color: "text-red-600" };
  return { text: "", color: "" };
}

const statsConfig = [
  {
    key: "totalUrls" as const,
    label: "Total URLs",
    subtitle: "Tracked entries",
    icon: Link,
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: "uniqueDomains" as const,
    label: "Unique Domains",
    subtitle: "Distinct websites",
    icon: Globe,
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: "avgVisibilityScore" as const,
    label: "Avg Visibility",
    subtitle: "Across all entries",
    icon: BarChart3,
    format: (v: number) => v.toFixed(1),
  },
];

export function StatsCards({
  totalUrls,
  uniqueDomains,
  avgVisibilityScore,
  mostActiveModel,
  isLoading,
}: StatsCardsProps) {
  const values = { totalUrls, uniqueDomains, avgVisibilityScore };

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const scoreLabel = getScoreLabel(avgVisibilityScore);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statsConfig.map(({ key, label, subtitle, icon: Icon, format }) => (
        <Card key={key}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {format(values[key])}
              {key === "avgVisibilityScore" && scoreLabel.text && (
                <span className={`text-xs font-medium ml-2 ${scoreLabel.color}`}>
                  {scoreLabel.text}
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          </CardContent>
        </Card>
      ))}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Top AI Model</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{mostActiveModel}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Most mentioned model</p>
        </CardContent>
      </Card>
    </div>
  );
}
