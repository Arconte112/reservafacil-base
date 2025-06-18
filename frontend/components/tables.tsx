"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Users, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface TablesProps {
  restaurantId: string
}

type TableStatus = "available" | "occupied" | "reserved" | "cleaning"

interface Table {
  id: string
  number: number
  capacity: number
  status: TableStatus
  currentReservation?: {
    customerName: string
    time: string
    guests: number
    phone: string
  }
  location: string
  features: string[]
}

// Datos simulados de mesas
const mockTables: Table[] = [
  {
    id: "1",
    number: 1,
    capacity: 2,
    status: "occupied",
    currentReservation: {
      customerName: "María García",
      time: "20:00",
      guests: 2,
      phone: "+34 666 123 456",
    },
    location: "Ventana",
    features: ["Vista exterior", "Romántica"],
  },
  {
    id: "2",
    number: 2,
    capacity: 4,
    status: "available",
    location: "Centro",
    features: ["Familiar"],
  },
  {
    id: "3",
    number: 3,
    capacity: 2,
    status: "reserved",
    currentReservation: {
      customerName: "Carlos López",
      time: "21:30",
      guests: 2,
      phone: "+34 666 789 012",
    },
    location: "Ventana",
    features: ["Vista exterior"],
  },
  {
    id: "4",
    number: 4,
    capacity: 6,
    status: "available",
    location: "Centro",
    features: ["Grupos", "Espaciosa"],
  },
  {
    id: "5",
    number: 5,
    capacity: 4,
    status: "cleaning",
    location: "Terraza",
    features: ["Exterior", "Familiar"],
  },
  {
    id: "6",
    number: 6,
    capacity: 8,
    status: "reserved",
    currentReservation: {
      customerName: "Ana Martín",
      time: "19:30",
      guests: 6,
      phone: "+34 666 345 678",
    },
    location: "Privado",
    features: ["Privada", "Empresarial"],
  },
  {
    id: "7",
    number: 7,
    capacity: 2,
    status: "available",
    location: "Barra",
    features: ["Informal", "Rápida"],
  },
  {
    id: "8",
    number: 8,
    capacity: 4,
    status: "occupied",
    currentReservation: {
      customerName: "Pedro Ruiz",
      time: "20:30",
      guests: 3,
      phone: "+34 666 901 234",
    },
    location: "Centro",
    features: ["Familiar"],
  },
  {
    id: "9",
    number: 9,
    capacity: 2,
    status: "available",
    location: "Ventana",
    features: ["Vista exterior", "Romántica"],
  },
  {
    id: "10",
    number: 10,
    capacity: 4,
    status: "reserved",
    currentReservation: {
      customerName: "Laura Sánchez",
      time: "22:00",
      guests: 4,
      phone: "+34 666 567 890",
    },
    location: "Terraza",
    features: ["Exterior", "Familiar"],
  },
  {
    id: "11",
    number: 11,
    capacity: 6,
    status: "available",
    location: "Centro",
    features: ["Grupos", "Espaciosa"],
  },
  {
    id: "12",
    number: 12,
    capacity: 10,
    status: "occupied",
    currentReservation: {
      customerName: "Roberto Silva",
      time: "19:00",
      guests: 8,
      phone: "+34 666 111 222",
    },
    location: "Privado",
    features: ["Privada", "Eventos"],
  },
]

const statusColors = {
  available: "bg-green-100 text-green-800 border-green-200",
  occupied: "bg-red-100 text-red-800 border-red-200",
  reserved: "bg-yellow-100 text-yellow-800 border-yellow-200",
  cleaning: "bg-gray-100 text-gray-800 border-gray-200",
}

const statusLabels = {
  available: "Disponible",
  occupied: "Ocupada",
  reserved: "Reservada",
  cleaning: "Limpieza",
}

const statusIcons = {
  available: CheckCircle,
  occupied: Users,
  reserved: Clock,
  cleaning: AlertCircle,
}

