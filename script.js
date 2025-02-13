const firebaseConfig = {
    apiKey: "AIzaSyDBgmCf18ClKz5dG80wWgO9l3zEtAru1fY",
    authDomain: "pi03-117c7.firebaseapp.com",
    projectId: "pi03-117c7",
    storageBucket: "pi03-117c7.firebasestorage.app",
    messagingSenderId: "351182791641",
    appId: "1:351182791641:web:835d1d06506ec89d65afc8"
};

// Initialize Firebase (only if not already initialized)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// Add this function to check and handle blocked status
async function checkBlockedStatus() {
    try {
        // Check if site is blocked
        const blockedDoc = await db.collection('master').doc('Blocked').get();
        const user = firebase.auth().currentUser;
        
        // If site is blocked, show message regardless of login status
        if (blockedDoc.exists && blockedDoc.data().Enabled === true) {
            // If user is logged in, also check for ban status
            if (user) {
                const userDoc = await db.collection('users').doc(user.uid).get();
                if (userDoc.exists && userDoc.data().Banned === true) {
                    showBlockedMessage(true); // Show banned message
                    return true;
                }
            }
            showBlockedMessage(false, blockedDoc.data()); // Pass blocked data to show message
            return true;
        }

        // If site is not blocked but user is logged in, check for ban
        if (user) {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists && userDoc.data().Banned === true) {
                showBlockedMessage(true); // Show banned message
                return true;
            }
        }

        return false; // Site is not blocked and user is not banned
    } catch (error) {
        console.error("Error checking blocked/banned status:", error);
        return false;
    }
}

function showBlockedMessage(isBanned, blockedData = {}) {
    // Clear the entire page content and show terminal-style loader
    document.body.innerHTML = `
        <div class="terminal-loader">
            <div class="terminal-header">
                <div class="terminal-title">Status</div>
                <div class="terminal-controls">
                    <div class="control close"></div>
                    <div class="control minimize"></div>
                    <div class="control maximize"></div>
                </div>
            </div>
            <div class="text"></div>
        </div>
    `;

    // Add typing effect
    const textElement = document.querySelector('.terminal-loader .text');
    const text = isBanned 
        ? `Usuário Banido!\nContate um Administrador para mais informações.`
        : `Site Bloqueado Por Um Administrador!\nMensagem do Administrador:\n${blockedData.Text || 'Nenhuma mensagem fornecida'}`;
    
    let index = 0;
    
    function typeText() {
        if (index < text.length) {
            textElement.textContent = text.slice(0, index + 1);
            index++;
            setTimeout(typeText, 50);
        }
    }
    
    typeText();
}

// Add real-time listener for blocked status
function setupBlockedListener() {
    db.collection('master').doc('Blocked').onSnapshot(async (doc) => {
        if (doc.exists && doc.data().Enabled === true) {
            await checkBlockedStatus();
        }
    }, (error) => {
        console.error("Error setting up blocked listener:", error);
    });
}

// Modify your existing DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', async function() {
    setupDevToolsProtection();
    const loaderWrapper = document.getElementById('loader-wrapper');
    const startTime = Date.now();

    // Check blocked status first
    const isBlocked = await checkBlockedStatus();
    
    if (!isBlocked) {
        // Only setup normal page functionality if not blocked
        setupBlockedListener();
        
        // Your existing loader code
        function removeLoader() {
            if (loaderWrapper) {
                loaderWrapper.classList.add('fade-out');
                setTimeout(() => {
                    loaderWrapper.style.display = 'none';
                }, 300);
            }
        }

        function hideLoader() {
            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(300 - elapsedTime, 0);
            setTimeout(removeLoader, remainingTime);
        }

        window.addEventListener('load', hideLoader);
        setTimeout(hideLoader, 2000);
    } else {
        // If blocked, just remove the loader
        if (loaderWrapper) {
            loaderWrapper.style.display = 'none';
        }
    }
});

