import os
import re

def scale_value(match):
    """Callback to scale numeric values in px or rem."""
    value = float(match.group(1))
    unit = match.group(2)
    
    # Scaling factor: ~1.4x for readability
    if unit == 'rem':
        new_value = round(value * 1.4, 2)
    elif unit == 'px':
        # Don't scale small borders or very small offsets
        if value > 5:
            new_value = round(value * 1.3)
        else:
            return match.group(0)
    else:
        return match.group(0)
    
    return f"{new_value}{unit}"

def process_html_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Scale font-sizes
    # Target: font-size: X.Xrem; or font-size: XXpx;
    content = re.sub(r'font-size:\s*([\d\.]+)(rem|px)', scale_value, content)

    # 2. Scale specific dimensions for nodes/circles/offsets if they exist
    # (width: 60px;, height: 60px;, top: 40px;, etc.)
    dimension_props = ['width', 'height', 'top', 'left', 'right', 'bottom', 'gap', 'margin-top', 'margin-bottom', 'padding']
    for prop in dimension_props:
        content = re.sub(rf'{prop}:\s*([\d\.]+)px', scale_value, content)

    # 3. Normalize Container for Centering
    # Target: .content-container, .container
    if '.content-container' in content:
        # Remove hard margins/paddings if asymmetrical
        content = content.replace('margin-left: 55px;', 'margin: 40px auto;')
        content = content.replace('padding: 0 255px 0 40px;', 'padding: 0 40px;')
        content = content.replace('max-width: 1250px;', 'max-width: 1200px;')

    # 4. Normalize Navbar
    # Replace the <img> tag with the <div> approach if it's the old style
    if '<div class="navbar-img">\n    <img src="media/denominacion/navbar.png" alt="Navbar Unitropico">\n  </div>' in content:
        new_navbar = '''<div class="navbar-img">
    <!-- El fondo se maneja por CSS para ser responsivo -->
  </div>'''
        content = content.replace('<div class="navbar-img">\n    <img src="media/denominacion/navbar.png" alt="Navbar Unitropico">\n  </div>', new_navbar)

    # 5. Fix body/html height for scrolling
    content = content.replace('height: 100%;', 'min-height: 100%; height: auto;')

    # 6. Ensure .intervienen-title and other title colors are correct and sizes are bold
    # (This is more specific but addresses "good scale")
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Processed: {filepath}")

def run_pilot(directory):
    for filename in os.listdir(directory):
        if filename.endswith(".html"):
            process_html_file(os.path.join(directory, filename))

if __name__ == "__main__":
    target_dir = r"c:\Users\santi\Desktop\repositorioRafael\unitropico-web\public\media\html\seq-07"
    run_pilot(target_dir)
