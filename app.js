// Données simulées avec localStorage
let events = [];
let currentUserRole = 'coach'; // 'coach' ou 'player'

// Joueurs fictifs pour la démo
const teamPlayers = [
    { id: 'player1', name: 'Lucas Dubois' },
    { id: 'player2', name: 'Emma Martin' },
    { id: 'player3', name: 'Thomas Bernard' },
    { id: 'player4', name: 'Sarah Petit' }
];

// Stockage des réponses de présence: { eventId: { playerId: 'present'|'absent'|'waiting' } }
let attendances = {};

// Chargement initial depuis localStorage
function loadData() {
    const storedEvents = localStorage.getItem('teamcoach_events');
    if (storedEvents) {
        events = JSON.parse(storedEvents);
    } else {
        // Événements de démonstration
        const now = new Date();
        events = [
            {
                id: 'evt1',
                type: 'match_officiel',
                title: 'VS FC Barcelone',
                matchDateTime: new Date(now.getTime() + 86400000 * 3).toISOString().slice(0, 16),
                callTime: new Date(now.getTime() + 86400000 * 3 - 3600000).toISOString().slice(0, 16),
                location: 'Stade des Étoiles, 75001 Paris',
                notes: 'Prévoir maillot blanc, arrivée 30min avant convocation',
                createdAt: new Date().toISOString()
            },
            {
                id: 'evt2',
                type: 'tournoi',
                title: 'Tournoi Indoor Paris',
                matchDateTime: new Date(now.getTime() + 86400000 * 10).toISOString().slice(0, 16),
                callTime: new Date(now.getTime() + 86400000 * 10 - 7200000).toISOString().slice(0, 16),
                location: 'Gymnase Jean Bouin',
                notes: 'Plateau repas fourni',
                createdAt: new Date().toISOString()
            }
        ];
        saveEvents();
    }

    const storedAttendances = localStorage.getItem('teamcoach_attendances');
    if (storedAttendances) {
        attendances = JSON.parse(storedAttendances);
    } else {
        attendances = {};
        saveAttendances();
    }
}

function saveEvents() {
    localStorage.setItem('teamcoach_events', JSON.stringify(events));
}

function saveAttendances() {
    localStorage.setItem('teamcoach_attendances', JSON.stringify(attendances));
}

// Ajouter un événement
function addEvent(eventData) {
    const newEvent = {
        id: Date.now().toString(),
        ...eventData,
        createdAt: new Date().toISOString()
    };
    events.unshift(newEvent); // plus récent en premier
    saveEvents();
    renderEvents();
}

// Mettre à jour le statut d'un joueur pour un événement
function updateAttendance(eventId, playerId, status) {
    if (!attendances[eventId]) {
        attendances[eventId] = {};
    }
    attendances[eventId][playerId] = status;
    saveAttendances();
    renderEvents();
}

// Obtenir le statut d'un joueur sur un événement
function getPlayerStatus(eventId, playerId) {
    return attendances[eventId]?.[playerId] || 'waiting';
}

