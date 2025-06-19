"use client"

import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "sonner"
import { Loader2, Save } from "lucide-react"
import { apiClient } from "@/lib/api"

interface ConfigurationProps {
  restaurantId: string
}

const configSchema = z.object({
  work_days: z.array(z.number()).min(1, "Select at least one working day"),
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  table_turnover_minutes: z.number().min(0, "Must be 0 or greater"),
  last_booking_cutoff_minutes: z.number().min(0, "Must be 0 or greater"),
})

type ConfigFormData = z.infer<typeof configSchema>

const weekDays = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
  { value: 7, label: "Dom" },
]

export function Configuration({ restaurantId }: ConfigurationProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [restaurantName, setRestaurantName] = useState("")

  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      work_days: [1, 2, 3, 4, 5],
      start_time: "09:00",
      end_time: "22:00",
      table_turnover_minutes: 90,
      last_booking_cutoff_minutes: 60,
    },
  })

  const loadConfiguration = useCallback(async () => {
    try {
      setIsLoading(true)
      const config = await apiClient.getRestaurantConfig(restaurantId)
      setRestaurantName(config.name)
      
      form.reset({
        work_days: config.work_days,
        start_time: config.start_time,
        end_time: config.end_time,
        table_turnover_minutes: config.table_turnover_minutes,
        last_booking_cutoff_minutes: config.last_booking_cutoff_minutes,
      })
    } catch (error) {
      toast.error("Error loading configuration")
      console.error("Error loading config:", error)
    } finally {
      setIsLoading(false)
    }
  }, [restaurantId, form])

  useEffect(() => {
    loadConfiguration()
  }, [loadConfiguration])

  const onSubmit = async (data: ConfigFormData) => {
    try {
      setIsSaving(true)
      await apiClient.updateRestaurantConfig(restaurantId, data)
      toast.success("Configuration updated successfully")
    } catch (error) {
      toast.error("Error updating configuration")
      console.error("Error updating config:", error)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading configuration...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">
          Configure the operating hours and settings for {restaurantName}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Días de Trabajo</CardTitle>
              <CardDescription>
                Select the days when the restaurant is open
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="work_days"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <ToggleGroup
                        type="multiple"
                        value={field.value.map(String)}
                        onValueChange={(values) => field.onChange(values.map(Number))}
                        className="justify-start"
                      >
                        {weekDays.map((day) => (
                          <ToggleGroupItem
                            key={day.value}
                            value={String(day.value)}
                            className="px-4"
                          >
                            {day.label}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Horarios de Operación</CardTitle>
              <CardDescription>
                Set the opening and closing hours
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora de Apertura</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="end_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora de Cierre</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configuración de Reservas</CardTitle>
              <CardDescription>
                Configure table turnover and booking cutoff times
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="table_turnover_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tiempo de Rotación de Mesa (minutos)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      How long a table is occupied after a reservation (0 = no limit)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_booking_cutoff_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tiempo Límite para Última Reserva (minutos)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Stop accepting reservations this many minutes before closing (0 = until closing)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Configuration
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}