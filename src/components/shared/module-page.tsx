"use client";

import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

interface ModulePageProps {
  title: string;
  subtitle: string;
  features: string[];
}

export function ModulePage({ title, subtitle, features }: ModulePageProps) {
  return (
    <>
      <Navbar title={title} subtitle={subtitle} />
      <div className="flex-1 px-4 pb-8 lg:px-6">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Card className="h-full hover:shadow-card-hover">
                <CardHeader>
                  <CardTitle className="text-base">{feature}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-500">
                    Enterprise-grade {feature.toLowerCase()} powered by AETHER AI. Fully integrated with your CRM pipeline.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
}
