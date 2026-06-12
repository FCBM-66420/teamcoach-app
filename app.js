// ============ STRUCTURE DE DONNÉES ============
let appData = {
    admin: {
        password: "admin123"  // Mot de passe admin par défaut
    },
    teams: {},  // { teamCode: { name, coachPassword, players, events, messages, pendingPlayers } }
    currentUser: null  // { role, teamCode, playerId, name }
};

// ============ INITIALISATION ============
function loadData() {
    const saved = localStorage.getItem('teamcoach_multi_data');
    if (saved) {
        appData = JSON.parse(saved);
    } else {
        // Créer une équipe de démo
        appData.teams = {
            "TIGERS2024": {
                name: "Tigres FC",
                coachPassword: "coach123",
                players: {},
                events: [],
                messages: [],
                pendingPlayers: {}
            }
        };
        saveData();
    }
}

function saveData() {
    localStorage.setItem('teamcoach_multi_data', JSON.stringify(appData));
}

function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), duration);
}

// ============ SYSTÈME DE CONNEXION ============
function showAdminCode() {
    document.getElementById('adminCodeDiv').classList.remove('hidden');
    document.getElementById('coachLoginDiv').classList.add('hidden');
    document.getElementById('playerLoginDiv').classList.add('hidden');
    document.getElementById('createTeamDiv').classList.add('hidden');
}

function showCoachLogin() {
    document.getElementById('coachLoginDiv').classList.remove('hidden');
    document.getElementById('adminCodeDiv').classList.add('hidden');
    document.getElementById('playerLoginDiv').classList.add('hidden');
    document.getElementById('createTeamDiv').classList.add('hidden');
}

function showPlayerLogin() {
    document.getElementById('playerLoginDiv').classList.remove('hidden');
    document.getElementById('adminCodeDiv').classList.add('hidden');
    document.getElementById('coachLoginDiv').classList.add('hidden');
    document.getElementById('createTeamDiv').classList.add('hidden');
}

function showCreateTeam() {
    document.getElementById('createTeamDiv').classList.remove('hidden');
    document.getElementById('coachLoginDiv').classList.add('hidden');
}

function loginAsAdmin() {
    const code = document.getElementById('adminCode').value;
    if (code === appData.admin.password) {
        appData.currentUser = { role: 'admin' };
        saveData();
        showMainApp();
        showToast('👑 Bienvenue Administrateur');
    } else {
        showToast('Code admin incorrect');
    }
}

function loginAsCoach() {
    const teamCode = document.getElementById('coachTeamCode').value.toUpperCase();
    const password = document.getElementById('coachPassword').value;
    
    if (appData.teams[teamCode] && appData.teams[teamCode].coachPassword === password) {
        appData.currentUser = { role: 'coach', teamCode: teamCode };
        saveData();
        showMainApp();
        showToast(`👥 Bienvenue Coach de ${appData.teams[teamCode].name}`);
    } else {
        showToast('Code équipe ou mot de passe incorrect');
    }
}

function requestToJoin() {
    const teamCode = document.getElementById('playerTeamCode').value.toUpperCase();
    const playerName = document.getElementById('playerName').value.trim();
    
    if (!appData.teams[teamCode]) {
        showToast('Code équipe invalide');
        return;
    }
    if (!playerName) {
        showToast('Entrez votre nom');
        return;
    }
    
    const playerId = Date.now().toString();
    if (!appData.teams[teamCode].pendingPlayers) {
        appData.teams[teamCode].pendingPlayers = {};
    }
    appData.teams[teamCode].pendingPlayers[playerId] = {
        name: playerName,
        requestedAt: new Date().toISOString()
    };
    saveData();
    showToast('✅ Demande envoyée ! Un coach va valider votre inscription.');
    
    // Reset form
    document.getElementById('playerTeamCode').value = '';
    document.getElementById('playerName').value = '';
}

function createTeam() {
    const teamName = document.getElementById('newTeamName').value.trim();
    const teamCode = document.getElementById('newTeamCode').value.toUpperCase();
    const coachPassword = document.getElementById('newCoachPassword').value;
    
    if (!teamName || !teamCode || !coachPassword) {
        showToast('Veuillez remplir tous les champs');
        return;
    }
    if (appData.teams[teamCode]) {
        showToast('Ce code équipe existe déjà');
        return;
    }
    
    appData.teams[teamCode] = {
        name: teamName,
        coachPassword: coachPassword,
        players: {},
        events: [],
        messages: [],
        pendingPlayers: {}
    };
    saveData();
    showToast(`✅ Équipe "${teamName}" créée ! Connectez-vous en tant que coach.`);
    showCoachLogin();
}