// Update the loadProfilePicture function
async function loadProfilePicture(url, imgElement, userName) {
    if (!url) {
        // Use a more reliable default avatar service
        imgElement.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random&color=fff&size=80`;
        return;
    }

    // Try to get from cache first
    const cachedImage = await imageCache.get(url);
    if (cachedImage) {
        imgElement.src = URL.createObjectURL(cachedImage);
        return;
    }

    // If not in cache, fetch and cache
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        await imageCache.set(url, blob);
        imgElement.src = URL.createObjectURL(blob);
    } catch (error) {
        console.error('Error loading image:', error);
        // Fallback to generated avatar
        imgElement.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random&color=fff&size=80`;
    }
}

// Add this to your existing script.js
function checkAchievements(userId) {
    db.collection('users').doc(userId).get().then(doc => {
        const userData = doc.data();
        const userAchievements = userData.achievements || {};
        
        // Check first reading
        if (userData.readings?.length > 0 && !userAchievements.first_reading) {
            unlockAchievement(userId, 'first_reading');
        }
        
        // Check 100 readings
        if (userData.readings?.length >= 100 && !userAchievements.readings_100) {
            unlockAchievement(userId, 'readings_100');
        }
        
        // Check 1000 readings
        if (userData.readings?.length >= 1000 && !userAchievements.readings_1000) {
            unlockAchievement(userId, 'readings_1000');
        }
        
        // Check 10000 readings
        if (userData.readings?.length >= 10000 && !userAchievements.readings_10000) {
            unlockAchievement(userId, 'readings_10000');
        }
        
        // Check 100000 readings
        if (userData.readings?.length >= 100000 && !userAchievements.readings_100000) {
            unlockAchievement(userId, 'readings_100000');
        }
        
        // Check 1000000 readings
        if (userData.readings?.length >= 1000000 && !userAchievements.readings_1000000) {
            unlockAchievement(userId, 'readings_1000000');
        }
        
        // Check night owl achievement
        const nightReadings = userData.readings?.filter(r => {
            const hour = new Date(r.timestamp).getHours();
            return hour >= 0 && hour < 5;
        }).length || 0;
        
        if (nightReadings >= 10 && !userAchievements.night_owl) {
            unlockAchievement(userId, 'night_owl');
        }
        
        // Check socket master achievement
        const uniqueSockets = new Set(userData.sockets?.map(s => s.id)).size;
        if (uniqueSockets >= 5 && !userAchievements.socket_master) {
            unlockAchievement(userId, 'socket_master');
        }
        
        // Check forum expert achievement
        if (userData.forumPosts >= 50 && !userAchievements.forum_expert) {
            unlockAchievement(userId, 'forum_expert');
        }
        
        // Check early bird achievement
        const earlyReadings = userData.readings?.filter(r => {
            const hour = new Date(r.timestamp).getHours();
            return hour >= 5 && hour < 7;
        }).length || 0;
        
        if (earlyReadings >= 10 && !userAchievements.early_bird) {
            unlockAchievement(userId, 'early_bird');
        }
        
        // Check premium user achievement
        if (userData.plan === 'premium' && !userAchievements.premium_user) {
            unlockAchievement(userId, 'premium_user');
        }
        
        // Check customizer achievement
        const customizedSockets = userData.sockets?.filter(s => s.customName).length || 0;
        if (customizedSockets >= 5 && !userAchievements.customizer) {
            unlockAchievement(userId, 'customizer');
        }
        
        // Check data analyst achievement
        const exportCount = userData.dataExports || 0;
        if (exportCount >= 10 && !userAchievements.data_analyst) {
            unlockAchievement(userId, 'data_analyst');
        }
        
        // Check bug hunter achievement
        const reportedBugs = userData.reportedBugs || 0;
        if (reportedBugs >= 3 && !userAchievements.bug_hunter) {
            unlockAchievement(userId, 'bug_hunter');
        }
        
        // Check holiday saver achievement
        const holidayMode = userData.settings?.holidayMode;
        if (holidayMode && holidayMode.enabled) {
            const lowConsumptionDays = holidayMode.lowConsumptionDays || 0;
            if (lowConsumptionDays >= 7 && !userAchievements.holiday_saver) {
                unlockAchievement(userId, 'holiday_saver');
            }
        }
        
        // Check socket scientist achievement
        const socketReadings = userData.sockets?.map(socket => {
            return {
                id: socket.id,
                readings: userData.readings?.filter(r => r.socketId === socket.id).length || 0
            };
        }) || [];
        
        const hasThousandReadings = socketReadings.some(s => s.readings >= 1000);
        if (hasThousandReadings && !userAchievements.socket_scientist) {
            unlockAchievement(userId, 'socket_scientist');
        }
        
        // Check midnight manager achievement
        const midnightSchedules = userData.sockets?.filter(socket => {
            return socket.schedules?.some(schedule => 
                schedule.time === '00:00' && schedule.action === 'off'
            );
        }).length || 0;
        
        if (midnightSchedules >= 3 && !userAchievements.midnight_manager) {
            unlockAchievement(userId, 'midnight_manager');
        }
        
        // Check eco warrior achievement
        const consumptionHistory = userData.consumptionHistory || [];
        let consecutiveLowDays = 0;
        let maxConsecutiveLowDays = 0;
        
        consumptionHistory.forEach((day, index) => {
            if (index === 0) {
                consecutiveLowDays = day.isLow ? 1 : 0;
            } else {
                if (day.isLow) {
                    consecutiveLowDays++;
                } else {
                    consecutiveLowDays = 0;
                }
            }
            maxConsecutiveLowDays = Math.max(maxConsecutiveLowDays, consecutiveLowDays);
        });
        
        if (maxConsecutiveLowDays >= 30 && !userAchievements.eco_warrior) {
            unlockAchievement(userId, 'eco_warrior');
        }
        
        // Check power prophet achievement
        const accuratePredictions = userData.predictions?.filter(pred => {
            const actual = pred.actualConsumption;
            const predicted = pred.predictedConsumption;
            const errorMargin = Math.abs((actual - predicted) / actual) * 100;
            return errorMargin <= 5;
        }).length || 0;
        
        if (accuratePredictions >= 5 && !userAchievements.power_prophet) {
            unlockAchievement(userId, 'power_prophet');
        }
    });
}

