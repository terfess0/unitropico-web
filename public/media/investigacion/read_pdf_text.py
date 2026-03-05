import sys
import os

pdf_path = r'c:\Users\PJORGECHAPARRO\OneDrive - unitropico.edu.co\Documentos\Presentacion_IA\Ficha tecnica de la encuesta para el pregrado de IA.pdf'

try:
    from pdfminer.high_level import extract_text
    text = extract_text(pdf_path)
    print("--- PDF CONTENT START ---")
    print(text)
    print("--- PDF CONTENT END ---")
except ImportError:
    print("pdfminer.six not installed. Attempting basic string extraction...")
    try:
        with open(pdf_path, 'rb') as f:
            content = f.read()
            # Find printable strings of length > 4 as a crude fallback
            import re
            strings = re.findall(b"[\x20-\x7E]{4,}", content)
            for s in strings:
                try:
                    decoded = s.decode('ascii')
                    if any(c in decoded for c in ['%', 'N=', 'Muestra', 'Pertinencia', 'IA']):
                        print(decoded)
                except:
                    pass
    except Exception as e:
        print(f"Error reading file: {e}")
except Exception as e:
    print(f"Error extracting text: {e}")