// ============ AFFICHAGE PRINCIPAL ============
function showMainApp() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    
    // Afficher les bons onglets selon le rôle
    const isAdmin = appData.currentUser.role === 'admin';
    const isCoach = appData.currentUser.role === 'coach';
    
    document.getElementById('playersTabBtn').style.display = (isAdmin || isCoach) ? 'block' : 'none';
    document.getElementById('teamsTabBtn').style.display = isAdmin ? 'block' : 'none';
    
    // Afficher les infos utilisateur
    if (isAdmin) {
        document.getElementById('userNameDisplay').innerHTML = '👑 Administrateur';
        document.getElementById('userRoleBadge').innerHTML = 'Super Admin';
        document.getElementById('teamBadge').innerHTML = '';
    } else if (isCoach) {
        const team = appData.teams[appData.currentUser.teamCode];
        document.getElementById('userNameDisplay').innerHTML = `👥 Coach`;
        document.getElementById('userRoleBadge').innerHTML = 'Coach';
        document.getElementById('teamBadge').innerHTML = team.name;
    } else {
        const team = appData.teams[appData.currentUser.teamCode];
        const player = team.players[appData.currentUser.playerId];
        document.getElementById('userNameDisplay').innerHTML = `🎮 ${player.name}`;
        document.getElementById('userRoleBadge').innerHTML = 'Joueur';
        document.getElementById('teamBadge').innerHTML = team.name;
    }
    
    // Masquer panneau admin/coach si joueur
    const adminPanel = document.getElementById('adminEventPanel');
    if (adminPanel) {
        adminPanel.style.display = (isAdmin || isCoach) ? 'block' : 'none';
    }
    
    loadEvents();
    loadMessages();
    loadPlayersList();
    
    if (isAdmin) {
        loadAllTeams();
    }
    
    setupEventListeners();
}

function setupEventListeners() {
    // Onglets
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`${tabId}Tab`).classList.add('active');
            
            if (tabId === 'locker') loadMessages();
            if (tabId === 'players') loadPlayersList();
            if (tabId === 'teams') loadAllTeams();
        });
    });
    
    // Formulaire événement
    const eventForm = document.getElementById('eventForm');
    if (eventForm) {
        eventForm.addEventListener('submit', (e) => {
            e.preventDefault();
            createEvent();
        });
    }
    
    // Envoyer message
    document.getElementById('sendMessageBtn')?.addEventListener('click', sendMessage);
    
    // Relancer non-répondants
    document.getElementById('notifyNonRespondersBtn')?.addEventListener('click', notifyNonResponders);
    
    // Déconnexion
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
    
    // Remplir sélecteur d'événements pour relance
    updateEventSelector();
}

function logout() {
    appData.currentUser = null;
    saveData();
    location.reload();
}

// ============ GESTION DES ÉVÉNEMENTS ============
function createEvent() {
    const teamCode = appData.currentUser.role === 'admin' ? Object.keys(appData.teams)[0] : appData.currentUser.teamCode;
    if (appData.currentUser.role !== 'admin' && appData.currentUser.role !== 'coach') return;
    
    const event = {
        id: Date.now().toString(),
        type: document.getElementById('eventType').value,
        title: document.getElementById('eventTitle').value,
        matchDateTime: document.getElementById('matchDateTime').value,
        callTime: document.getElementById('callTime').value,
        location: document.getElementById('location').value,
        notes: document.getElementById('notes').value,
        attendances: {}
    };
    
    if (!event.title || !event.matchDateTime || !event.callTime || !event.location) {
        showToast('Veuillez remplir tous les champs');
        return;
    }
    
    if (new Date(event.callTime) >= new Date(event.matchDateTime)) {
        showToast('La convocation doit être avant le match');
        return;
    }
    
    if (appData.currentUser.role === 'admin') {
        // Admin ajoute à toutes les équipes ou choisit
        for (let code in appData.teams) {
            appData.teams[code].events.unshift({...event});
        }
    } else {
        appData.teams[teamCode].events.unshift(event);
    }
    
    saveData();
    loadEvents();
    updateEventSelector();
    showToast('Événement créé avec succès !');
    
    // Reset form
    document.getElementById('eventTitle').value = '';
    document.getElementById('notes').value = '';
}

