"use client"

import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar } from "@/components/ui/calendar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Search, Filter, Phone, CalendarIcon, Users, FileText, Clock, Bot, Mic, Loader2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { apiClient } from "@/lib/api"
import { toast } from "sonner"
import { format } from "date-fns"

interface ReservationsProps {
  restaurantId: string
}

type ReservationStatus = "pending" | "confirmed" | "cancelled" | "completed"
type ReservationSource = "voice" | "chat" | "manual"

interface Reservation {
  id: number
  customer_name: string
  customer_phone: string
  customer_email?: string
  reservation_datetime: string
  guests: number
  status: ReservationStatus
  source: ReservationSource
  notes?: string
  special_requests?: string
  table_number?: number
  created_at: string
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  completed: "bg-blue-100 text-blue-800",
}

const statusLabels = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  completed: "Completada",
}

const sourceIcons = {
  voice: Mic,
  chat: Bot,
  manual: Users,
}

const sourceLabels = {
  voice: "Agente de Voz",
  chat: "Chatbot",
  manual: "Manual",
}

export function Reservations({ restaurantId }: ReservationsProps) {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalReservations, setTotalReservations] = useState(0)
  const [isUpdating, setIsUpdating] = useState(false)
  const itemsPerPage = 10

  const loadReservations = useCallback(async () => {
    try {
      setIsLoading(true)
      const dateFilter = selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined
      
      const response = await apiClient.getReservations({
        restaurantId,
        page: currentPage,
        limit: itemsPerPage,
        dateFilter,
        statusFilter: statusFilter === "all" ? undefined : statusFilter,
        search: searchTerm || undefined,
      })

      setReservations(response.items)
      setTotalPages(response.pages)
      setTotalReservations(response.total)
    } catch (error) {
      toast.error("Error loading reservations")
      console.error("Error loading reservations:", error)
    } finally {
      setIsLoading(false)
    }
  }, [restaurantId, currentPage, statusFilter, selectedDate, searchTerm])

  useEffect(() => {
    loadReservations()
  }, [loadReservations])

  const handleStatusChange = async (reservationId: number, newStatus: ReservationStatus) => {
    try {
      setIsUpdating(true)
      await apiClient.updateReservationStatus(reservationId, newStatus)
      
      // Update local state
      setReservations(prev => 
        prev.map(res => 
          res.id === reservationId 
            ? { ...res, status: newStatus }
            : res
        )
      )
      
      // Update selected reservation if it's the one being updated
      if (selectedReservation?.id === reservationId) {
        setSelectedReservation(prev => prev ? { ...prev, status: newStatus } : null)
      }
      
      toast.success(`Reservation ${statusLabels[newStatus].toLowerCase()}`)
    } catch (error) {
      toast.error("Error updating reservation status")
      console.error("Error updating reservation:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString)
    return {
      date: format(date, "dd/MM/yyyy"),
      time: format(date, "hh:mm a")
    }
  }

  if (isLoading && reservations.length === 0) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-[100px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
          
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 w-[180px]" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-[200px]" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle>Calendario</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar 
              mode="single" 
              selected={selectedDate} 
              onSelect={setSelectedDate} 
              className="rounded-md border" 
            />
          </CardContent>
        </Card>

        {/* Reservations List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre del cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="confirmed">Confirmada</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                    <SelectItem value="completed">Completada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Reservations Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                Reservas para {selectedDate?.toLocaleDateString("es-ES") || "Hoy"} ({totalReservations})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : reservations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No se encontraron reservas para los filtros seleccionados
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Fecha/Hora</TableHead>
                        <TableHead>Personas</TableHead>
                        <TableHead>Mesa</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fuente</TableHead>
                        <TableHead>Teléfono</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reservations.map((reservation) => {
                        const SourceIcon = sourceIcons[reservation.source]
                        const { date, time } = formatDateTime(reservation.reservation_datetime)
                        
                        return (
                          <TableRow
                            key={reservation.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => setSelectedReservation(reservation)}
                          >
                            <TableCell className="font-medium">
                              {reservation.customer_name}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>{date}</div>
                                <div className="text-muted-foreground">{time}</div>
                              </div>
                            </TableCell>
                            <TableCell>{reservation.guests}</TableCell>
                            <TableCell>
                              {reservation.table_number ? `Mesa ${reservation.table_number}` : "-"}
                            </TableCell>
                            <TableCell>
                              <Badge className={statusColors[reservation.status]}>
                                {statusLabels[reservation.status]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <SourceIcon className="h-4 w-4" />
                                <span className="text-sm">{sourceLabels[reservation.source]}</span>
                              </div>
                            </TableCell>
                            <TableCell>{reservation.customer_phone}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-4">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const pageNum = i + 1
                            return (
                              <PaginationItem key={pageNum}>
                                <PaginationLink
                                  onClick={() => setCurrentPage(pageNum)}
                                  isActive={currentPage === pageNum}
                                  className="cursor-pointer"
                                >
                                  {pageNum}
                                </PaginationLink>
                              </PaginationItem>
                            )
                          })}
                          <PaginationItem>
                            <PaginationNext
                              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reservation Details Sheet */}
      <Sheet open={!!selectedReservation} onOpenChange={() => setSelectedReservation(null)}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          {selectedReservation && (
            <>
              <SheetHeader>
                <SheetTitle>Detalles de la Reserva</SheetTitle>
                <SheetDescription>
                  Reserva #{selectedReservation.id} • Creada por {sourceLabels[selectedReservation.source]}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Customer Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Información del Cliente</h3>
                  <div className="grid gap-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{selectedReservation.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedReservation.customer_phone}</span>
                    </div>
                    {selectedReservation.customer_email && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Email:</span>
                        <span className="text-sm">{selectedReservation.customer_email}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Reservation Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Detalles de la Reserva</h3>
                  <div className="grid gap-3">
                    {(() => {
                      const { date, time } = formatDateTime(selectedReservation.reservation_datetime)
                      return (
                        <>
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{time}</span>
                          </div>
                        </>
                      )
                    })()}
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedReservation.guests} personas</span>
                    </div>
                    {selectedReservation.table_number && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Mesa:</span>
                        <span className="text-sm font-medium">Mesa {selectedReservation.table_number}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Estado:</span>
                      <Badge className={statusColors[selectedReservation.status]}>
                        {statusLabels[selectedReservation.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Creada por:</span>
                      <div className="flex items-center gap-1">
                        {React.createElement(sourceIcons[selectedReservation.source], { className: "h-4 w-4" })}
                        <span className="text-sm">{sourceLabels[selectedReservation.source]}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Notes and Special Requests */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Notas y Solicitudes</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Notas:</span>
                      </div>
                      <p className="text-sm text-muted-foreground pl-6">
                        {selectedReservation.notes || "Sin notas"}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Solicitudes especiales:</span>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedReservation.special_requests || "Ninguna"}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Action Buttons */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Acciones</h3>
                  <div className="flex flex-col gap-2">
                    {selectedReservation.status === "pending" && (
                      <Button
                        onClick={() => handleStatusChange(selectedReservation.id, "confirmed")}
                        className="w-full"
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Actualizando...
                          </>
                        ) : (
                          "Confirmar Reserva"
                        )}
                      </Button>
                    )}
                    {selectedReservation.status === "confirmed" && (
                      <Button
                        onClick={() => handleStatusChange(selectedReservation.id, "completed")}
                        className="w-full"
                        variant="outline"
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Actualizando...
                          </>
                        ) : (
                          "Marcar como Completada"
                        )}
                      </Button>
                    )}
                    {selectedReservation.status !== "cancelled" && selectedReservation.status !== "completed" && (
                      <Button
                        variant="destructive"
                        onClick={() => handleStatusChange(selectedReservation.id, "cancelled")}
                        className="w-full"
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Actualizando...
                          </>
                        ) : (
                          "Cancelar Reserva"
                        )}
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