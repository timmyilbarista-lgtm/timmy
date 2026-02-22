# BaristaShift - PRD

## Problem Statement
App per gestione cambi turno nei bar. I baristi devono completare una checklist di controlli durante il cambio turno. Il barista del turno successivo vede lo stato (verde=completato, rosso=da fare).

**IMPORTANTE - Modello di Business:**
- L'app viene venduta in abbonamento a 14,99€/mese ai bar
- Solo l'Admin può creare nuovi clienti (bar)
- I Manager (clienti) NON possono creare nuovi utenti né rivendere l'app

## User Personas
- **Admin**: Proprietario dell'app, crea nuovi clienti, controllo totale
- **Manager**: Titolare del bar (cliente), gestisce la propria checklist
- **Barista**: Completa checklist, lascia note

## Credenziali
- **Admin**: Nome "Admin", PIN "260370" (6 cifre, eccezione)
- **Tutti gli altri utenti**: PIN a 4 cifre obbligatorio

## Core Requirements
- Login con nome/PIN
- Dashboard con stato turno e scelta turno (Mattina/Pomeriggio/Sera)
- Dopo apertura turno → vai direttamente alla Checklist
- Checklist interattiva per categoria con pennina modifica su tutte le voci
- Note tra turni
- Storico turni con filtro data
- Pannello manager (CRUD categorie/items)
- Gestione utenti (solo Admin)
- Landing page per vendita app: /landing

## What's Been Implemented (Jan 2026)
### Backend (FastAPI + MongoDB)
- Auth: Login/Register con JWT e PIN hashato
- CRUD: Categories, ChecklistItems, Shifts, ShiftCompletions, Notes
- Seed data con categorie default (Carichi, Pulizia Macchina, Ordini, Inventario, Cassa, Frigoriferi)

### Frontend (React + Tailwind + Framer Motion)
- Login page con tema caffè (senza credenziali demo visibili)
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
- **Segnalazione Problemi**: Sezione "Problemi" per guasti attrezzature con contatti diretti
- **Landing Page**: Pagina pubblica per vendita app a /landing
- **Sistema Ruoli**: Admin/Manager/Barista con permessi differenziati
- **Pennina Modifica**: Visibile a tutti su ogni voce della checklist

### Bug Fixes (22 Feb 2026)
- **Tab Utenti**: Admin ora può vedere la tab (fix require_manager)
- **Runtime Error Storico**: Corretto errore null su selectedShift
- **Flusso Login**: Dopo apertura turno → vai alla Checklist

### Modifiche Recenti
- Rimossa scritta "Utenti demo" dal login
- Nome Admin cambiato da "Manager" a "Admin"
- PIN Admin cambiato a "260370"
- PIN nuovi utenti limitato a 4 cifre
- Menu: Checklist prima di Dashboard

## Link App
- **App**: https://shift-sync-6.preview.emergentagent.com
- **Landing**: https://shift-sync-6.preview.emergentagent.com/landing

## Prioritized Backlog
### P1 (Next)
- Sistema recupero password con codice (iniziato, da completare)
- Push notifications per turni non completati

### P2
- Integrazione Stripe per pagamenti automatici abbonamenti
- Export storico in PDF
- Multi-bar support