function loadEvents() {
    const container = document.getElementById('eventsList');
    let events = [];
    
    if (appData.currentUser.role === 'admin') {
        // Admin voit tous les événements de toutes les équipes
        for (let code in appData.teams) {
            events.push(...appData.teams[code].events.map(e => ({...e, teamName: appData.teams[code].name})));
        }
        events.sort((a,b) => new Date(a.matchDateTime) - new Date(b.matchDateTime));
    } else {
        const team = appData.teams[appData.currentUser.teamCode];
        events = team.events || [];
        events.sort((a,b) => new Date(a.matchDateTime) - new Date(b.matchDateTime));
    }
    
    if (events.length === 0) {
        container.innerHTML = '<div class="loading">📅 Aucun événement programmé</div>';
        return;
    }
    
    const isAdminOrCoach = (appData.currentUser.role === 'admin' || appData.currentUser.role === 'coach');
    
    container.innerHTML = events.map(event => {
        const matchDate = new Date(event.matchDateTime).toLocaleString('fr-FR');
        const callDate = new Date(event.callTime).toLocaleString('fr-FR');
        
        let attendanceHtml = '';
        if (!isAdminOrCoach && appData.currentUser.role === 'player') {
            const team = appData.teams[appData.currentUser.teamCode];
            const playerStatus = event.attendances?.[appData.currentUser.playerId] || 'waiting';
            attendanceHtml = `
                <div class="status-section">
                    <div class="status-buttons">
                        <button class="status-btn ${playerStatus === 'present' ? 'active' : ''}" onclick="setAttendance('${event.id}', 'present')">✅ Présent</button>
                        <button class="status-btn ${playerStatus === 'absent' ? 'active' : ''} absent" onclick="setAttendance('${event.id}', 'absent')">❌ Absent</button>
                        <button class="status-btn ${playerStatus === 'waiting' ? 'active' : ''} waiting" onclick="setAttendance('${event.id}', 'waiting')">⏳ En attente</button>
                    </div>
                </div>
            `;
        } else if (isAdminOrCoach) {
            const team = appData.currentUser.role === 'admin' ? null : appData.teams[appData.currentUser.teamCode];
            const players = team ? team.players : getAllPlayers();
            const stats = Object.values(players).map(p => {
                const status = event.attendances?.[p.id] || 'waiting';
                const icon = status === 'present' ? '✅' : status === 'absent' ? '❌' : '⏳';
                return `<span style="margin-right:8px">${p.name}: ${icon}</span>`;
            }).join('');
            attendanceHtml = `<div class="status-section"><strong>Réponses:</strong><br>${stats || 'Aucun joueur'}</div>`;
        }
        
        return `
            <div class="event-card">
                <div class="event-header">
                    <span class="event-title">${escapeHtml(event.title)}</span>
                    <span class="event-badge">${getTypeLabel(event.type)}</span>
                </div>
                ${event.teamName ? `<div style="font-size:0.8rem; color:#f59e0b">🏷️ ${event.teamName}</div>` : ''}
                <div class="event-details">
                    <div>📅 Match: ${matchDate}</div>
                    <div>⏰ Convocation: ${callDate}</div>
                    <div>📍 ${escapeHtml(event.location)}</div>
                </div>
                ${event.notes ? `<div class="notes">📌 ${escapeHtml(event.notes)}</div>` : ''}
                ${attendanceHtml}
            </div>
        `;
    }).join('');
}

function setAttendance(eventId, status) {
    const team = appData.teams[appData.currentUser.teamCode];
    const event = team.events.find(e => e.id === eventId);
    if (event) {
        if (!event.attendances) event.attendances = {};
        event.attendances[appData.currentUser.playerId] = status;
        saveData();
        loadEvents();
        showToast(`Statut mis à jour: ${status === 'present' ? 'Présent' : status === 'absent' ? 'Absent' : 'En attente'}`);
    }
}

function updateEventSelector() {
    const selector = document.getElementById('eventSelector');
    if (!selector) return;
    
    let events = [];
    if (appData.currentUser.role === 'admin') {
        for (let code in appData.teams) {
            events.push(...appData.teams[code].events.map(e => ({...e, teamCode: code})));
        }
    } else {
        const team = appData.teams[appData.currentUser.teamCode];
        events = team.events || [];
    }
    
    selector.innerHTML = '<option value="">Sélectionner un événement</option>' + 
        events.map(e => `<option value="${e.id}">${e.title} - ${new Date(e.matchDateTime).toLocaleDateString()}</option>`).join('');
}