// Achievement definitions
const achievements = [
    {
        id: 'first_reading',
        title: 'Primeira Leitura',
        description: 'Realize sua primeira leitura de energia',
        icon: 'fa-bolt',
        points: 10,
        category: 'beginner'
    },
    {
        id: 'readings_100',
        title: 'Centenário',
        description: 'Complete 100 de leituras',
        icon: 'fa-layer-group',
        points: 50,
        category: 'intermediate'
    },
    {
        id: 'readings_1000',
        title: 'Milênio',
        description: 'Complete 1000 de leituras',
        icon: 'fa-layer-group',
        points: 100,
        category: 'intermediate'
    },
    {
        id: 'readings_10000',
        title: 'Decamilênio',
        description: 'Complete 10000 de leituras',
        icon: 'fa-layer-group',
        points: 300,
        category: 'advanced'
    },
    {
        id: 'readings_100000',
        title: 'Centimilênio',
        description: 'Complete 100000 de leituras',
        icon: 'fa-layer-group',
        points: 1000,
        category: 'special'
    },
    {
        id: 'readings_1000000',
        title: 'Milhão',
        description: 'Complete 1000000 de leituras',
        icon: 'fa-layer-group',
        points: 10000,
        category: 'special'
    },
    {
        id: 'streak_7',
        title: 'Consistente',
        description: 'Faça leituras por 7 dias seguidos',
        icon: 'fa-calendar-check',
        points: 100,
        category: 'intermediate'
    },
    {
        id: 'energy_saver',
        title: 'Economizador',
        description: 'Reduza seu consumo em 20%',
        icon: 'fa-leaf',
        points: 100,
        category: 'advanced'
    },
    {
        id: 'energy_waster',
        title: 'Esperdiçador',
        description: 'Aumente seu consumo em 20%',
        icon: 'fa-poo-storm',
        points: 50,
        category: 'advanced'
    },
    {
        id: 'night_owl',
        title: 'Coruja da Noite',
        description: 'Faça 10 leituras entre 00:00 e 05:00',
        icon: 'fa-moon',
        points: 75,
        category: 'special'
    },
    {
        id: 'socket_master',
        title: 'Mestre das Tomadas',
        description: 'Configure 5 tomadas diferentes',
        icon: 'fa-plug',
        points: 50,
        category: 'intermediate'
    },
    {
        id: 'sharing_is_caring',
        title: 'Compartilhador',
        description: 'Compartilhe suas leituras com 3 usuários',
        icon: 'fa-share-nodes',
        points: 30,
        category: 'social'
    },
    {
        id: 'forum_expert',
        title: 'Especialista do Forum',
        description: 'Faça 50 posts no forum',
        icon: 'fa-comments',
        points: 80,
        category: 'social'
    },
    {
        id: 'early_bird',
        title: 'Pássaro Madrugador',
        description: 'Faça 10 leituras entre 05:00 e 07:00',
        icon: 'fa-sun',
        points: 75,
        category: 'special'
    },
    {
        id: 'weekend_warrior',
        title: 'Guerreiro de Fim de Semana',
        description: 'Complete leituras em 4 fins de semanas seguidos',
        icon: 'fa-calendar-week',
        points: 100,
        category: 'advanced'
    },
    {
        id: 'premium_user',
        title: 'Usuário Premium',
        description: 'Assine o plano premium',
        icon: 'fa-crown',
        points: 150,
        category: 'special'
    },
    {
        id: 'data_analyst',
        title: 'Analista de Dados',
        description: 'Exporte seus dados 10 vezes',
        icon: 'fa-chart-line',
        points: 40,
        category: 'intermediate'
    },
    {
        id: 'bug_hunter',
        title: 'Caçador de Bugs',
        description: 'Reporte 3 bugs para um Staff',
        icon: 'fa-bug',
        points: 1000,
        category: 'special'
    },
    {
        id: 'customizer',
        title: 'Personalizador',
        description: 'Personalize o nome de 5 tomadas',
        icon: 'fa-paintbrush',
        points: 25,
        category: 'beginner'
    },
    {
        id: 'holiday_saver',
        title: 'Férias Econômicas',
        description: 'Mantenha o consumo baixo por 7 dias durante as férias',
        icon: 'fa-umbrella-beach',
        points: 120,
        category: 'special'
    },
    {
        id: 'socket_scientist',
        title: 'Cientista das Tomadas',
        description: 'Faça 1000 leituras em uma única tomada',
        icon: 'fa-flask',
        points: 200,
        category: 'advanced'
    },
    {
        id: 'midnight_manager',
        title: 'Gerente da Meia-Noite',
        description: 'Configure 3 tomadas para desligar automaticamente à meia-noite',
        icon: 'fa-clock',
        points: 80,
        category: 'intermediate'
    },
    {
        id: 'eco_warrior',
        title: 'Guerreiro Ecológico',
        description: 'Mantenha consumo reduzido por 30 dias consecutivos',
        icon: 'fa-tree',
        points: 250,
        category: 'advanced'
    },
    {
        id: 'power_prophet',
        title: 'Profeta da Energia',
        description: 'Acerte 5 previsões de consumo com margem de erro de 5%',
        icon: 'fa-hat-wizard',
        points: 150,
        category: 'special'
    }
];

