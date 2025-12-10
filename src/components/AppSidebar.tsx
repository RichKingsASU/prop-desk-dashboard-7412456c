import { 
  LayoutDashboard, 
  LineChart, 
  Monitor, 
  Wrench, 
  FlaskConical, 
  Database,
  Archive
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const tradingRoutes = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Options", url: "/options", icon: LineChart },
  { title: "Console", url: "/console/SPY", icon: Monitor },
];

const developmentRoutes = [
  { title: "Developer", url: "/developer", icon: Wrench },
  { title: "Test Hub", url: "/test", icon: FlaskConical },
  { title: "Supabase", url: "/test/supabase-dashboard", icon: Database },
];

const legacyRoutes = [
  { title: "Legacy Dashboard", url: "/legacy", icon: Archive },
];

interface NavItemProps {
  item: { title: string; url: string; icon: React.ComponentType<{ className?: string }> };
  collapsed: boolean;
}

function NavItem({ item, collapsed }: NavItemProps) {
  const content = (
    <SidebarMenuButton asChild>
      <NavLink 
        to={item.url} 
        end={item.url === "/"} 
        className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-sidebar-accent"
        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
      >
        <item.icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span>{item.title}</span>}
      </NavLink>
    </SidebarMenuButton>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {item.title}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="pt-4">
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/60 px-3 mb-2">
              Trading
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {tradingRoutes.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <NavItem item={item} collapsed={collapsed} />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/60 px-3 mb-2 mt-4">
              Development
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {developmentRoutes.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <NavItem item={item} collapsed={collapsed} />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/60 px-3 mb-2 mt-4">
              Legacy
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {legacyRoutes.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <NavItem item={item} collapsed={collapsed} />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