function notifyNonResponders() {
    const eventId = document.getElementById('eventSelector').value;
    if (!eventId) {
        showToast('Sélectionnez un événement');
        return;
    }
    
    let team, event;
    if (appData.currentUser.role === 'admin') {
        // Trouver l'événement
        for (let code in appData.teams) {
            const ev = appData.teams[code].events.find(e => e.id === eventId);
            if (ev) {
                team = appData.teams[code];
                event = ev;
                break;
            }
        }
    } else {
        team = appData.teams[appData.currentUser.teamCode];
        event = team.events.find(e => e.id === eventId);
    }
    
    if (!event) return;
    
    const nonResponders = Object.values(team.players).filter(p => {
        const status = event.attendances?.[p.id];
        return !status || status === 'waiting';
    });
    
    if (nonResponders.length === 0) {
        showToast('Tout le monde a répondu !');
        return;
    }
    
    // Ajouter une notification dans les messages
    const message = {
        id: Date.now().toString(),
        author: 'Système',
        authorId: 'system',
        text: `📢 RAPPEL: Merci de répondre pour l'événement "${event.title}" du ${new Date(event.matchDateTime).toLocaleDateString()}`,
        timestamp: new Date().toISOString(),
        isSystem: true
    };
    
    if (!team.messages) team.messages = [];
    team.messages.push(message);
    saveData();
    
    showToast(`📢 Relance envoyée à ${nonResponders.length} joueur(s) dans le vestiaire`);
    loadMessages();
}

// ============ MESSAGES (VESTIAIRE) ============
function sendMessage() {
    const text = document.getElementById('messageInput').value.trim();
    const recipient = document.getElementById('messageRecipient').value;
    
    if (!text) {
        showToast('Écrivez un message');
        return;
    }
    
    const team = appData.teams[appData.currentUser.teamCode];
    const message = {
        id: Date.now().toString(),
        author: appData.currentUser.role === 'admin' ? 'Admin' : 
                (appData.currentUser.role === 'coach' ? `Coach ${team.name}` : 
                team.players[appData.currentUser.playerId]?.name || 'Joueur'),
        authorId: appData.currentUser.playerId || appData.currentUser.role,
        text: text,
        recipient: recipient,
        timestamp: new Date().toISOString()
    };
    
    if (!team.messages) team.messages = [];
    team.messages.push(message);
    saveData();
    
    document.getElementById('messageInput').value = '';
    loadMessages();
    showToast('Message envoyé !');
}

function loadMessages() {
    const container = document.getElementById('messagesList');
    if (!container) return;
    
    const team = appData.teams[appData.currentUser.teamCode];
    if (!team || !team.messages) {
        container.innerHTML = '<div class="loading">💬 Aucun message</div>';
        return;
    }
    
    const isAdminOrCoach = (appData.currentUser.role === 'admin' || appData.currentUser.role === 'coach');
    const currentPlayerId = appData.currentUser.playerId;
    
    const messages = team.messages.filter(m => {
        if (m.recipient === 'all') return true;
        if (m.recipient === 'coach' && isAdminOrCoach) return true;
        if (m.recipient !== 'coach' && m.authorId === currentPlayerId) return true;
        return false;
    }).reverse();
    
    container.innerHTML = messages.map(m => `
        <div class="message">
            <div class="message-header">
                <span class="message-author">${escapeHtml(m.author)}</span>
                <span>${new Date(m.timestamp).toLocaleString()}</span>
            </div>
            <div class="message-text">${escapeHtml(m.text)}</div>
        </div>
    `).join('');
}

