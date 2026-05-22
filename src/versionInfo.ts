/**
 * Version information service for Antigravity Quota Watcher.
 * Provides access to IDE version, extension version, and other version-related info.
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from './logger';

export interface VersionInfo {
    /** Extension version from package.json */
    extensionVersion: string;
    /** IDE name (e.g., "Antigravity", "Visual Studio Code") */
    ideName: string;
    /** IDE product name from product.json (if available) */
    productName?: string;
    /** IDE version (e.g., "1.11.2" for Antigravity) */
    ideVersion: string;
    /** VS Code OSS version (e.g., "1.104.0") */
    vscodeOssVersion: string;
    /** Operating system (e.g., "windows", "darwin", "linux") */
    os: string;
    /** Whether this is Antigravity IDE 2.0.1 or later */
    isAntigravityV2: boolean;
}

class VersionInfoService {
    private static instance: VersionInfoService;
    private versionInfo: VersionInfo | null = null;

    private constructor() { }

    static getInstance(): VersionInfoService {
        if (!VersionInfoService.instance) {
            VersionInfoService.instance = new VersionInfoService();
        }
        return VersionInfoService.instance;
    }

    /**
     * Initialize version info with extension context.
     * Must be called once during extension activation.
     */
    initialize(context: vscode.ExtensionContext): void {
        const extensionVersion = context.extension.packageJSON.version || 'unknown';
        const ideName = vscode.env.appName || 'unknown';
        const vscodeOssVersion = vscode.version || 'unknown';

        // Read IDE version from product.json
        let ideVersion = 'unknown';
        let productName: string | undefined;
        try {
            const productJsonPath = path.join(vscode.env.appRoot, 'product.json');
            if (fs.existsSync(productJsonPath)) {
                const productJson = JSON.parse(fs.readFileSync(productJsonPath, 'utf8'));
                ideVersion = productJson.ideVersion || productJson.version || 'unknown';
                productName = productJson.nameLong || productJson.applicationName || productJson.nameShort;
            }
        } catch (e) {
            logger.warn('VersionInfo', 'Failed to read product.json:', e);
        }

        // Detect OS
        let os = 'unknown';
        switch (process.platform) {
            case 'win32':
                os = 'windows';
                break;
            case 'darwin':
                os = 'darwin';
                break;
            case 'linux':
                os = 'linux';
                break;
            default:
                os = process.platform;
        }

        // Check if this is Antigravity IDE 2.0.1 or later
        const isAntigravityV2 = this.checkIsAntigravityV2(ideName, ideVersion);

        this.versionInfo = {
            extensionVersion,
            ideName,
            productName,
            ideVersion,
            vscodeOssVersion,
            os,
            isAntigravityV2,
        };

        logger.info('VersionInfo', `Initialized: ${this.getFullVersionString()}`);
        if (isAntigravityV2) {
            logger.info('VersionInfo', 'Detected Antigravity IDE 2.0.1 or later');
        }
    }

    /**
     * Get version info. Throws if not initialized.
     */
    getVersionInfo(): VersionInfo {
        if (!this.versionInfo) {
            throw new Error('VersionInfoService not initialized. Call initialize() first.');
        }
        return this.versionInfo;
    }

    /**
     * Get IDE version string (e.g., "1.11.2").
     * Returns "unknown" if not initialized.
     */
    getIdeVersion(): string {
        return this.versionInfo?.ideVersion || 'unknown';
    }

    /**
     * Get IDE name (e.g., "Antigravity").
     */
    getIdeName(): string {
        return this.versionInfo?.ideName || 'unknown';
    }

    /**
     * Determine whether the current IDE is Antigravity.
     * Uses appName and product name hints (case-insensitive).
     */
    isAntigravityIde(): boolean {
        const candidates = [
            this.versionInfo?.ideName,
            this.versionInfo?.productName,
            vscode.env.appName
        ]
            .filter(Boolean)
            .map(name => name!.toLowerCase());

        return candidates.some(name => name.includes('antigravity'));
    }

    /**
     * Get extension version string (e.g., "0.7.6").
     */
    getExtensionVersion(): string {
        return this.versionInfo?.extensionVersion || 'unknown';
    }

    /**
     * Get OS string for API requests (e.g., "windows").
     */
    getOs(): string {
        return this.versionInfo?.os || 'unknown';
    }

    /**
     * Get a formatted version string for logging.
     */
    getFullVersionString(): string {
        const info = this.versionInfo;
        if (!info) {
            return 'VersionInfo not initialized';
        }
        return `Extension v${info.extensionVersion} on ${info.ideName} v${info.ideVersion} (VSCode OSS v${info.vscodeOssVersion})`;
    }

    /**
     * Check if this is Antigravity IDE 2.0.1 or later
     */
    private checkIsAntigravityV2(ideName: string, ideVersion: string): boolean {
        if (!ideName.toLowerCase().includes('antigravity')) {
            return false;
        }

        try {
            const versionParts = ideVersion.split('.').map(Number);
            if (versionParts.length < 2) {
                return false;
            }

            const major = versionParts[0];
            const minor = versionParts[1];

            // Check if version is 2.0.1 or later
            if (major > 2) {
                return true;
            }
            if (major === 2 && minor > 0) {
                return true;
            }
            if (major === 2 && minor === 0 && versionParts.length >= 3 && versionParts[2] >= 1) {
                return true;
            }

            return false;
        } catch (e) {
            logger.warn('VersionInfo', 'Failed to parse Antigravity version:', e);
            return false;
        }
    }

    /**
     * Check if this is Antigravity IDE 2.0.1 or later
     */
    isAntigravityV2(): boolean {
        return this.versionInfo?.isAntigravityV2 || false;
    }
}

// Export singleton instance
export const versionInfo = VersionInfoService.getInstance();
