# AI Agent Tools para Reservaciones de Restaurante

Este documento describe las herramientas disponibles para agentes de IA (chatbots, voice bots) para gestionar reservaciones de restaurante.

## Herramientas Disponibles

### 1. `check_availability` - Verificar Disponibilidad
**Endpoint:** `POST /api/v1/agent/check-availability`

Verifica la disponibilidad de mesas para una fecha y número de comensales específicos.

#### Parámetros de Entrada:
```json
{
  "restaurant_slug": "string",  // Identificador único del restaurante
  "date": "YYYY-MM-DD",        // Fecha de la reserva
  "guests": integer            // Número de comensales
}
```

#### Respuesta Esperada:
```json
{
  "available_slots": {
    "02:00 PM": [1, 5, 8],     // Horario disponible: números de mesa
    "02:30 PM": [1, 5, 8],
    "07:00 PM": [2, 3, 4],
    "07:30 PM": [2, 3]
  }
}
```

### 2. `create_reservation` - Crear Reservación
**Endpoint:** `POST /api/v1/agent/create-reservation`

Crea una nueva reservación para el cliente.

#### Parámetros de Entrada:
```json
{
  "restaurant_slug": "string",     // Identificador único del restaurante
  "customer_name": "string",       // Nombre completo del cliente
  "customer_phone": "string",      // Teléfono del cliente (requerido)
  "date": "YYYY-MM-DD",           // Fecha de la reserva
  "time": "HH:MM",                // Hora en formato 24h (ej: "19:00")
  "guests": integer,              // Número de comensales
  "source": "voice|chat"          // Origen de la reservación
}
```

#### Respuesta Esperada:
```json
{
  "success": true,
  "reservation": {
    "id": 123,
    "customer_name": "Juan Pérez",
    "customer_phone": "+1809555123",
    "reservation_datetime": "2024-07-15T19:00:00-04:00",
    "guests": 4,
    "status": "pending",
    "source": "voice",
    "table_id": 5
  },
  "message": "Reservation created successfully"
}
```

## Guía de Implementación para LLM/Chatbot

### Flujo Recomendado de Conversación

1. **Obtener Información del Cliente:**
   - Fecha deseada para la reserva
   - Número de comensales
   - Hora preferida (opcional inicialmente)

2. **Verificar Disponibilidad:**
   ```python
   # Llamar a check_availability
   response = check_availability({
       "restaurant_slug": "restaurante-central",
       "date": "2024-07-15",
       "guests": 4
   })
   ```

3. **Analizar Resultados y Responder:**

#### Caso: Disponibilidad Encontrada
```python
if response["available_slots"]:
    # Mostrar opciones disponibles al cliente
    available_times = list(response["available_slots"].keys())
    print(f"Tenemos disponibilidad en los siguientes horarios: {', '.join(available_times)}")
else:
    # Manejar caso sin disponibilidad
```

#### Caso: Sin Disponibilidad
```python
if not response["available_slots"]:
    # Sugerir fechas alternativas
    print("Lo siento, no tenemos disponibilidad para esa fecha.")
    print("¿Te gustaría que revise otros días?")
    # Intentar con fechas cercanas (día siguiente, fin de semana, etc.)
```

### Manejo de Casos Problemáticos

#### 1. Restaurante Cerrado
```json
{
  "available_slots": {}  // Respuesta vacía
}
```
**Respuesta sugerida:** "El restaurante está cerrado ese día. ¿Te gustaría revisar otro día de la semana?"

#### 2. Sin Mesas Disponibles para el Tamaño del Grupo
```json
{
  "available_slots": {}  // Sin horarios disponibles
}
```
**Acciones recomendadas:**
- Verificar con menos comensales: `guests - 1`
- Sugerir dividir el grupo en mesas separadas
- Ofrecer fechas alternativas

#### 3. Horarios Limitados
```json
{
  "available_slots": {
    "06:00 PM": [2],      // Solo una mesa disponible
    "09:30 PM": [1, 3]    // Horario tardío
  }
}
```
**Respuesta sugerida:** "Tengo disponibilidad limitada. Te puedo ofrecer las 6:00 PM o 9:30 PM. ¿Alguna de estas opciones te funciona?"

#### 4. Error al Crear Reservación
```json
{
  "success": false,
  "reservation": null,
  "message": "No tables available at this time"
}
```
**Acciones recomendadas:**
1. Verificar disponibilidad nuevamente
2. Sugerir horarios cercanos al solicitado
3. Preguntar si el cliente acepta horarios alternativos

### Ejemplos de Diálogos

#### Diálogo Exitoso:
```
Cliente: "Quiero hacer una reserva para 4 personas el 15 de julio"
Bot: "Perfecto, déjame revisar disponibilidad para 4 personas el 15 de julio..."
     [llama check_availability]
Bot: "Tengo disponibilidad a las 2:00 PM, 2:30 PM, 7:00 PM y 7:30 PM. ¿Cuál prefieres?"
Cliente: "Las 7:00 PM está bien"
Bot: "Excelente. ¿Me puedes dar tu nombre completo y número de teléfono?"
Cliente: "Juan Pérez, mi teléfono es +1809555123"
Bot: [llama create_reservation]
Bot: "¡Perfecto! Tu reservación está confirmada para 4 personas el 15 de julio a las 7:00 PM. 
     Tu número de reservación es #123. Te esperamos, Juan!"
```

#### Diálogo con Problemas:
```
Cliente: "Necesito mesa para 8 personas mañana"
Bot: [llama check_availability con guests=8]
Bot: "Lo siento, no tengo mesas disponibles para 8 personas mañana. 
     ¿Te funcionaría dividir el grupo en dos mesas de 4 personas? 
     O puedo revisar otros días de la semana."
Cliente: "¿Qué hay para el fin de semana?"
Bot: [llama check_availability para sábado y domingo]
Bot: "Para el sábado tengo disponibilidad a las 1:00 PM y 6:00 PM para 8 personas. 
     ¿Te interesa alguna de estas opciones?"
```

### Consideraciones Técnicas

1. **Formato de Tiempo:**
   - Input: usar formato 24h ("19:00")
   - Output: se devuelve en formato 12h ("07:00 PM")

2. **Zona Horaria:**
   - Todas las operaciones usan la zona horaria del restaurante (America/Santo_Domingo)

3. **Validaciones Automáticas:**
   - Días de trabajo del restaurante
   - Horarios de operación
   - Tiempo mínimo antes del cierre
   - Tiempo de rotación de mesas

4. **Estados de Reservación:**
   - `pending`: Reservación creada, pendiente de confirmación
   - `confirmed`: Confirmada por el restaurante
   - `cancelled`: Cancelada
   - `completed`: Completada

### Códigos de Error Comunes

- `"Restaurant not found"`: El restaurant_slug no existe
- `"Invalid date or time format"`: Formato de fecha/hora incorrecto
- `"Restaurant is closed on this day"`: Día no laborable
- `"Time is outside restaurant hours"`: Fuera del horario de operación
- `"Too close to closing time"`: Muy cerca de la hora de cierre
- `"No tables available at this time"`: No hay mesas disponibles

### Mejores Prácticas

1. **Siempre verificar disponibilidad antes de crear reservación**
2. **Ofrecer múltiples opciones al cliente**
3. **Confirmar todos los detalles antes de crear la reservación**
4. **Manejar errores de forma amigable**
5. **Sugerir alternativas cuando no hay disponibilidad**
6. **Recopilar teléfono del cliente (obligatorio)**
7. **Usar el source correcto ("voice" o "chat")**