// ============ GESTION DES JOUEURS ============
function loadPlayersList() {
    const container = document.getElementById('playersList');
    const pendingDiv = document.getElementById('pendingRequestsDiv');
    
    if (!container) return;
    
    const isAdminOrCoach = (appData.currentUser.role === 'admin' || appData.currentUser.role === 'coach');
    
    if (!isAdminOrCoach) {
        container.innerHTML = '<div class="loading">Seul le coach peut gérer les joueurs</div>';
        if (pendingDiv) pendingDiv.classList.add('hidden');
        return;
    }
    
    let team;
    if (appData.currentUser.role === 'admin') {
        // Admin peut choisir une équipe, pour simplifier on prend la première
        const firstTeam = Object.keys(appData.teams)[0];
        team = appData.teams[firstTeam];
    } else {
        team = appData.teams[appData.currentUser.teamCode];
    }
    
    // Afficher les joueurs approuvés
    const players = Object.entries(team.players || {}).map(([id, p]) => ({id, ...p}));
    container.innerHTML = `
        <h4>✅ Joueurs approuvés (${players.length})</h4>
        ${players.map(p => `
            <div class="player-card">
                <span>${escapeHtml(p.name)}</span>
                <div>
                    <button onclick="removePlayer('${p.id}')" class="remove-btn">❌ Retirer</button>
                </div>
            </div>
        `).join('')}
    `;
    
    // Afficher les demandes en attente
    const pending = Object.entries(team.pendingPlayers || {});
    if (pendingDiv) {
        if (pending.length > 0) {
            pendingDiv.classList.remove('hidden');
            document.getElementById('requestsList').innerHTML = pending.map(([id, p]) => `
                <div class="player-card">
                    <span>🕐 ${escapeHtml(p.name)}</span>
                    <button onclick="approvePlayer('${id}')" class="approve-btn">✅ Approuver</button>
                </div>
            `).join('');
        } else {
            pendingDiv.classList.add('hidden');
        }
    }
}

function approvePlayer(playerId) {
    let team;
    if (appData.currentUser.role === 'admin') {
        const firstTeam = Object.keys(appData.teams)[0];
        team = appData.teams[firstTeam];
    } else {
        team = appData.teams[appData.currentUser.teamCode];
    }
    
    const playerData = team.pendingPlayers[playerId];
    if (playerData) {
        if (!team.players) team.players = {};
        team.players[playerId] = {
            id: playerId,
            name: playerData.name,
            joinedAt: new Date().toISOString()
        };
        delete team.pendingPlayers[playerId];
        saveData();
        loadPlayersList();
        showToast(`${playerData.name} a rejoint l'équipe !`);
    }
}

function removePlayer(playerId) {
    let team;
    if (appData.currentUser.role === 'admin') {
        const firstTeam = Object.keys(appData.teams)[0];
        team = appData.teams[firstTeam];
    } else {
        team = appData.teams[appData.currentUser.teamCode];
    }
    
    const player = team.players[playerId];
    if (player && confirm(`Retirer ${player.name} de l'équipe ?`)) {
        delete team.players[playerId];
        saveData();
        loadPlayersList();
        showToast(`${player.name} a été retiré`);
    }
}

// ============ ADMIN - GESTION DES ÉQUIPES ============
function loadAllTeams() {
    const container = document.getElementById('allTeamsList');
    if (!container) return;
    
    container.innerHTML = Object.entries(appData.teams).map(([code, team]) => `
        <div class="team-card">
            <h4>🏆 ${escapeHtml(team.name)}</h4>
            <p>Code: <strong>${code}</strong></p>
            <p>👥 Joueurs: ${Object.keys(team.players || {}).length}</p>
            <p>📅 Événements: ${(team.events || []).length}</p>
            <button onclick="deleteTeam('${code}')" class="remove-btn">🗑️ Supprimer l'équipe</button>
        </div>
    `).join('');
}

function deleteTeam(teamCode) {
    if (confirm(`Supprimer l'équipe ${appData.teams[teamCode].name} ?`)) {
        delete appData.teams[teamCode];
        saveData();
        loadAllTeams();
        showToast('Équipe supprimée');
    }
}

// ============ UTILITAIRES ============
function getTypeLabel(type) {
    const map = {
        'match_amical': '⚽ Amical',
        'coupe': '🏆 Coupe',
        'tournoi': '🎯 Tournoi',
        'match_officiel': '📋 Officiel',
        'entrainement': '🏋️ Entraînement'
    };
    return map[type] || 'Événement';
}

function getAllPlayers() {
    const players = [];
    for (let code in appData.teams) {
        for (let id in appData.teams[code].players) {
            players.push(appData.teams[code].players[id]);
        }
    }
    return players;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ============ DÉMARRAGE ============
loadData();

// Exposer certaines fonctions globalement
window.setAttendance = setAttendance;
window.approvePlayer = approvePlayer;
window.removePlayer = removePlayer;
window.deleteTeam = deleteTeam;
window.showAdminCode = showAdminCode;
window.showCoachLogin = showCoachLogin;
window.showPlayerLogin = showPlayerLogin;
window.showCreateTeam = showCreateTeam;
window.loginAsAdmin = loginAsAdmin;
window.loginAsCoach = loginAsCoach;
window.requestToJoin = requestToJoin;
window.createTeam = createTeam;