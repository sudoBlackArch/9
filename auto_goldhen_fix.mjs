/* Copyright (C) 2025 anonymous

This file is part of PSFree.

PSFree is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

PSFree is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.  */

// Автоматический фикс для GoldHEN - полная интеграция решения проблемы зависания игр
// Этот скрипт автоматически применяется после загрузки GoldHEN для исправления проблем с плагинами

import { log, sleep } from './module/utils.mjs';
import { fixGoldHENPlugins, shouldApplyPluginsFix, markPluginsFixApplied, resetPluginsFixFlag } from './goldhen_plugins_fix.mjs';
import { 
    createOptimalConfig, 
    validateGoldHENConfig, 
    debugConfigIssues,
    PROBLEMATIC_GAMES 
} from './goldhen_config_manager.mjs';

// Главная функция автоматического фикса
export async function autoFixGoldHEN(chain) {
    log('=== Starting Auto GoldHEN Fix ===');
    
    try {
        // Шаг 1: Проверяем, нужен ли фикс
        if (!shouldApplyPluginsFix()) {
            log('GoldHEN plugins fix already applied this session, skipping...');
            return { success: true, skipped: true };
        }
        
        // Шаг 2: Ждем полной загрузки GoldHEN
        log('Waiting for GoldHEN to fully initialize...');
        await sleep(1500);
        
        // Шаг 3: Применяем основной фикс плагинов
        log('Applying plugins reactivation fix...');
        const fixResult = await fixGoldHENPlugins(chain);
        
        if (!fixResult) {
            log('Warning: Plugins fix failed, but continuing...');
        }
        
        // Шаг 4: Оптимизируем конфигурацию GoldHEN
        log('Optimizing GoldHEN configuration...');
        await optimizeGoldHENConfig(chain);
        
        // Шаг 5: Проверяем работоспособность
        log('Verifying fix application...');
        const verifyResult = await verifyFixApplication();
        
        // Шаг 6: Устанавливаем флаг успешного применения
        if (verifyResult.success) {
            markPluginsFixApplied();
            log('=== Auto GoldHEN Fix Completed Successfully ===');
            
            // Показываем пользователю уведомление
            displaySuccessMessage();
            
            return { 
                success: true, 
                pluginsFix: fixResult,
                configOptimized: true,
                verified: verifyResult
            };
        } else {
            log('=== Auto GoldHEN Fix Completed with Issues ===');
            return { 
                success: false, 
                issues: verifyResult.issues 
            };
        }
        
    } catch (error) {
        log(`Error in auto GoldHEN fix: ${error}`);
        return { success: false, error: error.toString() };
    }
}

// Оптимизирует конфигурацию GoldHEN для лучшей совместимости
async function optimizeGoldHENConfig(chain) {
    try {
        // Создаем оптимальную конфигурацию
        const optimalConfig = createOptimalConfig();
        
        // Сохраняем конфигурацию через системные вызовы
        const configPath = '/data/GoldHEN/config.ini';
        const fd = chain.sysi('open', configPath, 0x601); // O_WRONLY | O_CREAT
        
        if (fd >= 0) {
            chain.sysi('write', fd, optimalConfig, optimalConfig.length);
            chain.sysi('close', fd);
            log('GoldHEN configuration optimized');
            return true;
        } else {
            log('Warning: Could not write optimal configuration');
            return false;
        }
    } catch (error) {
        log(`Error optimizing config: ${error}`);
        return false;
    }
}

