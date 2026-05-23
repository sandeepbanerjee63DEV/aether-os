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
  ai?: boolean;
};

export type NavSection = {
  id: string;
  label: string;
  items: NavItem[];
  defaultOpen?: boolean;
  accent?: "intelligence";
};

export const NAV_SECTIONS: NavSection[] = [
  {
    id: "command",
    label: "COMMAND CENTER",
    defaultOpen: true,
    items: [
      { href: "/", label: "Dashboard", icon: "layout-dashboard" },
      { href: "/feed", label: "Operational Feed", icon: "radio" },
      { href: "/assistant", label: "AI Assistant", icon: "bot", ai: true },
      { href: "/notifications", label: "Notifications Center", icon: "bell" },
      { href: "/activity", label: "Activity Stream", icon: "activity" },
    ],
  },
  {
    id: "workflows",
    label: "WORKFLOWS",
    defaultOpen: true,
    items: [
      { href: "/leads", label: "Leads", icon: "users" },
      { href: "/deals", label: "Deals", icon: "handshake" },
      { href: "/tasks", label: "Tasks & Approvals", icon: "check-square" },
      { href: "/projects", label: "Projects", icon: "folder-kanban" },
      { href: "/support", label: "Support", icon: "headphones" },
      { href: "/invoices", label: "Invoices", icon: "file-text" },
      { href: "/clients", label: "Clients", icon: "building-2" },
      { href: "/contracts", label: "Contracts", icon: "file-signature" },
      { href: "/meetings", label: "Meetings", icon: "calendar-days" },
      { href: "/documents", label: "Documents", icon: "files" },
      { href: "/knowledge-base", label: "Knowledge Base", icon: "book-open" },
    ],
  },
  {
    id: "intelligence",
    label: "INTELLIGENCE",
    defaultOpen: true,
    accent: "intelligence",
    items: [
      { href: "/insights", label: "AI Insights", icon: "sparkles", ai: true },
      { href: "/reports", label: "Reports", icon: "bar-chart-3" },
      { href: "/predictions", label: "Predictions", icon: "line-chart" },
      { href: "/intelligence/team", label: "Team Intelligence", icon: "users-round" },
      { href: "/intelligence/revenue", label: "Revenue Intelligence", icon: "dollar-sign" },
      { href: "/intelligence/customer", label: "Customer Intelligence", icon: "heart" },
      { href: "/intelligence/sales", label: "Sales Intelligence", icon: "target" },
      { href: "/intelligence/workforce", label: "Workforce Intelligence", icon: "briefcase" },
      { href: "/intelligence/risk", label: "Risk Intelligence", icon: "shield-alert" },
      { href: "/intelligence/operational", label: "Operational Intelligence", icon: "gauge" },
      { href: "/intelligence/memory", label: "AI Memory", icon: "brain", ai: true },
      { href: "/intelligence/behavioral", label: "Behavioral Analytics", icon: "mouse-pointer-click" },
      { href: "/intelligence/forecasting", label: "Forecasting Center", icon: "trending-up" },
    ],
  },
  {
    id: "automation",
    label: "AUTOMATION",
    defaultOpen: false,
    items: [
      { href: "/workflow-builder", label: "Workflow Builder", icon: "git-branch" },
      { href: "/automations", label: "Automations", icon: "zap" },
      { href: "/integrations", label: "Integrations", icon: "plug" },
      { href: "/automation/agents", label: "AI Agents", icon: "cpu", ai: true },
      { href: "/automation/triggers", label: "Trigger Engine", icon: "cable" },
      { href: "/automation/actions", label: "Action Center", icon: "crosshair" },
      { href: "/automation/process", label: "Process Automation", icon: "workflow" },
      { href: "/automation/api", label: "API Connections", icon: "webhook" },
    ],
  },
  {
    id: "settings",
    label: "SETTINGS",
    defaultOpen: false,
    items: [
      { href: "/team", label: "Team", icon: "users-round" },
      { href: "/organization", label: "Organization", icon: "building" },
      { href: "/settings/roles", label: "Roles & Permissions", icon: "key-round" },
      { href: "/settings/departments", label: "Departments", icon: "network" },
      { href: "/settings/billing", label: "Billing", icon: "credit-card" },
      { href: "/settings/security", label: "Security Center", icon: "shield-check" },
      { href: "/settings/audit", label: "Audit Logs", icon: "scroll-text" },
      { href: "/settings/api-keys", label: "API Keys", icon: "key" },
      { href: "/settings", label: "Workspace Settings", icon: "settings" },
      { href: "/settings/notifications", label: "Notifications Settings", icon: "bell-ring" },
      { href: "/settings/ai", label: "AI Configuration", icon: "sliders", ai: true },
      { href: "/settings/branding", label: "Branding", icon: "palette" },
    ],
  },
];

export const BOTTOM_NAV: NavItem[] = [
  { href: "/help", label: "Help & Support", icon: "help-circle" },
  { href: "/status", label: "System Status", icon: "activity" },
  { href: "/feedback", label: "Feedback Center", icon: "message-square" },
];
