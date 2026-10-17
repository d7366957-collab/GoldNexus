const { Telegraf, Markup } = require('telegraf');
const db = require('./database');
const bot = new Telegraf(process.env.BOT_TOKEN);
const ADMIN_ID = process.env.ADMIN_ID;

bot.start((ctx) => {
    const userId = ctx.from.id;
    const username = ctx.from.username || 'Usuario';
    const referidorId = ctx.startPayload ? parseInt(ctx.startPayload) : null;

    db.get(`SELECT * FROM users WHERE id = ?`, [userId], (err, row) => {
        if (row && row.banned === 1) return ctx.reply('🚫 Has sido expulsado del bot.');

        if (!row) {
            db.run(`INSERT INTO users (id, username, referidor_id) VALUES (?, ?, ?)`, [userId, username, referidorId]);
            if (referidorId) {
                db.run(`UPDATE users SET referidos = referidos + 1, balance = balance + 1.5 WHERE id = ?`, [referidorId]);
                bot.telegram.sendMessage(referidorId, `🎉 ¡Nuevo referido! Has ganado +1.5 USDT (ficticio).`);
            }
        }
    });

    ctx.reply(`¡Bienvenido a **GoldNexus**! 🌍\nGana recompensas, sube en el ranking y retira tus USDT.`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.webApp('🚀 Abrir GoldNexus', process.env.MINI_APP_URL)],
            [Markup.button.callback('🌐 Idioma / Language / Язык', 'change_language')]
        ])
    });
});

// Escuchar los datos que envía la Mini App (para verificar tareas)
bot.on('web_app_data', async (ctx) => {
    try {
        const data = JSON.parse(ctx.webAppData.data);
        
        if (data.action === 'verify_task') {
            const { taskId, userId } = data;
            
            db.get(`SELECT * FROM tasks WHERE id = ? AND active = 1`, [taskId], async (err, task) => {
                if (!task) return ctx.reply('❌ Tarea no encontrada o inactiva.');

                db.get(`SELECT * FROM completed_tasks WHERE user_id = ? AND task_id = ?`, [userId, taskId], async (err, completed) => {
                    if (completed) return ctx.reply('⚠️ Ya completaste esta tarea.');

                    try {
                        const channelUsername = task.link.replace('https://t.me/', '@');
                        const chatMember = await bot.telegram.getChatMember(channelUsername, userId);
                        
                        if (['member', 'administrator', 'creator'].includes(chatMember.status)) {
                            db.run(`INSERT INTO completed_tasks (user_id, task_id) VALUES (?, ?)`, [userId, taskId]);
                            db.run(`UPDATE users SET balance = balance + ? WHERE id = ?`, [task.reward, userId]);

                            // Lógica del bono extra de 3 tareas
                            db.get(`SELECT referidor_id FROM users WHERE id = ?`, [userId], (err, user) => {
                                if (user && user.referidor_id) {
                                    db.get(`SELECT COUNT(*) as total FROM completed_tasks WHERE user_id = ?`, [userId], (err, count) => {
                                        if (count.total === 3) {
                                            db.run(`UPDATE users SET balance = balance + 0.5 WHERE id = ?`, [user.referidor_id]);
                                            bot.telegram.sendMessage(user.referidor_id, `🎁 ¡Bono extra! Tu referido completó 3 tareas. +0.5 USDT (ficticio).`);
                                        }
                                    });
                                }
                            });

                            ctx.reply(`✅ ¡Tarea completada con éxito! Has ganado ${task.reward} USDT.`);
                        } else {
                            ctx.reply('❌ No te has unido al canal todavía. Únete y vuelve a intentarlo.');
                        }
                    } catch (error) {
                        ctx.reply('❌ Error. Asegúrate de unirte al canal y de que el bot sea administrador.');
                    }
                });
            });
        }
    } catch (e) {
        console.log("Error procesando datos de la web app", e);
    }
});

// ... (El resto de comandos /language y /admin se mantienen igual que en el mensaje anterior)
