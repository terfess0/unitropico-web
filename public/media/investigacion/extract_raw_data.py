import csv
import json

file_path = r'c:\Users\PJORGECHAPARRO\OneDrive - unitropico.edu.co\Documentos\Presentacion_IA\Dashboard\Encuesta Pregrado IA.csv'

# Structural storage for cross-filtering
# We will store raw counts for different categories to allow JS filtering
data_store = {
    'total': 0,
    'records': []
}

try:
    with open(file_path, mode='r', encoding='latin-1') as f:
        reader = csv.reader(f, delimiter=';')
        header = next(reader)
        
        for row in reader:
            if not row or len(row) < 22 or not row[0] or not row[3]:
                continue
                
            record = {
                'genero': row[4].strip(),
                'edad': row[3].strip(),
                'grado': row[5].strip(),
                'dispuesto': row[21].strip(),
                'region_req': row[13].strip(), # Cree que la region requiere mas profesionales
                'opcion': row[20].strip(),     # Primera opcion
                'sectores': [s.strip() for s in row[19].split(',') if s.strip()],
                'empleo_prob': row[25].strip()  # Probabilidad empleo
            }
            data_store['records'].append(record)
            data_store['total'] += 1

    # Output as a JS constant
    print("const RAW_DATA = " + json.dumps(data_store['records'], indent=None) + ";")

except Exception as e:
    print(f"// Error: {e}")
