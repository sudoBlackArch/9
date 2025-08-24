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

// GoldHEN Configuration Manager
// Управление конфигурацией GoldHEN для оптимальной работы с играми

import { log } from './module/utils.mjs';

// Оптимальная конфигурация GoldHEN для стабильной работы игр
export const OPTIMAL_GOLDHEN_CONFIG = {
    // Основные настройки
    'enable_plugins_loader': '1',
    'enable_game_patch_plugin': '1',
    'enable_homebrew_blocker': '0',
    'enable_rest_mode_patch': '1',
    'enable_app_browser_patch': '1',
    
    // Настройки FTP
    'enable_ftp_server': '1',
    'ftp_port': '2121',
    
    // Настройки сети
    'enable_network_dump': '0',
    'enable_bin_loader': '1',
    'bin_loader_port': '9020',
    
    // Совместимость игр
    'enable_game_compatibility_patch': '1',
    'enable_legacy_game_support': '1',
    
    // Производительность
    'enable_cpu_temp_patch': '1',
    'enable_fan_control': '0',
    
    // Отладка
    'enable_debug_log': '0',
    'enable_crash_dumps': '1'
};

// Конфигурация плагинов по умолчанию
export const DEFAULT_PLUGINS_CONFIG = `[default]
/data/GoldHEN/plugins/game_patch.prx
/data/GoldHEN/plugins/cheat_manager.prx

[CUSA00000]
# Example game-specific plugin configuration
# /data/GoldHEN/plugins/special_patch.prx
`;

// Список игр, которые требуют переактивации плагинов
export const PROBLEMATIC_GAMES = [
    'Need for Speed Heat',
    'God of War: Ragnarök', 
    'Cyberpunk 2077',
    'Horizon Zero Dawn',
    'The Last of Us Part II',
    'Ghost of Tsushima',
    'Marvel\'s Spider-Man',
    'Red Dead Redemption 2',
    'Death Stranding',
    'Final Fantasy VII Remake'
];

// Создает оптимальную конфигурацию GoldHEN
export function createOptimalConfig() {
    log('Creating optimal GoldHEN configuration...');
    
    let config_content = '[Settings]\n';
    
    for (const [key, value] of Object.entries(OPTIMAL_GOLDHEN_CONFIG)) {
        config_content += `${key}=${value}\n`;
    }
    
    config_content += '\n[Advanced]\n';
    config_content += '# Auto-generated optimal configuration for PSFree + GoldHEN\n';
    config_content += '# This configuration optimizes plugin loading for better game compatibility\n';
    config_content += `# Generated on: ${new Date().toISOString()}\n`;
    
    return config_content;
}

// Проверяет текущую конфигурацию на потенциальные проблемы
export function validateGoldHENConfig(config_text) {
    const issues = [];
    
    // Проверяем критически важные настройки
    if (!config_text.includes('enable_plugins_loader=1')) {
        issues.push('Plugins loader disabled - games may not work properly');
    }
    
    if (!config_text.includes('enable_game_patch_plugin=1')) {
        issues.push('Game patch plugin disabled - compatibility issues expected');
    }
    
    if (config_text.includes('enable_homebrew_blocker=1')) {
        issues.push('Homebrew blocker enabled - may cause conflicts');
    }
    
    // Проверяем FTP настройки
    if (!config_text.includes('enable_ftp_server=1')) {
        issues.push('FTP server disabled - remote management unavailable');
    }
    
    return {
        isValid: issues.length === 0,
        issues: issues,
        score: Math.max(0, 100 - (issues.length * 20))
    };
}

// Создает backup текущей конфигурации
export function createConfigBackup(config_text) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backup_content = `# GoldHEN Configuration Backup - ${timestamp}\n` + config_text;
    
    return {
        filename: `goldhen_config_backup_${timestamp}.ini`,
        content: backup_content
    };
}

// Рекомендации по оптимизации конфигурации
export function getOptimizationRecommendations(config_text) {
    const recommendations = [];
    
    if (!config_text.includes('enable_rest_mode_patch=1')) {
        recommendations.push({
            setting: 'enable_rest_mode_patch',
            value: '1',
            reason: 'Improves system stability in rest mode'
        });
    }
    
    if (!config_text.includes('enable_app_browser_patch=1')) {
        recommendations.push({
            setting: 'enable_app_browser_patch',
            value: '1', 
            reason: 'Better browser compatibility for PSFree'
        });
    }
    
    if (config_text.includes('enable_debug_log=1')) {
        recommendations.push({
            setting: 'enable_debug_log',
            value: '0',
            reason: 'Debug logging can slow down performance'
        });
    }
    
    return recommendations;
}

// Применяет рекомендации к конфигурации
export function applyRecommendations(config_text, recommendations) {
    let updated_config = config_text;
    
    for (const rec of recommendations) {
        const setting_regex = new RegExp(`${rec.setting}=.*`, 'g');
        const new_setting = `${rec.setting}=${rec.value}`;
        
        if (setting_regex.test(updated_config)) {
            updated_config = updated_config.replace(setting_regex, new_setting);
        } else {
            // Добавляем новую настройку в секцию [Settings]
            if (updated_config.includes('[Settings]')) {
                updated_config = updated_config.replace('[Settings]', `[Settings]\n${new_setting}`);
            } else {
                updated_config = `[Settings]\n${new_setting}\n\n` + updated_config;
            }
        }
        
        log(`Applied recommendation: ${rec.setting}=${rec.value} - ${rec.reason}`);
    }
    
    return updated_config;
}

// Создает отчет о состоянии конфигурации
export function generateConfigReport(config_text) {
    const validation = validateGoldHENConfig(config_text);
    const recommendations = getOptimizationRecommendations(config_text);
    
    const report = {
        timestamp: new Date().toISOString(),
        validation: validation,
        recommendations: recommendations,
        config_size: config_text.length,
        critical_settings: {
            plugins_loader: config_text.includes('enable_plugins_loader=1'),
            game_patch: config_text.includes('enable_game_patch_plugin=1'),
            ftp_server: config_text.includes('enable_ftp_server=1'),
            bin_loader: config_text.includes('enable_bin_loader=1')
        }
    };
    
    return report;
}

// Экспортирует конфигурацию для внешнего использования
export function exportConfiguration(config_text) {
    const report = generateConfigReport(config_text);
    const backup = createConfigBackup(config_text);
    
    return {
        config: config_text,
        backup: backup,
        report: report,
        export_date: new Date().toISOString(),
        psfree_version: '1.5.0b'
    };
}

// Помощник для отладки проблем с конфигурацией
export function debugConfigIssues(config_text) {
    log('=== GoldHEN Configuration Debug Report ===');
    
    const report = generateConfigReport(config_text);
    
    log(`Configuration validation score: ${report.validation.score}/100`);
    
    if (!report.validation.isValid) {
        log('Issues found:');
        report.validation.issues.forEach((issue, index) => {
            log(`  ${index + 1}. ${issue}`);
        });
    }
    
    if (report.recommendations.length > 0) {
        log('Optimization recommendations:');
        report.recommendations.forEach((rec, index) => {
            log(`  ${index + 1}. ${rec.setting}=${rec.value} - ${rec.reason}`);
        });
    }
    
    log('Critical settings status:');
    for (const [setting, enabled] of Object.entries(report.critical_settings)) {
        log(`  ${setting}: ${enabled ? 'ENABLED' : 'DISABLED'}`);
    }
    
    log('=== End Debug Report ===');
    
    return report;
}
