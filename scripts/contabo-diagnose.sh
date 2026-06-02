#!/bin/bash
# Ejecutar EN EL SERVIDOR Contabo (después de: ssh usuario@66.94.96.230)
# Copia y pega todo el bloque, o: bash contabo-diagnose.sh

set -e

echo "=========================================="
echo " BePelican — Diagnóstico Supabase / nginx"
echo "=========================================="
echo ""
echo "IP pública: $(curl -s ifconfig.me 2>/dev/null || echo 'desconocida')"
echo ""

echo ">>> 1. Contenedores Docker (busca supabase, studio, kong, chatwoot)"
docker ps --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}" 2>/dev/null || echo "Docker no disponible o sin permisos"
echo ""

echo ">>> 2. Puertos en uso (3000, 8000, 5432, 5678)"
ss -tlnp 2>/dev/null | grep -E ':3000|:8000|:5432|:5678|:54323' || netstat -tlnp 2>/dev/null | grep -E ':3000|:8000|:5432|:5678|:54323' || echo "No se pudo listar puertos"
echo ""

echo ">>> 3. Config nginx — archivos activos"
ls -la /etc/nginx/sites-enabled/ 2>/dev/null || echo "nginx sites-enabled no encontrado"
echo ""

echo ">>> 4. Qué server_name usa cada sitio"
grep -r "server_name" /etc/nginx/sites-enabled/ 2>/dev/null || true
echo ""

echo ">>> 5. Dónde apunta supabase-bepelican en nginx"
grep -r "supabase-bepelican\|api-bepelican\|chatwoot\|proxy_pass" /etc/nginx/sites-enabled/ 2>/dev/null | head -40 || true
echo ""

echo ">>> 6. Prueba local — ¿Studio responde en 3000?"
curl -sI -m 3 http://127.0.0.1:3000 2>/dev/null | head -3 || echo "Puerto 3000 no responde"
echo ""

echo ">>> 7. Prueba local — ¿Kong/API en 8000?"
curl -sI -m 3 http://127.0.0.1:8000 2>/dev/null | head -3 || echo "Puerto 8000 no responde"
echo ""

echo ">>> 8. Carpeta Supabase (si existe)"
for d in /root/supabase /opt/supabase /home/*/supabase ~/supabase/docker; do
  [ -d "$d" ] && echo "Encontrado: $d" && ls "$d" | head -5
done
echo ""

echo "=========================================="
echo " Copia TODA esta salida y pégala en Cursor"
echo "=========================================="
