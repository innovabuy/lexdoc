#!/bin/bash
# GO-LIVE-2.A-quater — Défense en profondeur : DROP tout NEW venant de l'interface
# externe (eth0) vers les conteneurs Docker, sauf le retour des connexions sortantes.
# Docker jump vers DOCKER-USER AVANT ses propres règles ACCEPT → point d'insertion admin.
# NB : la barrière FIABLE reste la convention "publier en 127.0.0.1:port" (docker-proxy
# n'écoute alors pas sur 0.0.0.0). Cette règle couvre le chemin kernel FORWARD.
set -e
EXTIF="${EXTIF:-eth0}"

# Idempotent : on retire d'éventuels doublons puis on (ré)insère dans le bon ordre.
iptables -D DOCKER-USER -i "$EXTIF" -j DROP 2>/dev/null || true
iptables -D DOCKER-USER -i "$EXTIF" -m conntrack --ctstate RELATED,ESTABLISHED -j RETURN 2>/dev/null || true

iptables -I DOCKER-USER -i "$EXTIF" -j DROP
iptables -I DOCKER-USER -i "$EXTIF" -m conntrack --ctstate RELATED,ESTABLISHED -j RETURN

logger -t docker-user-firewall "DOCKER-USER hardening applied on $EXTIF"
