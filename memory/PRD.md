# BaristaShift - PRD

## Problem Statement
App per gestione cambi turno nei bar. I baristi devono completare una checklist di controlli durante il cambio turno. Il barista del turno successivo vede lo stato (verde=completato, rosso=da fare).

## User Personas
- **Barista**: Completa checklist, lascia note, visualizza storico
- **Manager**: Tutto + gestione categorie/items/utenti

## Core Requirements
- Login con nome/PIN
- Dashboard con stato turno e categorie
- Checklist interattiva per categoria
- Note tra turni
- Storico turni con filtro data
- Pannello manager (CRUD categorie/items)
- Tema caffè/latte/colazione

## What's Been Implemented (Jan 2026)
### Backend (FastAPI + MongoDB)
- Auth: Login/Register con JWT e PIN hashato
- CRUD: Categories, ChecklistItems, Shifts, ShiftCompletions, Notes
- Seed data con categorie default (Carichi, Pulizia Macchina, Ordini, Inventario, Cassa, Frigoriferi)
- Utenti demo: Manager (PIN 1234), Barista (PIN 0000)

### Frontend (React + Tailwind + Framer Motion)
- Login page con tema caffè
- Dashboard con overview turno e categorie
- Checklist con completamento items e note
- Pagina Note con sticky note effect
- Storico turni con filtro calendario
- Pannello Manager con tabs categorie/items/utenti
- Sidebar navigation + mobile bottom nav
- Dark/Light mode automatico (basato su ora)

## What's Been Implemented (Feb 2026 Update)
### New Features Added
- **Calendario Turni**: Sezione "Turni" con calendario mensile, gestione orari staff
- **Segnalazione Problemi**: Sezione "Problemi" per guasti attrezzature con contatti diretti (telefono, WhatsApp, email)
- **Logout Forzato**: Login richiesto ad ogni apertura app (usa sessionStorage invece di localStorage)
- **Navigazione Mobile**: Menu ottimizzato per visualizzazione verticale
- **Freccia Ritorno**: Presente in tutte le pagine per tornare alla Dashboard
- **Icona App Personalizzata**: PWA con icona dedicata

### Bug Fix (21 Feb 2026)
- **Risolto**: App non si apriva a causa di import duplicati di `Link` in `Checklist.jsx` e `Notes.jsx`

## Test Results
- Backend: 100% (26/26 tests)
- Frontend: 100% (all flows working)

## Prioritized Backlog
### P1 (Next)
- Push notifications per turni non completati
- Export storico in PDF
- QR code per accesso rapido tablet

### P2
- Multi-bar support
- Dashboard analytics manager
- Integrazione con POS

