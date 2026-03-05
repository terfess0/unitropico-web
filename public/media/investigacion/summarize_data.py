import csv
import json

file_path = r'c:\Users\PJORGECHAPARRO\OneDrive - unitropico.edu.co\Documentos\Presentacion_IA\Dashboard\Encuesta Pregrado IA.csv'

stats = {
    'genero': {},
    'edad': {},
    'grado': {},
    'opcion': {},
    'sectores': {},
    'records': [] # We'll store a light version for JS filtering
}

total = 0
try:
    with open(file_path, mode='r', encoding='latin-1') as f:
        reader = csv.reader(f, delimiter=';')
        next(reader)
        for row in reader:
            if not row or len(row) < 22 or not row[0]: continue
            
            gen = row[4].strip()
            age = row[3].strip()
            grad = row[5].strip()
            disp = row[21].strip()
            opt = row[20].strip()
            areas = [a.strip() for a in row[19].split(',') if a.strip()]
            
            # Map to simpler values for JS
            record = {
                'g': gen[0] if gen else 'U', # M/F/U
                'e': age,
                'gr': grad,
                'd': 1 if 'si' in disp.lower() else (0.5 if 'tal vez' in disp.lower() else 0),
                'o': opt,
                's': areas
            }
            stats['records'].append(record)
            total += 1

    print(json.dumps(stats['records']))
except Exception as e:
    print(f"[]")
