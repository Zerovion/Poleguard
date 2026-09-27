import { Link, useRouterState } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";

const MotionLink = motion.create(Link);
const spring = { type: "spring" as const, stiffness: 320, damping: 28, mass: 0.8 };

import {
  Gauge,
  Info,
  LayoutDashboard,
  ListTree,
  Map as MapIcon,
  Settings as SettingsIcon,
  Zap,
} from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { devicesQuery } from "@/features/queries";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Live Monitoring", url: "/monitoring", icon: Gauge },
  { title: "Map View", url: "/map", icon: MapIcon },
  { title: "Alert History", url: "/alerts", icon: ListTree },
  { title: "Settings", url: "/settings", icon: SettingsIcon },
  { title: "About Project", url: "/about", icon: Info },
] as const;

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { data: devices } = useSuspenseQuery(devicesQuery());
  const allOnline = devices.every((d) => d.online);
  const reduced = useReducedMotion();


  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center gap-2.5">
          <div className="bg-gradient-accent flex size-9 shrink-0 items-center justify-center rounded-xl text-accent-foreground">
            <Zap className="size-5" />
          </div>
          {!collapsed && (
            <span className="text-lg font-semibold tracking-tight text-accent">PoleGuard</span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.url} className="relative">
                    {active && !reduced && (
                      <motion.span
                        layoutId="sidebar-active-pill"
                        className="pointer-events-none absolute inset-0 rounded-md bg-sidebar-accent"
                        transition={spring}
                        style={{ willChange: "transform" }}
                      />
                    )}
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className={
                        reduced
                          ? "relative z-10"
                          : "relative z-10 transition-colors data-[active=true]:bg-transparent"
                      }
                    >
                      <MotionLink
                        to={item.url}
                        className="flex items-center gap-2.5"
                        initial={false}
                        animate={{ scale: active ? 1 : 0.98 }}
                        whileHover={reduced ? undefined : { x: 4 }}
                        whileTap={reduced ? undefined : { scale: 0.97 }}
                        transition={spring}
                        style={{ willChange: "transform" }}
                      >
                        <item.icon className="size-4 transition-colors duration-300" />
                        {!collapsed && (
                          <span className="transition-colors duration-300">{item.title}</span>
                        )}
                      </MotionLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>


      {!collapsed && (
        <SidebarFooter className="p-3">
          <div className="panel space-y-2.5 p-3">
            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
              Connection Status
            </p>
            {devices.map((d) => (
              <div key={d.id} className="flex items-center justify-between text-xs">
                <span className="text-foreground/80">{d.name}</span>
                <span
                  className={`size-2 rounded-full ${d.online ? "bg-normal" : "bg-offline"}`}
                  aria-label={d.online ? "online" : "offline"}
                />
              </div>
            ))}
            <p className={`text-xs font-medium ${allOnline ? "text-normal" : "text-warning"}`}>
              {allOnline ? "All Systems Connected" : "Degraded Connectivity"}
            </p>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
