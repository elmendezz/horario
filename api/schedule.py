# Version: 4
# Changes: Code optimized for Vercel's Serverless Functions.

import datetime
from http.server import BaseHTTPRequestHandler
import json

# Horario en una estructura de datos Python
schedule = {
    "Lunes": [
        {"start_time": "07:00", "end_time": "08:15", "name": "Cultura Digital I", "teacher": "ARMENTA FELIX ANA CRISTINA"},
        {"start_time": "08:20", "end_time": "09:35", "name": "Ingles I", "teacher": "FALCON OLIVOANI ANDREA MAREL"},
        {"start_time": "09:45", "end_time": "10:05", "name": "Receso de 20 min.", "teacher": "¡A descansar!"},
        {"start_time": "10:05", "end_time": "11:20", "name": "Ingles I", "teacher": "FALCON OLIVOANI ANDREA MAREL"},
        {"start_time": "11:30", "end_time": "12:45", "name": "Humanidades I", "teacher": "YAÑEZ NUÑEZ LORENA ESMERALDA"},
        {"start_time": "12:55", "end_time": "14:10", "name": "Lengua y Comunicación I", "teacher": "YAÑEZ NUÑEZ LORENA ESMERALDA"},
        {"start_time": "14:20", "end_time": "15:35", "name": "La Materia y sus Interacciones", "teacher": "VARA LOPEZ JOSE ALBERTO"},
    ],
    "Martes": [
        {"start_time": "08:20", "end_time": "09:35", "name": "Cultura Digital I", "teacher": "ARMENTA FELIX ANA CRISTINA"},
        {"start_time": "09:45", "end_time": "10:05", "name": "Receso de 20 min.", "teacher": "¡A descansar!"},
        {"start_time": "10:05", "end_time": "11:20", "name": "Lengua y Comunicación I", "teacher": "YAÑEZ NUÑEZ LORENA ESMERALDA"},
        {"start_time": "11:30", "end_time": "12:45", "name": "La Materia y sus Interacciones", "teacher": "VARA LOPEZ JOSE ALBERTO"},
        {"start_time": "12:55", "end_time": "14:10", "name": "Ingles I", "teacher": "FALCON OLIVOANI ANDREA MAREL"},
    ],
    "Miércoles": [
        {"start_time": "09:45", "end_time": "11:00", "name": "Humanidades I", "teacher": "YAÑEZ NUÑEZ LORENA ESMERALDA"},
        {"start_time": "11:10", "end_time": "12:25", "name": "Humanidades I", "teacher": "YAÑEZ NUÑEZ LORENA ESMERALDA"},
        {"start_time": "12:35", "end_time": "13:50", "name": "Pensamiento matematico I", "teacher": "HERNANDEZ VARGAS KENIA YOVANNA"},
        {"start_time": "14:00", "end_time": "15:15", "name": "La Materia y sus Interacciones", "teacher": "VARA LOPEZ JOSE ALBERTO"},
    ],
    "Jueves": [
        {"start_time": "09:45", "end_time": "11:00", "name": "Humanidades I", "teacher": "YAÑEZ NUÑEZ LORENA ESMERALDA"},
        {"start_time": "11:10", "end_time": "12:25", "name": "Pensamiento matematico I", "teacher": "HERNANDEZ VARGAS KENIA YOVANNA"},
        {"start_time": "12:35", "end_time": "13:50", "name": "Pensamiento matematico I", "teacher": "HERNANDEZ VARGAS KENIA YOVANNA"},
        {"start_time": "14:00", "end_time": "15:15", "name": "Ciencias Sociales I", "teacher": "YAÑEZ NUÑEZ LORENA ESMERALDA"},
    ],
    "Viernes": [
        {"start_time": "08:20", "end_time": "09:35", "name": "Formación socioemocional I", "teacher": "CHAVEZ ARRIOLA LUIS MARIO"},
        {"start_time": "09:45", "end_time": "10:05", "name": "Receso de 20 min.", "teacher": "¡A descansar!"},
        {"start_time": "10:05", "end_time": "11:20", "name": "Ciencias Sociales I", "teacher": "YAÑEZ NUÑEZ LORENA ESMERALDA"},
        {"start_time": "11:30", "end_time": "12:45", "name": "Lengua y Comunicación I", "teacher": "YAÑEZ NUÑEZ LORENA ESMERALDA"},
        {"start_time": "12:55", "end_time": "14:10", "name": "La Materia y sus Interacciones", "teacher": "VARA LOPEZ JOSE ALBERTO"},
        {"start_time": "14:20", "end_time": "15:35", "name": "Pensamiento matematico I", "teacher": "HERNANDEZ VARGAS KENIA YOVANNA"},
    ],
}

def get_schedule_data():
    now = datetime.datetime.now()
    day_name = now.strftime('%A')
    
    day_map = {
        'Monday': 'Lunes', 'Tuesday': 'Martes', 'Wednesday': 'Miércoles',
        'Thursday': 'Jueves', 'Friday': 'Viernes', 'Saturday': 'Sábado', 'Sunday': 'Domingo'
    }
    spanish_day = day_map.get(day_name, "Desconocido")
    
    current_class = {"name": "¡Sin Clases!", "teacher": "Disfruta el fin de semana"}
    next_class_name = "No hay más clases hoy"

    if spanish_day in ["Sábado", "Domingo"]:
        return {"current": current_class, "next": {"name": ""}}

    today_schedule = schedule.get(spanish_day, [])
    current_time = now.time()

    for i, item in enumerate(today_schedule):
        start_time_str = item["start_time"]
        end_time_str = item["end_time"]
        
        start_time = datetime.datetime.strptime(start_time_str, '%H:%M').time()
        end_time = datetime.datetime.strptime(end_time_str, '%H:%M').time()

        if start_time <= current_time < end_time:
            current_class = item
            if i + 1 < len(today_schedule):
                next_class_name = today_schedule[i+1]["name"]
            else:
                next_class_name = "No hay más clases hoy"
            break
        elif current_time < start_time:
            current_class = {"name": "Aún no empiezan las clases", "teacher": ""}
            next_class_name = today_schedule[i]["name"]
            break
            
    if current_class["name"] == "¡Sin Clases!":
        current_class = {"name": "¡Clases terminadas por hoy!", "teacher": ""}
        next_class_name = "No hay más clases hoy"

    return {"current": current_class, "next": {"name": next_class_name}}

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        response_data = get_schedule_data()
        self.wfile.write(json.dumps(response_data).encode('utf-8'))
