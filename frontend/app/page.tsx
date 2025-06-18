"use client"

import * as React from "react"
import { Calendar, ChefHat, Home, Grid3X3, Settings, LogOut, User } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Dashboard } from "@/components/dashboard"
import { Reservations } from "@/components/reservations"
import { Tables } from "@/components/tables"
import { Configuration } from "@/components/configuration"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const restaurants = [
  { id: "1", name: "Restaurante Central" },
  { id: "2", name: "Bistro Norte" },
  { id: "3", name: "Café del Sur" },
]

const navigation = [
  {
    title: "Dashboard",
    icon: Home,
    id: "dashboard",
  },
  {
    title: "Reservas",
    icon: Calendar,
    id: "reservations",
  },
  {
    title: "Mesas",
    icon: Grid3X3,
    id: "tables",
  },
  {
    title: "Configuración",
    icon: Settings,
    id: "config",
  },
]

export default function RestaurantApp() {
  const [activeView, setActiveView] = React.useState("dashboard")
  const [selectedRestaurant, setSelectedRestaurant] = React.useState("1")
  const { user, logout } = useAuth()

  return (
    <ProtectedRoute>
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <ChefHat className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">RestaurantApp</span>
                  <span className="text-xs">Dashboard Informativo</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navigation.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton isActive={activeView === item.id} onClick={() => setActiveView(item.id)}>
                  <item.icon className="size-4" />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />

          <div className="flex items-center gap-4 flex-1">
            <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Seleccionar restaurante" />
              </SelectTrigger>
              <SelectContent>
                {restaurants.map((restaurant) => (
                  <SelectItem key={restaurant.id} value={restaurant.id}>
                    {restaurant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="ml-auto flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                Agente IA Activo
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {user?.email}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          {activeView === "dashboard" && <Dashboard restaurantId={selectedRestaurant} />}
          {activeView === "reservations" && <Reservations restaurantId={selectedRestaurant} />}
          {activeView === "tables" && <Tables restaurantId={selectedRestaurant} />}
          {activeView === "config" && <Configuration restaurantId={selectedRestaurant} />}
        </main>
      </SidebarInset>
    </SidebarProvider>
    </ProtectedRoute>
  )
}