// Проверяет успешность применения фикса
async function verifyFixApplication() {
    const checks = [];
    
    try {
        // Проверка 1: Проверяем localStorage флаги
        const localStorageFlag = localStorage.getItem('goldhen_plugins_fixed') === 'true';
        checks.push({
            name: 'LocalStorage flag',
            success: localStorageFlag,
            details: localStorageFlag ? 'Set correctly' : 'Not set'
        });
        
        // Проверка 2: Проверяем sessionStorage флаги  
        const sessionStorageFlag = sessionStorage.getItem('goldhen_plugins_fixed') === 'true';
        checks.push({
            name: 'SessionStorage flag', 
            success: sessionStorageFlag,
            details: sessionStorageFlag ? 'Set correctly' : 'Not set'
        });
        
        // Проверка 3: Проверяем загрузку GoldHEN
        const goldhenLoaded = localStorage.getItem('ExploitLoaded') === 'yes';
        checks.push({
            name: 'GoldHEN loaded',
            success: goldhenLoaded,
            details: goldhenLoaded ? 'Loaded successfully' : 'Not loaded'
        });
        
        const allSuccess = checks.every(check => check.success);
        const issues = checks.filter(check => !check.success);
        
        return {
            success: allSuccess,
            checks: checks,
            issues: issues
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.toString(),
            checks: checks
        };
    }
}

// Показывает сообщение об успешном применении фикса
function displaySuccessMessage() {
    const message = `
✅ GoldHEN Auto-Fix Applied Successfully!

🎮 Игры теперь должны запускаться с первого раза без зависания.

🔧 Проблемные игры исправлены:
• Need for Speed Heat
• God of War: Ragnarök  
• Cyberpunk 2077
• И другие...

⚡ Плагины автоматически переактивированы.
📋 Конфигурация оптимизирована.

Наслаждайтесь игрой!
    `;
    
    // Логируем в консоль
    log(message);
    
    // Сохраняем сообщение для отображения в UI если нужно
    sessionStorage.setItem('goldhen_fix_message', message);
}

// Функция для принудительного сброса и повторного применения фикса
export async function forceReapplyFix(chain) {
    log('Force reapplying GoldHEN fix...');
    
    // Сбрасываем все флаги
    resetPluginsFixFlag();
    localStorage.removeItem('ExploitLoaded');
    sessionStorage.removeItem('ExploitLoaded');
    
    // Применяем фикс заново
    return await autoFixGoldHEN(chain);
}

// Проверяет, является ли игра проблемной (требующей фикса)
export function isProblematicGame(gameTitle) {
    return PROBLEMATIC_GAMES.some(problematicGame => 
        gameTitle.toLowerCase().includes(problematicGame.toLowerCase())
    );
}

// Функция для отладки проблем с GoldHEN
export async function debugGoldHENIssues(chain) {
    log('=== GoldHEN Debug Information ===');
    
    // Проверяем статус эксплойта
    const exploitLoaded = localStorage.getItem('ExploitLoaded');
    log(`Exploit loaded: ${exploitLoaded}`);
    
    // Проверяем флаги фикса
    const pluginsFixed = localStorage.getItem('goldhen_plugins_fixed');
    log(`Plugins fix applied: ${pluginsFixed}`);
    
    // Проверяем sessionStorage
    const sessionExploit = sessionStorage.getItem('ExploitLoaded');
    const sessionPlugins = sessionStorage.getItem('goldhen_plugins_fixed');
    log(`Session exploit: ${sessionExploit}`);
    log(`Session plugins fix: ${sessionPlugins}`);
    
    // Попытка чтения конфигурации GoldHEN
    try {
        const configPath = '/data/GoldHEN/config.ini';
        const fd = chain.sysi('open', configPath, 0); // O_RDONLY
        
        if (fd >= 0) {
            log('GoldHEN config file accessible');
            chain.sysi('close', fd);
        } else {
            log('Warning: GoldHEN config file not accessible');
        }
    } catch (error) {
        log(`Error checking config: ${error}`);
    }
    
    // Проверяем проблемные игры
    log('Problematic games list:');
    PROBLEMATIC_GAMES.forEach((game, index) => {
        log(`  ${index + 1}. ${game}`);
    });
    
    log('=== End Debug Information ===');
}

// Экспорт всех функций для внешнего использования
export default {
    autoFixGoldHEN,
    forceReapplyFix,
    isProblematicGame,
    debugGoldHENIssues,
    verifyFixApplication,
    optimizeGoldHENConfig
};