// Achievement queue to handle multiple unlocks
let achievementQueue = [];
let isProcessingAchievements = false;

async function processAchievementQueue() {
    if (isProcessingAchievements || achievementQueue.length === 0) return;
    
    isProcessingAchievements = true;
    
    while (achievementQueue.length > 0) {
        const { userId, achievementId } = achievementQueue.shift();
        const achievement = achievements.find(a => a.id === achievementId);
        if (!achievement) continue;
        
        try {
            const doc = await db.collection('users').doc(userId).get();
            const userData = doc.data();
            const currentPoints = userData.achievementPoints || 0;
            const currentAchievements = userData.achievements || {};

            // Skip if already unlocked
            if (currentAchievements[achievementId]) continue;

            // Update achievement and points
            await db.collection('users').doc(userId).update({
                achievements: {
                    ...currentAchievements,
                    [achievementId]: true
                },
                achievementPoints: currentPoints + achievement.points
            });

            showAchievementNotification(achievement);
        } catch (error) {
            console.error('Error unlocking achievement:', error);
        }
        
        // Small delay between achievements to prevent race conditions
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    isProcessingAchievements = false;
}

function unlockAchievement(userId, achievementId) {
    // Add to queue instead of processing immediately
    achievementQueue.push({ userId, achievementId });
    processAchievementQueue();
}

// Create notification container if it doesn't exist
function getNotificationContainer() {
    console.log('Getting notification container'); // Debug log
    let container = document.querySelector('.notification-container');
    if (!container) {
        console.log('Creating new notification container'); // Debug log
        container = document.createElement('ul');
        container.className = 'notification-container';
        container.style.position = 'fixed';
        container.style.top = '80px';
        container.style.right = '20px';
        container.style.zIndex = '99999';
        document.body.appendChild(container);
    } else {
        console.log('Found existing notification container'); // Debug log
    }
    return container;
}

function showAchievementNotification(achievement) {
    const container = getNotificationContainer();
    
    const notificationItem = document.createElement('li');
    notificationItem.className = 'notification-item success';
    
    notificationItem.innerHTML = `
        <div class="notification-content">
            <div class="notification-icon">
                <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
                    <path
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M8.5 11.5 11 14l4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    ></path>
                </svg>
            </div>
            <div class="notification-text">
                <strong>Nova Conquista!</strong><br>
                ${achievement.title}<br>
                <span style="color: inherit; font-size: 0.8rem">+${achievement.points} pontos</span>
            </div>
        </div>
        <div class="notification-icon notification-close">
            <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
                <path
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18 17.94 6M18 18 6.06 6"
                ></path>
            </svg>
        </div>
        <div class="notification-progress-bar"></div>
    `;

    // Add click handler for close button
    const closeButton = notificationItem.querySelector('.notification-close');
    closeButton.addEventListener('click', () => {
        notificationItem.remove();
    });

    // Add to container
    container.appendChild(notificationItem);

    // Remove after animation
    setTimeout(() => {
        notificationItem.remove();
    }, 5000); // 5 seconds to match progress bar animation
}

// Add the new notification styles
const style = document.createElement('style');
style.textContent = `
    .notification-container {
        --content-color: black;
        --background-color: #f3f3f3;
        --font-size-content: 0.75em;
        --icon-size: 1em;
        max-width: 80%;
        display: flex;
        flex-direction: column;
        gap: 0.5em;
        list-style-type: none;
        font-family: sans-serif;
        color: var(--content-color);
    }

    .notification-item {
        position: relative;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-direction: row;
        gap: 1em;
        overflow: hidden;
        padding: 10px 15px;
        border-radius: 6px;
        background: rgba(76, 175, 80, 0.05);
        transition: all 250ms ease;
        animation: slideIn 0.3s ease-out;
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        box-shadow: 0 8px 32px rgba(76, 175, 80, 0.1);
        border: 1px solid rgba(76, 175, 80, 0.2);
    }

    .notification-item.success {
        color: #4CAF50;
        background: rgba(76, 175, 80, 0.08);
        border: 1px solid rgba(76, 175, 80, 0.3);
    }

    .notification-item:hover {
        transform: scale(1.01);
        background: rgba(76, 175, 80, 0.12);
        border: 1px solid rgba(76, 175, 80, 0.4);
    }

    .notification-content {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        gap: 0.5em;
        z-index: 1;
    }

    .notification-icon {
        display: flex;
        align-items: center;
    }

    .notification-icon svg {
        width: 24px;
        height: 24px;
        color: currentColor;
    }

    .notification-text {
        font-size: var(--font-size-content);
        user-select: none;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .notification-close {
        cursor: pointer;
        padding: 2px;
        border-radius: 5px;
        transition: all 250ms;
        z-index: 1;
    }

    .notification-close:hover {
        background-color: rgba(255, 255, 255, 0.1);
    }

    .notification-progress-bar {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 2px;
        background: currentColor;
        width: 100%;
        transform: translateX(100%);
        animation: progressBar 5s linear forwards;
        opacity: 0.3;
    }

    @keyframes progressBar {
        0% {
            transform: translateX(0);
        }
        100% {
            transform: translateX(-100%);
        }
    }

    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;

document.head.appendChild(style);

// Generic toast notification function for all pages
function showToast(message, type = 'success') {
    console.log('showToast called with:', { message, type }); // Debug log
    const container = getNotificationContainer();
    
    console.log('Got notification container:', container); // Debug log
    
    const notificationItem = document.createElement('li');
    notificationItem.className = `notification-item ${type}`;
    
    // Define icons for different types
    const icons = {
        success: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.5 11.5 11 14l4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"></path>`,
        error: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>`,
        info: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>`
    };
    
    console.log('Creating notification with message:', message); // Debug log
    
    notificationItem.innerHTML = `
        <div class="notification-content">
            <div class="notification-icon">
                <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
                    ${icons[type] || icons.info}
                </svg>
            </div>
            <div class="notification-text">
                ${message}
            </div>
        </div>
        <div class="notification-icon notification-close">
            <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
                <path
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18 17.94 6M18 18 6.06 6"
                ></path>
            </svg>
        </div>
        <div class="notification-progress-bar"></div>
    `;

    console.log('Created notification element:', notificationItem); // Debug log

    // Add click handler for close button
    const closeButton = notificationItem.querySelector('.notification-close');
    closeButton.addEventListener('click', () => {
        console.log('Closing notification manually'); // Debug log
        notificationItem.classList.add('fade-out');
        setTimeout(() => {
            notificationItem.remove();
        }, 300);
    });

    // Add to container
    container.appendChild(notificationItem);
    console.log('Added notification to container'); // Debug log

    // Remove after animation
    setTimeout(() => {
        console.log('Auto-removing notification after timeout'); // Debug log
        notificationItem.classList.add('fade-out');
        setTimeout(() => {
            notificationItem.remove();
        }, 300);
    }, 4700); // 5000 - 300 to account for animation duration
}

