"use client";

import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

export default function IntegrationsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["integrations"],
    queryFn: async () => {
      const res = await fetch("/api/integrations");
      return res.json();
    },
  });

  const integrations = data?.integrations ?? [];

  return (
    <>
      <Navbar title="Integrations" subtitle="Connect your favorite tools to AETHER OS." />
      <div className="grid gap-4 px-4 pb-8 sm:grid-cols-2 lg:grid-cols-3 lg:px-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)
        ) : integrations.length === 0 ? (
          <div className="col-span-full">
            <EmptyState title="No integrations configured" description="Add integration records in your database to display them here." />
          </div>
        ) : (
          integrations.map((i: { id: string; name: string; isActive: boolean }) => (
            <Card key={i.id}>
              <CardContent className="flex items-center justify-between p-5">
                <span className="font-semibold">{i.name}</span>
                <Badge variant={i.isActive ? "success" : "outline"}>{i.isActive ? "Connected" : "Connect"}</Badge>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
