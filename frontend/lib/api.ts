const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"

class ApiClient {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("auth_token")
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem("auth_token")
        localStorage.removeItem("auth_user")
        window.location.href = "/login"
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
  }

  // Authentication
  async login(email: string, password: string) {
    const formData = new FormData()
    formData.append("username", email)
    formData.append("password", password)

    const response = await fetch(`${API_BASE_URL}/token`, {
      method: "POST",
      body: formData,
    })

    return this.handleResponse<{ access_token: string; token_type: string }>(response)
  }

  // Dashboard
  async getDashboardStats(restaurantId: string) {
    const response = await fetch(
      `${API_BASE_URL}/dashboard/stats?restaurant_id=${restaurantId}`,
      {
        headers: this.getAuthHeaders(),
      }
    )
    return this.handleResponse<{
      today_reservations: number
      confirmed_reservations: number
      cancelled_reservations: number
      occupancy_rate: number
    }>(response)
  }

  async getWeeklyStats(restaurantId: string) {
    const response = await fetch(
      `${API_BASE_URL}/dashboard/weekly-stats?restaurant_id=${restaurantId}`,
      {
        headers: this.getAuthHeaders(),
      }
    )
    return this.handleResponse<Array<{
      day: string
      date: string
      reservations: number
      confirmed: number
    }>>(response)
  }

  async getTopCustomers(restaurantId: string, limit: number = 5) {
    const response = await fetch(
      `${API_BASE_URL}/dashboard/top-customers?restaurant_id=${restaurantId}&limit=${limit}`,
      {
        headers: this.getAuthHeaders(),
      }
    )
    return this.handleResponse<Array<{
      name: string
      email?: string
      phone?: string
      total_reservations: number
    }>>(response)
  }

  async getRestaurants() {
    const response = await fetch(`${API_BASE_URL}/restaurants`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse<Array<{
      id: number
      name: string
      slug: string
      work_days?: number[]
      start_time?: string
      end_time?: string
      table_turnover_minutes?: number
      last_booking_cutoff_minutes?: number
      created_at?: string
      updated_at?: string
    }>>(response)
  }

  // Reservations
  async getReservations(params: {
    restaurantId: string
    page?: number
    limit?: number
    dateFilter?: string
    statusFilter?: string
    search?: string
  }) {
    const searchParams = new URLSearchParams({
      restaurant_id: params.restaurantId,
      page: (params.page || 1).toString(),
      limit: (params.limit || 10).toString(),
    })

    if (params.dateFilter) searchParams.append("date_filter", params.dateFilter)
    if (params.statusFilter) searchParams.append("status_filter", params.statusFilter)
    if (params.search) searchParams.append("search", params.search)

    const response = await fetch(`${API_BASE_URL}/reservations?${searchParams}`, {
      headers: this.getAuthHeaders(),
    })

    return this.handleResponse<{
      items: Array<{
        id: number
        customer_name: string
        customer_phone: string
        customer_email?: string
        reservation_datetime: string
        guests: number
        status: string
        source: string
        notes?: string
        special_requests?: string
        table_number?: number
        created_at: string
      }>
      total: number
      page: number
      pages: number
    }>(response)
  }

  async updateReservationStatus(reservationId: number, status: string) {
    const response = await fetch(`${API_BASE_URL}/reservations/${reservationId}`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ status }),
    })
    return this.handleResponse<{ status: string }>(response)
  }

  async createReservation(reservation: {
    customer_name: string
    customer_phone: string
    customer_email?: string
    reservation_datetime: string
    guests: number
    restaurant_id: number
    source?: string
    notes?: string
    special_requests?: string
  }) {
    const response = await fetch(`${API_BASE_URL}/reservations`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(reservation),
    })
    return this.handleResponse<{ status: string }>(response)
  }

  // Tables
  async getTables(restaurantId: string) {
    const response = await fetch(`${API_BASE_URL}/tables?restaurant_id=${restaurantId}`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse<Array<{
      id: number
      number: number
      capacity: number
      status: string
      location?: string
      restaurant_id: number
    }>>(response)
  }

  async getTablesWithReservations(restaurantId: string) {
    const response = await fetch(`${API_BASE_URL}/tables/with-reservations?restaurant_id=${restaurantId}`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse<Array<{
      id: number
      number: number
      capacity: number
      status: string
      location?: string
      restaurant_id: number
      current_reservation?: {
        id: number
        customer_name: string
        customer_phone: string
        reservation_datetime: string
        guests: number
        status: string
        special_requests?: string
      }
    }>>(response)
  }

  async updateTableStatus(tableId: number, status: string) {
    const response = await fetch(`${API_BASE_URL}/tables/${tableId}`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ status }),
    })
    return this.handleResponse<{ status: string }>(response)
  }

  async createTable(table: {
    number: number
    capacity: number
    restaurant_id: number
    location?: string
  }) {
    const response = await fetch(`${API_BASE_URL}/tables`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(table),
    })
    return this.handleResponse<{ status: string }>(response)
  }

  // Configuration
  async getRestaurantConfig(restaurantId: string) {
    const response = await fetch(`${API_BASE_URL}/config/${restaurantId}`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse<{
      id: number
      name: string
      slug: string
      work_days: number[]
      start_time: string
      end_time: string
      table_turnover_minutes: number
      last_booking_cutoff_minutes: number
    }>(response)
  }

  async updateRestaurantConfig(restaurantId: string, config: {
    work_days: number[]
    start_time: string
    end_time: string
    table_turnover_minutes: number
    last_booking_cutoff_minutes: number
  }) {
    const response = await fetch(`${API_BASE_URL}/config/${restaurantId}`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(config),
    })
    return this.handleResponse<{ status: string }>(response)
  }

  // Agent endpoints (public)
  async checkAvailability(restaurantSlug: string, date: string, guests: number) {
    const response = await fetch(`${API_BASE_URL}/agent/check-availability`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurant_slug: restaurantSlug,
        date,
        guests,
      }),
    })
    return this.handleResponse<{ available_slots: Record<string, number[]> }>(response)
  }

  async createAgentReservation(params: {
    restaurant_slug: string
    customer_name: string
    customer_phone: string
    date: string
    time: string
    guests: number
    source: string
  }) {
    const response = await fetch(`${API_BASE_URL}/agent/create-reservation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    })
    return this.handleResponse<{
      success: boolean
      reservation?: Record<string, unknown>
      message: string
    }>(response)
  }
}

export const apiClient = new ApiClient()