// Add styles for different notification types
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    .notification-item.error {
        color: #f44336;
        background: rgba(244, 67, 54, 0.08);
        border: 1px solid rgba(244, 67, 54, 0.3);
    }

    .notification-item.error:hover {
        background: rgba(244, 67, 54, 0.12);
        border: 1px solid rgba(244, 67, 54, 0.4);
    }

    .notification-item.info {
        color: #2196F3;
        background: rgba(33, 150, 243, 0.08);
        border: 1px solid rgba(33, 150, 243, 0.3);
    }

    .notification-item.info:hover {
        background: rgba(33, 150, 243, 0.12);
        border: 1px solid rgba(33, 150, 243, 0.4);
    }

    .notification-item.fade-out {
        animation: slideOut 0.3s ease-out forwards;
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;

document.head.appendChild(additionalStyles);

// Add achievement checking interval
function setupAchievementChecking() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    // Initial check
    checkAchievements(user.uid);

    // Clear any existing interval
    if (window.achievementCheckInterval) {
        clearInterval(window.achievementCheckInterval);
    }

    // Check every 10 seconds
    window.achievementCheckInterval = setInterval(() => {
        checkAchievements(user.uid);
    }, 10000);
}

// Separate interval for time-based achievements
function setupTimeBasedAchievements() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    // Clear any existing interval
    if (window.timeBasedCheckInterval) {
        clearInterval(window.timeBasedCheckInterval);
    }

    // Check every hour
    window.timeBasedCheckInterval = setInterval(() => {
        checkTimeBasedAchievements(user.uid);
    }, 3600000); // 1 hour in milliseconds

    // Initial check
    checkTimeBasedAchievements(user.uid);
}