// Rendu des événements selon le rôle
function renderEvents() {
    const container = document.getElementById('eventsList');
    if (!container) return;

    if (events.length === 0) {
        container.innerHTML = '<div class="loading">🎯 Aucun événement. Créez-en en tant que coach !</div>';
        return;
    }

    // Trier par date de match (plus proche en premier)
    const sorted = [...events].sort((a,b) => new Date(a.matchDateTime) - new Date(b.matchDateTime));

    container.innerHTML = sorted.map(event => {
        const matchDateFormatted = new Date(event.matchDateTime).toLocaleString('fr-FR');
        const callDateFormatted = new Date(event.callTime).toLocaleString('fr-FR');
        const typeLabel = getTypeLabel(event.type);
        
        // Affichage spécifique pour coach ou joueur
        let attendanceHtml = '';
        if (currentUserRole === 'player') {
            // mode joueur: afficher les boutons Présent/Absent/En attente pour LE joueur fictif (on prend le premier joueur pour la démo)
            // En réalité on connecterait un vrai user. Ici pour simuler on prend "Lucas Dubois" comme joueur courant
            const currentPlayerId = 'player1'; // joueur connecté simulé
            const currentPlayerName = 'Lucas Dubois';
            const currentStatus = getPlayerStatus(event.id, currentPlayerId);
            
            attendanceHtml = `
                <div class="status-section">
                    <div><strong>${currentPlayerName}</strong> - Votre statut :</div>
                    <div class="status-buttons">
                        <button class="status-btn ${currentStatus === 'present' ? 'active' : ''}" data-event="${event.id}" data-status="present">✅ Présent</button>
                        <button class="status-btn ${currentStatus === 'absent' ? 'active' : ''} absent" data-event="${event.id}" data-status="absent">❌ Absent</button>
                        <button class="status-btn ${currentStatus === 'waiting' ? 'active' : ''} waiting" data-event="${event.id}" data-status="waiting">⏳ En attente</button>
                    </div>
                </div>
            `;
        } else {
            // Mode coach : afficher le tableau des statuts pour tous les joueurs
            const playersStatusHtml = teamPlayers.map(player => {
                const status = getPlayerStatus(event.id, player.id);
                let statusIcon = '⏳';
                let statusText = 'En attente';
                if (status === 'present') { statusIcon = '✅'; statusText = 'Présent'; }
                if (status === 'absent') { statusIcon = '❌'; statusText = 'Absent'; }
                return `<div style="display:inline-block; margin-right: 16px; background:#f1f5f9; padding:4px 12px; border-radius:20px;">${player.name} : ${statusIcon} ${statusText}</div>`;
            }).join('');
            
            attendanceHtml = `
                <div class="status-section">
                    <strong>📊 Convocation - Réponses des joueurs :</strong>
                    <div style="margin-top: 8px; display: flex; flex-wrap: wrap; gap: 8px;">
                        ${playersStatusHtml}
                    </div>
                    <div style="margin-top: 12px; font-size:0.8rem; color:#f59e0b;">✏️ Les joueurs peuvent modifier leur statut en mode Joueur</div>
                </div>
            `;
        }
        
        return `
            <div class="event-card" data-event-id="${event.id}">
                <div class="event-header">
                    <span class="event-title">${escapeHtml(event.title)}</span>
                    <span class="event-badge">${typeLabel}</span>
                </div>
                <div class="event-details">
                    <div class="detail-item">📅 <strong>Match :</strong> ${matchDateFormatted}</div>
                    <div class="detail-item">⏰ <strong>Convocation :</strong> ${callDateFormatted}</div>
                    <div class="detail-item">📍 <strong>Lieu :</strong> ${escapeHtml(event.location)}</div>
                </div>
                ${event.notes ? `<div class="notes">📌 ${escapeHtml(event.notes)}</div>` : ''}
                ${attendanceHtml}
            </div>
        `;
    }).join('');

    // Attacher les événements pour les boutons (mode joueur)
    if (currentUserRole === 'player') {
        document.querySelectorAll('.status-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const eventId = btn.getAttribute('data-event');
                const status = btn.getAttribute('data-status');
                const currentPlayerId = 'player1'; // id joueur simulé
                let newStatus = 'waiting';
                if (status === 'present') newStatus = 'present';
                if (status === 'absent') newStatus = 'absent';
                if (status === 'waiting') newStatus = 'waiting';
                updateAttendance(eventId, currentPlayerId, newStatus);
            });
        });
    }
}

// helper label
function getTypeLabel(type) {
    const map = {
        'match_amical': '⚽ Match amical',
        'coupe': '🏆 Coupe',
        'tournoi': '🎯 Tournoi',
        'match_officiel': '📋 Match officiel'
    };
    return map[type] || 'Événement';
}

// Échappement simple XSS
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Switch rôle
function switchRole() {
    currentUserRole = currentUserRole === 'coach' ? 'player' : 'coach';
    const roleDisplay = document.getElementById('userRoleDisplay');
    const adminPanel = document.getElementById('adminPanel');
    const switchBtn = document.getElementById('switchRoleBtn');
    
    if (currentUserRole === 'coach') {
        roleDisplay.innerText = 'Mode: Coach / Admin';
        adminPanel.classList.remove('hidden');
        switchBtn.innerText = '👥 Mode Joueur';
    } else {
        roleDisplay.innerText = 'Mode: Joueur';
        adminPanel.classList.add('hidden');
        switchBtn.innerText = '🛠️ Mode Coach';
    }
    renderEvents();
}

// Gestionnaire formulaire (coach)
function initEventForm() {
    const form = document.getElementById('eventForm');
    if (!form) return;
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const eventType = document.getElementById('eventType').value;
        const eventTitle = document.getElementById('eventTitle').value.trim();
        const matchDateTime = document.getElementById('matchDateTime').value;
        const callTime = document.getElementById('callTime').value;
        const location = document.getElementById('location').value.trim();
        const notes = document.getElementById('notes').value.trim();
        
        if (!eventTitle || !matchDateTime || !callTime || !location) {
            alert('Veuillez remplir tous les champs obligatoires (*)');
            return;
        }
        
        // Validation: convocation avant match
        if (new Date(callTime) >= new Date(matchDateTime)) {
            alert('L\'heure de convocation doit être antérieure à l\'heure du match !');
            return;
        }
        
        addEvent({
            type: eventType,
            title: eventTitle,
            matchDateTime: matchDateTime,
            callTime: callTime,
            location: location,
            notes: notes
        });
        
        // reset formulaire partiel mais on garde les valeurs par défaut non écrasantes
        document.getElementById('eventTitle').value = '';
        document.getElementById('notes').value = '';
        document.getElementById('eventType').value = 'match_amical';
        // on peut laisser datetime vides mais par commodité on reset pas les dates pour ne pas re-saisir tout
    });
}

// Initialisation globale
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initEventForm();
    const switchBtn = document.getElementById('switchRoleBtn');
    if (switchBtn) switchBtn.addEventListener('click', switchRole);
    // Vérifier la cohérence des données existantes pour attendances manquantes
    renderEvents();
});