export function Tables({ restaurantId }: TablesProps) {
  const [selectedTable, setSelectedTable] = React.useState<Table | null>(null)
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [capacityFilter, setCapacityFilter] = React.useState<string>("all")

  const filteredTables = mockTables.filter((table) => {
    const matchesStatus = statusFilter === "all" || table.status === statusFilter
    const matchesCapacity =
      capacityFilter === "all" ||
      (capacityFilter === "small" && table.capacity <= 2) ||
      (capacityFilter === "medium" && table.capacity > 2 && table.capacity <= 4) ||
      (capacityFilter === "large" && table.capacity > 4)
    return matchesStatus && matchesCapacity
  })

  const stats = {
    total: mockTables.length,
    available: mockTables.filter((t) => t.status === "available").length,
    occupied: mockTables.filter((t) => t.status === "occupied").length,
    reserved: mockTables.filter((t) => t.status === "reserved").length,
    cleaning: mockTables.filter((t) => t.status === "cleaning").length,
  }

  const occupancyRate = Math.round(((stats.occupied + stats.reserved) / stats.total) * 100)

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Mesas</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Disponibles</p>
                <p className="text-2xl font-bold text-green-600">{stats.available}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ocupadas</p>
                <p className="text-2xl font-bold text-red-600">{stats.occupied}</p>
              </div>
              <Users className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reservadas</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.reserved}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ocupación</p>
                <p className="text-2xl font-bold text-blue-600">{occupancyRate}%</p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="available">Disponible</SelectItem>
                <SelectItem value="occupied">Ocupada</SelectItem>
                <SelectItem value="reserved">Reservada</SelectItem>
                <SelectItem value="cleaning">Limpieza</SelectItem>
              </SelectContent>
            </Select>
            <Select value={capacityFilter} onValueChange={setCapacityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Capacidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las capacidades</SelectItem>
                <SelectItem value="small">Pequeñas (1-2)</SelectItem>
                <SelectItem value="medium">Medianas (3-4)</SelectItem>
                <SelectItem value="large">Grandes (5+)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tables Grid */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        {filteredTables.map((table) => {
          const StatusIcon = statusIcons[table.status]
          return (
            <Card
              key={table.id}
              className={`cursor-pointer transition-all hover:shadow-md border-2 ${statusColors[table.status]}`}
              onClick={() => setSelectedTable(table)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">Mesa {table.number}</span>
                    <StatusIcon className="h-4 w-4" />
                  </div>
                  <Badge className={statusColors[table.status]}>{statusLabels[table.status]}</Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Capacidad: {table.capacity} personas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Ubicación:</span>
                    <span>{table.location}</span>
                  </div>

                  {table.currentReservation && (
                    <div className="mt-3 p-2 bg-background/50 rounded">
                      <p className="font-medium">{table.currentReservation.customerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(`2000-01-01 ${table.currentReservation.time}`).toLocaleTimeString("es-ES", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}{" "}
                        • {table.currentReservation.guests} personas
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Table Details Sheet */}
      <Sheet open={!!selectedTable} onOpenChange={() => setSelectedTable(null)}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          {selectedTable && (
            <>
              <SheetHeader>
                <SheetTitle>Mesa {selectedTable.number}</SheetTitle>
                <SheetDescription>
                  Capacidad: {selectedTable.capacity} personas • {selectedTable.location}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Table Status */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Estado Actual</h3>
                  <div className="flex items-center gap-3">
                    {React.createElement(statusIcons[selectedTable.status], { className: "h-6 w-6" })}
                    <Badge className={statusColors[selectedTable.status]} variant="outline">
                      {statusLabels[selectedTable.status]}
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Table Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Detalles de la Mesa</h3>
                  <div className="grid gap-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>Capacidad: {selectedTable.capacity} personas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Ubicación:</span>
                      <span className="text-sm">{selectedTable.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Características:</span>
                      <div className="flex gap-1">
                        {selectedTable.features.map((feature) => (
                          <Badge key={feature} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Current Reservation */}
                {selectedTable.currentReservation && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Reserva Actual</h3>
                      <div className="grid gap-3">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{selectedTable.currentReservation.customerName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {new Date(`2000-01-01 ${selectedTable.currentReservation.time}`).toLocaleTimeString(
                              "es-ES",
                              {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              },
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedTable.currentReservation.guests} personas</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Teléfono:</span>
                          <span className="text-sm">{selectedTable.currentReservation.phone}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Actions */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Acciones</h3>
                  <div className="flex flex-col gap-2">
                    {selectedTable.status === "occupied" && (
                      <Button className="w-full" variant="outline">
                        Liberar Mesa
                      </Button>
                    )}
                    {selectedTable.status === "cleaning" && <Button className="w-full">Marcar como Disponible</Button>}
                    {selectedTable.status === "available" && (
                      <Button className="w-full" variant="outline">
                        Marcar para Limpieza
                      </Button>
                    )}
                    <Button variant="outline" className="w-full">
                      Ver Historial
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