async function checkTimeBasedAchievements(userId) {
    try {
        const doc = await db.collection('users').doc(userId).get();
        const userData = doc.data();
        const userAchievements = userData.achievements || {};
        
        // Skip if all time-based achievements are unlocked
        if (userAchievements.streak_7 && 
            userAchievements.energy_saver && 
            userAchievements.energy_waster) return;

        // Get readings sorted by date
        const readings = userData.readings || [];
        if (readings.length === 0) return;

        // Check consumption change achievements
        if (!userAchievements.energy_saver || !userAchievements.energy_waster) {
            const sortedByConsumption = [...readings].sort((a, b) => 
                new Date(a.timestamp) - new Date(b.timestamp)
            );
            
            if (sortedByConsumption.length >= 2) {
                const currentConsumption = sortedByConsumption[sortedByConsumption.length - 1].consumption;
                const previousConsumption = sortedByConsumption[sortedByConsumption.length - 2].consumption;
                
                if (previousConsumption > 0) {
                    const consumptionChange = ((currentConsumption - previousConsumption) / previousConsumption * 100).toFixed(1);
                    
                    // Check for 20% reduction
                    if (consumptionChange <= -20 && !userAchievements.energy_saver) {
                        unlockAchievement(userId, 'energy_saver');
                    }
                    
                    // Check for 20% increase
                    if (consumptionChange >= 20 && !userAchievements.energy_waster) {
                        unlockAchievement(userId, 'energy_waster');
                    }
                }
            }
        }

        // Check streak achievement if not unlocked
        if (!userAchievements.streak_7) {
            // Sort readings by date
            const sortedReadings = readings.sort((a, b) => 
                new Date(a.timestamp) - new Date(b.timestamp)
            );

            // Group readings by date
            const readingsByDate = {};
            sortedReadings.forEach(reading => {
                const date = new Date(reading.timestamp).toDateString();
                readingsByDate[date] = true;
            });

            // Convert to array of dates
            const dates = Object.keys(readingsByDate).map(date => new Date(date));
            
            // Check for streak
            let currentStreak = 1;
            let maxStreak = 1;

            for (let i = 1; i < dates.length; i++) {
                const prevDate = dates[i - 1];
                const currentDate = dates[i];
                
                // Check if dates are consecutive
                const diffTime = Math.abs(currentDate - prevDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays === 1) {
                    currentStreak++;
                    maxStreak = Math.max(maxStreak, currentStreak);
                } else {
                    currentStreak = 1;
                }
                
                // Unlock achievement if streak reaches 7 days
                if (maxStreak >= 7) {
                    unlockAchievement(userId, 'streak_7');
                    break;
                }
            }
        }
    } catch (error) {
        console.error('Error checking time-based achievements:', error);
    }
}

