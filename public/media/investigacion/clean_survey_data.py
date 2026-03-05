import csv
from collections import Counter

csv_path = r'c:\Users\PJORGECHAPARRO\OneDrive - unitropico.edu.co\Documentos\Presentacion_IA\Dashboard\Encuesta Pregrado IA.csv'

def clean_data():
    raw_data = []
    
    print("--- REPORTE DE LIMPIEZA DE DATOS ---")
    
    # 1. Extracción con índices fijos para evadir problemas de cabeceras corruptas por encoding
    with open(csv_path, mode='r', encoding='latin-1') as f:
        reader = csv.reader(f, delimiter=';')
        next(reader) # Saltar cabecera
        
        for row in reader:
            if not row or len(row) < 22 or not row[0]: # Sin marca temporal
                continue
                
            g = row[4].strip()
            a = row[3].strip()
            p = row[5].strip()
            m = row[9].strip().capitalize()
            ti = row[6].strip()
            
            d_val = row[21].strip()
            d = 1 if "Si" in d_val else (0.5 if "Tal vez" in d_val else 0)
            
            opt = row[20].strip()

            raw_data.append({
                'g': g, 'a': a, 'p': p, 'm': m, 'ti': ti, 'd': d, 'opt': opt
            })

    print(f"Total respuestas extraídas del CSV (Marca temporal válida): {len(raw_data)}")
    
    # 2. Análisis de Vacíos
    nulls = {'g': 0, 'a': 0, 'p': 0, 'm': 0, 'ti': 0, 'opt': 0}
    for r in raw_data:
        if not r['g']: nulls['g'] += 1
        if not r['a']: nulls['a'] += 1
        if not r['p']: nulls['p'] += 1
        if not r['m']: nulls['m'] += 1
        if not r['ti']: nulls['ti'] += 1
        if not r['opt']: nulls['opt'] += 1
        
    print(f"\n[DIAGNÓSTICO] Valores nulos en la muestra ({len(raw_data)}):")
    for k, v in nulls.items():
        if v > 0:
            print(f"  - Columna o Filtro '{k}': {v} registros vacíos ({(v/len(raw_data))*100:.1f}%)")

    # 3. Curación y Output para Dashboard
    clean_records = []
    for r in raw_data:
        if not r['g'] and not r['a'] and not r['m']:
            continue # Descartar líneas fantasma
            
        # Normalizar Género
        if "Masc" in r['g'] or r['g'].startswith('M'): r['g'] = "Masculino"
        elif "Fem" in r['g'] or r['g'].startswith('F'): r['g'] = "Femenino"
        else: r['g'] = "No Especificó"
        
        # Normalizar Edad
        if not r['a']: r['a'] = "No Especificada"
        elif "17" in r['a']: r['a'] = "Menos de 17 años"
        elif "18" in r['a'] or "22" in r['a']: r['a'] = "18 - 22 años"
        elif "23" in r['a'] or "26" in r['a']: r['a'] = "Mayores de 23"
        elif "27" in r['a']: r['a'] = "Mayores de 23"
        elif "46" in r['a']: r['a'] = "Mayores de 23"
        else: r['a'] = "No Especificada"
        
        # Normalizar Institución
        if not r['ti']: r['ti'] = "Otro/No especificado"
        elif "ficial" in r['ti'].lower() and "no" not in r['ti'].lower(): r['ti'] = "Oficial (Pública)"
        elif "privada" in r['ti'].lower() or "no oficial" in r['ti'].lower(): r['ti'] = "No Oficial (privada)"
        else: r['ti'] = "Otro/No especificado"
        
        # Normalizar Opcion
        if "Inteligencia Artificial" in r['opt']: r['opt'] = "Ing. IA"
        elif "Sistemas" in r['opt']: r['opt'] = "Sistemas"
        else: r['opt'] = "Otras"

        clean_records.append(r)

    print(f"\nTotal registros VÁLIDOS tras curación básica: {len(clean_records)}")
    
    genders = Counter([r['g'] for r in clean_records])
    print(f"\nDistribución Género:")
    for k, v in genders.items():
        print(f"  {k}: {v} ({(v/len(clean_records))*100:.1f}%)")
        
    insts = Counter([r['ti'] for r in clean_records])
    print(f"\nDistribución Institución:")
    for k, v in insts.items():
        print(f"  {k}: {v} ({(v/len(clean_records))*100:.1f}%)")

if __name__ == "__main__":
    clean_data()
