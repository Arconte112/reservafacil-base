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
import { apiClient } from "@/lib/api"

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
  const [selectedRestaurant, setSelectedRestaurant] = React.useState("")
  const [restaurants, setRestaurants] = React.useState<Array<{
    id: number
    name: string
    slug: string
  }>>([])
  const [loadingRestaurants, setLoadingRestaurants] = React.useState(true)
  const { user, logout } = useAuth()

  React.useEffect(() => {
    const loadRestaurants = async () => {
      try {
        setLoadingRestaurants(true)
        const data = await apiClient.getRestaurants()
        setRestaurants(data)
        // Set the first restaurant as default if available
        if (data.length > 0 && !selectedRestaurant) {
          setSelectedRestaurant(data[0].id.toString())
        }
      } catch (error) {
        console.error("Error loading restaurants:", error)
      } finally {
        setLoadingRestaurants(false)
      }
    }

    // Only load restaurants on client side to avoid hydration mismatch
    if (typeof window !== 'undefined') {
      loadRestaurants()
    }
  }, [])

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
            <Select 
              value={selectedRestaurant} 
              onValueChange={setSelectedRestaurant}
              disabled={loadingRestaurants}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={loadingRestaurants ? "Cargando..." : "Seleccionar restaurante"} />
              </SelectTrigger>
              <SelectContent>
                {restaurants.map((restaurant) => (
                  <SelectItem key={restaurant.id} value={restaurant.id.toString()}>
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
          {!selectedRestaurant || loadingRestaurants ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">
                {loadingRestaurants ? "Cargando restaurantes..." : "Selecciona un restaurante para continuar"}
              </p>
            </div>
          ) : (
            <>
              {activeView === "dashboard" && <Dashboard restaurantId={selectedRestaurant} />}
              {activeView === "reservations" && <Reservations restaurantId={selectedRestaurant} />}
              {activeView === "tables" && <Tables restaurantId={selectedRestaurant} />}
              {activeView === "config" && <Configuration restaurantId={selectedRestaurant} />}
            </>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
    </ProtectedRoute>
  )
}
