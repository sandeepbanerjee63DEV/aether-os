import { TeamSubnav } from "@/components/team/team-subnav";

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TeamSubnav />
      {children}
    </>
  );
}
