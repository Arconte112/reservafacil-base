"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar } from "@/components/ui/calendar"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Search, Filter, Phone, CalendarIcon, Users, FileText, Clock, Bot, Mic } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface ReservationsProps {
  restaurantId: string
}

type ReservationStatus = "pending" | "confirmed" | "cancelled" | "completed"
type ReservationSource = "voice" | "chat" | "manual"

interface Reservation {
  id: string
  date: string
  time: string
  customerName: string
  guests: number
  status: ReservationStatus
  source: ReservationSource
  notes: string
  phone: string
  email: string
  specialRequests: string
  tableNumber?: number
  createdAt: string
}

// Datos simulados con fuente de reserva
const mockReservations: Reservation[] = [
  {
    id: "1",
    date: "2024-01-15",
    time: "20:00",
    customerName: "María García",
    guests: 4,
    status: "confirmed",
    source: "voice",
    notes: "Mesa junto a la ventana",
    phone: "+34 666 123 456",
    email: "maria@email.com",
    specialRequests: "Vegetariano, sin gluten",
    tableNumber: 5,
    createdAt: "2024-01-14 15:30",
  },
  {
    id: "2",
    date: "2024-01-15",
    time: "19:30",
    customerName: "Carlos López",
    guests: 2,
    status: "pending",
    source: "chat",
    notes: "Aniversario",
    phone: "+34 666 789 012",
    email: "carlos@email.com",
    specialRequests: "Postre especial",
    createdAt: "2024-01-15 10:15",
  },
  {
    id: "3",
    date: "2024-01-15",
    time: "21:00",
    customerName: "Ana Martín",
    guests: 6,
    status: "confirmed",
    source: "voice",
    notes: "Cena de empresa",
    phone: "+34 666 345 678",
    email: "ana@email.com",
    specialRequests: "Factura a nombre de empresa",
    tableNumber: 12,
    createdAt: "2024-01-14 09:45",
  },
  {
    id: "4",
    date: "2024-01-16",
    time: "20:30",
    customerName: "Pedro Ruiz",
    guests: 3,
    status: "cancelled",
    source: "chat",
    notes: "Cancelado por enfermedad",
    phone: "+34 666 901 234",
    email: "pedro@email.com",
    specialRequests: "",
    createdAt: "2024-01-15 14:20",
  },
  {
    id: "5",
    date: "2024-01-16",
    time: "19:00",
    customerName: "Laura Sánchez",
    guests: 2,
    status: "pending",
    source: "voice",
    notes: "Primera visita",
    phone: "+34 666 567 890",
    email: "laura@email.com",
    specialRequests: "Alergia a mariscos",
    createdAt: "2024-01-16 08:30",
  },
  {
    id: "6",
    date: "2024-01-17",
    time: "13:00",
    customerName: "Roberto Silva",
    guests: 4,
    status: "confirmed",
    source: "chat",
    notes: "Almuerzo familiar",
    phone: "+34 666 111 222",
    email: "roberto@email.com",
    specialRequests: "Silla alta para niño",
    tableNumber: 8,
    createdAt: "2024-01-16 16:45",
  },
]

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
  const [searchTerm, setSearchTerm] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date())
  const [selectedReservation, setSelectedReservation] = React.useState<Reservation | null>(null)
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 10

  const filteredReservations = mockReservations.filter((reservation) => {
    const matchesSearch = reservation.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || reservation.status === statusFilter
    const matchesDate = !selectedDate || reservation.date === selectedDate.toISOString().split("T")[0]
    return matchesSearch && matchesStatus && matchesDate
  })

  const totalPages = Math.ceil(filteredReservations.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedReservations = filteredReservations.slice(startIndex, startIndex + itemsPerPage)

  const handleStatusChange = (reservationId: string, newStatus: ReservationStatus) => {
    console.log(`Updating reservation ${reservationId} to ${newStatus}`)
    setSelectedReservation(null)
  }

  const todayReservations = mockReservations.filter((r) => r.date === new Date().toISOString().split("T")[0])
  const pendingCount = todayReservations.filter((r) => r.status === "pending").length
  const confirmedCount = todayReservations.filter((r) => r.status === "confirmed").length

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle>Calendario</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} className="rounded-md border" />
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
                Reservas para {selectedDate?.toLocaleDateString("es-ES") || "Hoy"} ({filteredReservations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Personas</TableHead>
                    <TableHead>Mesa</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fuente</TableHead>
                    <TableHead>Teléfono</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedReservations.map((reservation) => {
                    const SourceIcon = sourceIcons[reservation.source]
                    return (
                      <TableRow
                        key={reservation.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedReservation(reservation)}
                      >
                        <TableCell className="font-medium">
                          {new Date(reservation.date).toLocaleDateString("es-ES")}
                        </TableCell>
                        <TableCell className="font-medium">
                          {new Date(`2000-01-01 ${reservation.time}`).toLocaleTimeString("es-ES", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </TableCell>
                        <TableCell>{reservation.customerName}</TableCell>
                        <TableCell>{reservation.guests}</TableCell>
                        <TableCell>{reservation.tableNumber ? `Mesa ${reservation.tableNumber}` : "-"}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[reservation.status]}>{statusLabels[reservation.status]}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <SourceIcon className="h-4 w-4" />
                            <span className="text-sm">{sourceLabels[reservation.source]}</span>
                          </div>
                        </TableCell>
                        <TableCell>{reservation.phone}</TableCell>
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
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
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
                      <span className="font-medium">{selectedReservation.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedReservation.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Email:</span>
                      <span className="text-sm">{selectedReservation.email}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Reservation Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Detalles de la Reserva</h3>
                  <div className="grid gap-3">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(selectedReservation.date).toLocaleDateString("es-ES")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {new Date(`2000-01-01 ${selectedReservation.time}`).toLocaleTimeString("es-ES", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedReservation.guests} personas</span>
                    </div>
                    {selectedReservation.tableNumber && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Mesa:</span>
                        <span className="text-sm font-medium">Mesa {selectedReservation.tableNumber}</span>
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
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Creada:</span>
                      <span className="text-sm">{new Date(selectedReservation.createdAt).toLocaleString("es-ES")}</span>
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
                      <p className="text-sm text-muted-foreground pl-6">{selectedReservation.notes || "Sin notas"}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Solicitudes especiales:</span>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedReservation.specialRequests || "Ninguna"}
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
                      >
                        Confirmar Reserva
                      </Button>
                    )}
                    {selectedReservation.status === "confirmed" && (
                      <Button
                        onClick={() => handleStatusChange(selectedReservation.id, "completed")}
                        className="w-full"
                        variant="outline"
                      >
                        Marcar como Completada
                      </Button>
                    )}
                    {selectedReservation.status !== "cancelled" && selectedReservation.status !== "completed" && (
                      <Button
                        variant="destructive"
                        onClick={() => handleStatusChange(selectedReservation.id, "cancelled")}
                        className="w-full"
                      >
                        Cancelar Reserva
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
