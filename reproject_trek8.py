import numpy as np
from PIL import Image

# 1. Definición de las 8 fuentes de NASA Moon Trek
files = {
    'A': 'treknasa_A.png',               # 0°
    'B': 'treknasa_B.png',               # 60°
    'C': 'treknasa_C.png',               # 120°
    'D': 'treknasa_D.png',               # 180° (Cara Oculta)
    'E': 'treknasa_E.png',               # 240°
    'F': 'treknasa_F.png',               # 300°
    'NP': 'treknasa_polar_north.png',    # +90° Polo Norte
    'SP': 'treknasa_polar_south.png'     # -90° Polo Sur
}

# 2. Carga y detección del círculo útil en cada captura
loaded = {}
for k, fname in files.items():
    im = Image.open(fname).convert('RGB')
    arr = np.array(im, dtype=np.float32)
    gray = np.mean(arr, axis=2)
    mask = gray > 15
    ys, xs = np.where(mask)
    yc = (ys.min() + ys.max()) / 2.0
    xc = (xs.min() + xs.max()) / 2.0
    r = ((ys.max() - ys.min()) + (xs.max() - xs.min())) / 4.0
    loaded[k] = {'arr': arr, 'xc': xc, 'yc': yc, 'r': r, 'h': arr.shape[0], 'w': arr.shape[1]}

# 3. Malla equirrectangular (2048 x 1024, relación 2:1)
W, H = 2048, 1024
lons = np.linspace(-np.pi, np.pi, W)
lats = np.linspace(np.pi / 2, -np.pi / 2, H)
lon_grid, lat_grid = np.meshgrid(lons, lats)

Px = np.cos(lat_grid) * np.sin(lon_grid)
Py = np.sin(lat_grid)
Pz = np.cos(lat_grid) * np.cos(lon_grid)

accum = np.zeros((H, W, 3), dtype=np.float32)
weights = np.zeros((H, W), dtype=np.float32)

# 4. Proyección de los 6 sextos de giro ecuatoriales
eq_keys = ['A', 'B', 'C', 'D', 'E', 'F']
for idx, k in enumerate(eq_keys):
    cam_lon = idx * (np.pi / 3.0)  # Cada 60°
    cx, cy, cz = np.sin(cam_lon), 0.0, np.cos(cam_lon)
    
    dot = Px * cx + Py * cy + Pz * cz
    valid = dot > 0.05
    w_cam = np.maximum(0, dot) ** 4
    w_cam[~valid] = 0
    
    # Coordenadas locales en el plano de proyección ortográfica
    u_proj = Px * np.cos(cam_lon) - Pz * np.sin(cam_lon)
    v_proj = Py
    
    d = loaded[k]
    pix_x = np.clip(np.round(d['xc'] + u_proj * d['r']).astype(int), 0, d['w'] - 1)
    pix_y = np.clip(np.round(d['yc'] - v_proj * d['r']).astype(int), 0, d['h'] - 1)
    
    accum += d['arr'][pix_y, pix_x] * w_cam[:, :, None]
    weights += w_cam

# 5. Proyección de los dos polos
# Polo Norte (Py = +1)
w_np = np.maximum(0, Py) ** 4
d_np = loaded['NP']
px_np = np.clip(np.round(d_np['xc'] + Px * d_np['r']).astype(int), 0, d_np['w'] - 1)
py_np = np.clip(np.round(d_np['yc'] + Pz * d_np['r']).astype(int), 0, d_np['h'] - 1)
accum += d_np['arr'][py_np, px_np] * w_np[:, :, None]
weights += w_np

# Polo Sur (Py = -1)
w_sp = np.maximum(0, -Py) ** 4
d_sp = loaded['SP']
px_sp = np.clip(np.round(d_sp['xc'] + Px * d_sp['r']).astype(int), 0, d_sp['w'] - 1)
py_sp = np.clip(np.round(d_sp['yc'] - Pz * d_sp['r']).astype(int), 0, d_sp['h'] - 1)
accum += d_sp['arr'][py_sp, px_sp] * w_sp[:, :, None]
weights += w_sp

# 6. Normalización y guardado
weights[weights == 0] = 1.0
final_texture = np.clip(accum / weights[:, :, None], 0, 255).astype(np.uint8)
Image.fromarray(final_texture).save('lunar_surface_trek8.png')
print('¡Textura esférica unificada generada con éxito: lunar_surface_trek8.png!')