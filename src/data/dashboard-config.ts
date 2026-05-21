export const WORKFLOW_STEPS = [
  { id: 1, key: "LEAD_ENTERED", label: "Lead Entered", subtitle: "New lead captured", icon: "user-plus", color: "purple" },
  { id: 2, key: "AI_CLASSIFICATION", label: "AI Classification", subtitle: "AI scores & categorizes", icon: "brain", color: "blue" },
  { id: 3, key: "ASSIGNED", label: "Assigned", subtitle: "Sales owner assigned", icon: "user-check", color: "green" },
  { id: 4, key: "FOLLOW_UP", label: "Follow-up", subtitle: "AI schedules follow-ups", icon: "calendar", color: "yellow" },
  { id: 5, key: "NURTURING", label: "Nurturing", subtitle: "Engagement tracking", icon: "trending-up", color: "orange" },
  { id: 6, key: "WON", label: "Won / Client", subtitle: "Converted to client", icon: "check-circle", color: "green" },
] as const;

export type NavItem = {
  href: string;
  label: string;
  icon: string;
  badge?: number;
};

export const NAV_SECTIONS: { label: string | null; items: NavItem[] }[] = [
  {
    label: null,
    items: [
      { href: "/", label: "Command Center", icon: "layout-dashboard" },
      { href: "/feed", label: "Operational Feed", icon: "radio" },
      { href: "/assistant", label: "AI Assistant", icon: "bot" },
    ],
  },
  {
    label: "WORKFLOWS",
    items: [
      { href: "/leads", label: "Leads", icon: "users" },
      { href: "/deals", label: "Deals", icon: "handshake" },
      { href: "/tasks", label: "Tasks & Approvals", icon: "check-square" },
      { href: "/projects", label: "Projects", icon: "folder-kanban" },
      { href: "/support", label: "Support", icon: "headphones" },
      { href: "/invoices", label: "Invoices", icon: "file-text" },
    ],
  },
  {
    label: "INTELLIGENCE",
    items: [
      { href: "/insights", label: "AI Insights", icon: "sparkles" },
      { href: "/reports", label: "Reports", icon: "bar-chart-3" },
      { href: "/predictions", label: "Predictions", icon: "line-chart" },
    ],
  },
  {
    label: "AUTOMATION",
    items: [
      { href: "/workflow-builder", label: "Workflow Builder", icon: "git-branch" },
      { href: "/automations", label: "Automations", icon: "zap" },
      { href: "/integrations", label: "Integrations", icon: "plug" },
    ],
  },
  {
    label: "SETTINGS",
    items: [
      { href: "/team", label: "Team", icon: "users-round" },
      { href: "/settings", label: "Settings", icon: "settings" },
    ],
  },
];
