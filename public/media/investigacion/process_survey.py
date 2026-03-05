import csv
import json

file_path = r'c:\Users\PJORGECHAPARRO\OneDrive - unitropico.edu.co\Documentos\Presentacion_IA\Dashboard\Encuesta Pregrado IA.csv'

trends = {
    'total': 0,
    'dispuestosIA': 0,
    'regionIA': 0,
    'opciones': {},
    'sectores': {},
    'perfil': {}
}

total_resp = 0
dispuestos_count = 0
region_count = 0

try:
    with open(file_path, mode='r', encoding='latin-1') as f:
        reader = csv.reader(f, delimiter=';')
        header = next(reader)
        
        for row in reader:
            # Skip empty rows or rows without a timestamp
            if not row or len(row) < 5 or not row[0]:
                continue
            
            # Skip rows where "Cual es su edad" is empty (Col 3)
            if not row[3]:
                continue

            total_resp += 1
            
            # Index 21: Estara dispuesto a matricularse...
            dispuesto = row[21].strip().lower() if len(row) > 21 else ''
            if 'si' in dispuesto or 'tal vez' in dispuesto:
                dispuestos_count += 1
                
            # Index 13: Cree que la region Orinoquia requiere...
            region = row[13].strip().lower() if len(row) > 13 else ''
            if 'de acuerdo' in region:
                region_count += 1
                
            # Index 20: Primera opcion
            opcion = row[20].strip() if len(row) > 20 else 'Otro'
            if opcion:
                trends['opciones'][opcion] = trends['opciones'].get(opcion, 0) + 1
            
            # Index 19: Areas IA ayuda
            areas_raw = row[19].strip() if len(row) > 19 else ''
            areas = [a.strip() for a in areas_raw.split(',')]
            for a in areas:
                if a and len(a) > 2:
                    trends['sectores'][a] = trends['sectores'].get(a, 0) + 1
            
            # Index 5: Perfil
            perfil = row[5].strip() if len(row) > 5 else 'Otro'
            if perfil:
                trends['perfil'][perfil] = trends['perfil'].get(perfil, 0) + 1

    # Formatting for Dashboard
    # Recalculate percentages relative to actual TOTAL valid responses
    final_trends = {
        'total': total_resp,
        'dispuestosIA': round((dispuestos_count / total_resp) * 100, 1) if total_resp > 0 else 0,
        'regionIA': round((region_count / total_resp) * 100, 1) if total_resp > 0 else 0,
        'opciones': sorted([{'label': k, 'val': round((v/total_resp)*100, 1)} for k, v in trends['opciones'].items()], key=lambda x: x['val'], reverse=True)[:5],
        'sectores': sorted([{'label': k, 'val': round((v/total_resp)*100, 1)} for k, v in trends['sectores'].items()], key=lambda x: x['val'], reverse=True)[:5],
        'perfil': sorted([{'label': k, 'val': round((v/total_resp)*100, 1)} for k, v in trends['perfil'].items()], key=lambda x: x['val'], reverse=True)[:6]
    }
    
    # Final cleanup of labels
    for item in final_trends['opciones']:
        if len(item['label']) > 30: item['label'] = item['label'][:30] + '...'
    
    print(json.dumps(final_trends, indent=4))

except Exception as e:
    import traceback
    print(f"Error: {e}")
    traceback.print_exc()
