"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Users, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { apiClient } from "@/lib/api"

interface TablesProps {
  restaurantId: string
}

type TableStatus = "available" | "occupied" | "reserved" | "cleaning"

interface Table {
  id: number
  number: number
  capacity: number
  status: TableStatus
  current_reservation?: {
    id: number
    customer_name: string
    customer_phone: string
    reservation_datetime: string
    guests: number
    status: string
    special_requests?: string
  }
  location?: string
  restaurant_id: number
  created_at?: string
  updated_at?: string
}

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
  const [tables, setTables] = React.useState<Table[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Load tables data
  React.useEffect(() => {
    const loadTables = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await apiClient.getTablesWithReservations(restaurantId)
        setTables(data)
      } catch (err) {
        setError("Error al cargar las mesas")
        console.error("Error loading tables:", err)
      } finally {
        setLoading(false)
      }
    }

    if (restaurantId) {
      loadTables()
    }
  }, [restaurantId])

  const filteredTables = tables.filter((table) => {
    const matchesStatus = statusFilter === "all" || table.status === statusFilter
    const matchesCapacity =
      capacityFilter === "all" ||
      (capacityFilter === "small" && table.capacity <= 2) ||
      (capacityFilter === "medium" && table.capacity > 2 && table.capacity <= 4) ||
      (capacityFilter === "large" && table.capacity > 4)
    return matchesStatus && matchesCapacity
  })

  const stats = {
    total: tables.length,
    available: tables.filter((t) => t.status === "available").length,
    occupied: tables.filter((t) => t.status === "occupied").length,
    reserved: tables.filter((t) => t.status === "reserved").length,
    cleaning: tables.filter((t) => t.status === "cleaning").length,
  }

  const occupancyRate = stats.total > 0 ? Math.round(((stats.occupied + stats.reserved) / stats.total) * 100) : 0

  const handleUpdateTableStatus = async (tableId: number, newStatus: string) => {
    try {
      await apiClient.updateTableStatus(tableId, newStatus)
      // Refresh tables data
      const data = await apiClient.getTablesWithReservations(restaurantId)
      setTables(data)
      setSelectedTable(null)
    } catch (err) {
      console.error("Error updating table status:", err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando mesas...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">{error}</p>
        <Button 
          onClick={() => window.location.reload()} 
          className="mt-4"
          variant="outline"
        >
          Reintentar
        </Button>
      </div>
    )
  }

  const formatReservationTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString("es-ES", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

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
                  {table.location && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Ubicación:</span>
                      <span>{table.location}</span>
                    </div>
                  )}

                  {table.current_reservation && (
                    <div className="mt-3 p-2 bg-background/50 rounded">
                      <p className="font-medium">{table.current_reservation.customer_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatReservationTime(table.current_reservation.reservation_datetime)}{" "}
                        • {table.current_reservation.guests} personas
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredTables.length === 0 && !loading && (
        <div className="text-center p-8">
          <p className="text-muted-foreground">No se encontraron mesas con los filtros seleccionados.</p>
        </div>
      )}

      {/* Table Details Sheet */}
      <Sheet open={!!selectedTable} onOpenChange={() => setSelectedTable(null)}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          {selectedTable && (
            <>
              <SheetHeader>
                <SheetTitle>Mesa {selectedTable.number}</SheetTitle>
                <SheetDescription>
                  Capacidad: {selectedTable.capacity} personas
                  {selectedTable.location && ` • ${selectedTable.location}`}
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
                    {selectedTable.location && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Ubicación:</span>
                        <span className="text-sm">{selectedTable.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Current Reservation */}
                {selectedTable.current_reservation && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Reserva Actual</h3>
                      <div className="grid gap-3">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{selectedTable.current_reservation.customer_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {formatReservationTime(selectedTable.current_reservation.reservation_datetime)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedTable.current_reservation.guests} personas</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Teléfono:</span>
                          <span className="text-sm">{selectedTable.current_reservation.customer_phone}</span>
                        </div>
                        {selectedTable.current_reservation.special_requests && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Notas especiales:</span>
                            <span className="text-sm">{selectedTable.current_reservation.special_requests}</span>
                          </div>
                        )}
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
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => handleUpdateTableStatus(selectedTable.id, "available")}
                      >
                        Liberar Mesa
                      </Button>
                    )}
                    {selectedTable.status === "cleaning" && (
                      <Button 
                        className="w-full"
                        onClick={() => handleUpdateTableStatus(selectedTable.id, "available")}
                      >
                        Marcar como Disponible
                      </Button>
                    )}
                    {selectedTable.status === "available" && (
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => handleUpdateTableStatus(selectedTable.id, "cleaning")}
                      >
                        Marcar para Limpieza
                      </Button>
                    )}
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