// Add this near the top of your file, after Firebase initialization
function setupDevToolsProtection() {
    const threshold = 160;
/*
    function timeTest() {
        const start = performance.now();
        for(let i = 0; i < 100; i++) {
            console.log(i);
            console.clear();
        }
        const end = performance.now();
        
        if (end - start > threshold) {
            // DevTools likely open - log out user
            auth.signOut().then(() => {
                window.location.href = '/index.html';
            });
        }
    }

    // Run checks periodically
    setInterval(timeTest, 1000);

    // Additional detection method using window dimensions
    function checkWindowSize() {
        if (window.outerWidth - window.innerWidth > 160 || 
            window.outerHeight - window.innerHeight > 160) {
            auth.signOut().then(() => {
                window.location.href = '/index.html';
            });
        }
    }

    // Check window size periodically and on resize
    setInterval(checkWindowSize, 1000);
    window.addEventListener('resize', checkWindowSize);
    */
}


setupDevToolsProtection();

// Modify your existing auth state change listener
firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        setupDevToolsProtection();
        // Check if user is already premium/enterprise and unlock achievement
        db.collection('users').doc(user.uid).get().then(doc => {
            const userData = doc.data();
            if ((userData.plan === 'premium' || userData.plan === 'enterprise') && 
                (!userData.achievements || !userData.achievements.premium_user)) {
                unlockAchievement(user.uid, 'premium_user');
            }
        });
        
        setupAchievementChecking();
        setupTimeBasedAchievements();
    } else {
        // Clear intervals when user logs out
        if (window.achievementCheckInterval) {
            clearInterval(window.achievementCheckInterval);
        }
        if (window.timeBasedCheckInterval) {
            clearInterval(window.timeBasedCheckInterval);
        }
    }
});

// Clean up on page unload
window.addEventListener('beforeunload', function() {
    if (window.achievementCheckInterval) {
        clearInterval(window.achievementCheckInterval);
    }
    if (window.timeBasedCheckInterval) {
        clearInterval(window.timeBasedCheckInterval);
    }
});