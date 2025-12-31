import React, { useState, useCallback } from 'react';
import { Modal } from './Modal';

export interface WSLSettings {
  enabled: boolean;
  distro: string;
  nodePath: string;
  claudePath: string;
}

export interface Permission {
  id: string;
  tool: string;
  pattern?: string;
  createdAt: Date;
}

export interface SettingsData {
  wsl: WSLSettings;
  permissions: Permission[];
  yoloMode: boolean;
  thinkingIntensity: number;
}

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings?: SettingsData;
  onSettingsChange?: (settings: Partial<SettingsData>) => void;
  onAddPermission?: (tool: string, pattern?: string) => void;
  onRemovePermission?: (id: string) => void;
}

const AVAILABLE_TOOLS = [
  'Bash',
  'Read',
  'Edit',
  'Write',
  'MultiEdit',
  'Glob',
  'Grep',
  'LS',
  'WebSearch',
  'WebFetch',
];

const defaultSettings: SettingsData = {
  wsl: {
    enabled: false,
    distro: 'Ubuntu',
    nodePath: '/usr/bin/node',
    claudePath: '/usr/local/bin/claude',
  },
  permissions: [],
  yoloMode: false,
  thinkingIntensity: 0,
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings = defaultSettings,
  onSettingsChange = () => {},
  onAddPermission = () => {},
  onRemovePermission = () => {},
}) => {
  const [showAddPermission, setShowAddPermission] = useState(false);
  const [newPermissionTool, setNewPermissionTool] = useState('');
  const [newPermissionPattern, setNewPermissionPattern] = useState('');

  const handleWSLChange = useCallback(
    (field: keyof WSLSettings, value: string | boolean) => {
      onSettingsChange({
        wsl: {
          ...settings.wsl,
          [field]: value,
        },
      });
    },
    [settings.wsl, onSettingsChange]
  );

  const handleYoloModeChange = useCallback(
    (enabled: boolean) => {
      onSettingsChange({ yoloMode: enabled });
    },
    [onSettingsChange]
  );

  const handleThinkingIntensityChange = useCallback(
    (intensity: number) => {
      onSettingsChange({ thinkingIntensity: intensity });
    },
    [onSettingsChange]
  );

  const handleAddPermission = useCallback(() => {
    if (newPermissionTool) {
      onAddPermission(newPermissionTool, newPermissionPattern || undefined);
      setNewPermissionTool('');
      setNewPermissionPattern('');
      setShowAddPermission(false);
    }
  }, [newPermissionTool, newPermissionPattern, onAddPermission]);

  const showPatternInput = newPermissionTool === 'Bash';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings" width="lg">
      <div className="space-y-6">
        {/* WSL Configuration */}
        <section>
          <h3 className="text-sm font-semibold mb-2 text-[var(--vscode-foreground)]">
            WSL Configuration
          </h3>
          <p className="text-xs text-[var(--vscode-descriptionForeground)] mb-4">
            WSL integration allows you to run Claude Code from within Windows
            Subsystem for Linux.
          </p>

          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.wsl.enabled}
                onChange={(e) => handleWSLChange('enabled', e.target.checked)}
                className="w-4 h-4 rounded border-[var(--vscode-checkbox-border)] bg-[var(--vscode-checkbox-background)]"
              />
              <span className="text-sm">Enable WSL Integration</span>
            </label>

            {settings.wsl.enabled && (
              <div className="ml-7 space-y-3">
                <div>
                  <label
                    htmlFor="wsl-distro"
                    className="block text-xs text-[var(--vscode-descriptionForeground)] mb-1"
                  >
                    WSL Distribution
                  </label>
                  <input
                    id="wsl-distro"
                    type="text"
                    value={settings.wsl.distro}
                    onChange={(e) => handleWSLChange('distro', e.target.value)}
                    placeholder="Ubuntu"
                    className="input"
                  />
                </div>

                <div>
                  <label
                    htmlFor="wsl-node-path"
                    className="block text-xs text-[var(--vscode-descriptionForeground)] mb-1"
                  >
                    Node.js Path in WSL
                  </label>
                  <input
                    id="wsl-node-path"
                    type="text"
                    value={settings.wsl.nodePath}
                    onChange={(e) => handleWSLChange('nodePath', e.target.value)}
                    placeholder="/usr/bin/node"
                    className="input"
                  />
                  <p className="text-xs text-[var(--vscode-descriptionForeground)] mt-1">
                    Find path with:{' '}
                    <code className="px-1 py-0.5 rounded bg-[var(--vscode-textCodeBlock-background)]">
                      which node
                    </code>
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="wsl-claude-path"
                    className="block text-xs text-[var(--vscode-descriptionForeground)] mb-1"
                  >
                    Claude Path in WSL
                  </label>
                  <input
                    id="wsl-claude-path"
                    type="text"
                    value={settings.wsl.claudePath}
                    onChange={(e) => handleWSLChange('claudePath', e.target.value)}
                    placeholder="/usr/local/bin/claude"
                    className="input"
                  />
                  <p className="text-xs text-[var(--vscode-descriptionForeground)] mt-1">
                    Find path with:{' '}
                    <code className="px-1 py-0.5 rounded bg-[var(--vscode-textCodeBlock-background)]">
                      which claude
                    </code>
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Permissions */}
        <section>
          <h3 className="text-sm font-semibold mb-2 text-[var(--vscode-foreground)]">
            Permissions
          </h3>
          <p className="text-xs text-[var(--vscode-descriptionForeground)] mb-4">
            Manage commands and tools that are automatically allowed without
            asking for permission.
          </p>

          {/* Permission List */}
          <div className="border border-[var(--vscode-editorWidget-border)] rounded-md overflow-hidden mb-3">
            {settings.permissions.length === 0 ? (
              <div className="p-4 text-center text-sm text-[var(--vscode-descriptionForeground)]">
                No permissions configured
              </div>
            ) : (
              <ul className="divide-y divide-[var(--vscode-editorWidget-border)]">
                {settings.permissions.map((permission) => (
                  <li
                    key={permission.id}
                    className="flex items-center justify-between px-3 py-2 hover:bg-[var(--vscode-list-hoverBackground)]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="badge">{permission.tool}</span>
                      {permission.pattern && (
                        <code className="text-xs px-1 py-0.5 rounded bg-[var(--vscode-textCodeBlock-background)]">
                          {permission.pattern}
                        </code>
                      )}
                    </div>
                    <button
                      onClick={() => onRemovePermission(permission.id)}
                      className="p-1 rounded hover:bg-[var(--vscode-toolbar-hoverBackground)] text-[var(--vscode-errorForeground)]"
                      aria-label="Remove permission"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Add Permission Form */}
          {showAddPermission ? (
            <div className="space-y-3 p-3 border border-[var(--vscode-editorWidget-border)] rounded-md">
              <div className="flex gap-2">
                <select
                  value={newPermissionTool}
                  onChange={(e) => setNewPermissionTool(e.target.value)}
                  className="input flex-shrink-0"
                  style={{ width: '150px' }}
                >
                  <option value="">Select tool...</option>
                  {AVAILABLE_TOOLS.map((tool) => (
                    <option key={tool} value={tool}>
                      {tool}
                    </option>
                  ))}
                </select>

                {showPatternInput && (
                  <input
                    type="text"
                    value={newPermissionPattern}
                    onChange={(e) => setNewPermissionPattern(e.target.value)}
                    placeholder="Command pattern (e.g., npm i *)"
                    className="input flex-1"
                  />
                )}
              </div>

              <p className="text-xs text-[var(--vscode-descriptionForeground)]">
                {showPatternInput
                  ? 'Use * as wildcard for matching multiple commands.'
                  : 'Select a tool to add always-allow permission.'}
              </p>

              <div className="flex gap-2">
                <button
                  onClick={handleAddPermission}
                  disabled={!newPermissionTool}
                  className="btn text-xs"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowAddPermission(false);
                    setNewPermissionTool('');
                    setNewPermissionPattern('');
                  }}
                  className="btn-secondary px-3 py-1.5 text-xs rounded"
                  style={{
                    backgroundColor: 'var(--vscode-button-secondaryBackground)',
                    color: 'var(--vscode-button-secondaryForeground)',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddPermission(true)}
              className="text-sm text-[var(--vscode-textLink-foreground)] hover:underline"
            >
              + Add permission
            </button>
          )}

          {/* Yolo Mode */}
          <div className="mt-4 pt-4 border-t border-[var(--vscode-editorWidget-border)]">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.yoloMode}
                onChange={(e) => handleYoloModeChange(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--vscode-checkbox-border)] bg-[var(--vscode-checkbox-background)]"
              />
              <div>
                <span className="text-sm font-medium">
                  Enable Yolo Mode
                </span>
                <p className="text-xs text-[var(--vscode-descriptionForeground)]">
                  Auto-approve all permission requests (use with caution)
                </p>
              </div>
            </label>
          </div>
        </section>

        {/* Thinking Intensity */}
        <section>
          <h3 className="text-sm font-semibold mb-2 text-[var(--vscode-foreground)]">
            Thinking Intensity
          </h3>
          <p className="text-xs text-[var(--vscode-descriptionForeground)] mb-4">
            Configure default thinking intensity. Higher levels provide more
            detailed reasoning but consume more tokens.
          </p>

          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max="3"
              step="1"
              value={settings.thinkingIntensity}
              onChange={(e) =>
                handleThinkingIntensityChange(parseInt(e.target.value, 10))
              }
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, var(--vscode-progressBar-background) ${
                  (settings.thinkingIntensity / 3) * 100
                }%, var(--vscode-input-background) ${
                  (settings.thinkingIntensity / 3) * 100
                }%)`,
              }}
            />
            <div className="flex justify-between text-xs text-[var(--vscode-descriptionForeground)]">
              <span>Think</span>
              <span>Think Hard</span>
              <span>Think Harder</span>
              <span>Ultrathink</span>
            </div>
          </div>
        </section>
      </div>
    </Modal>
  );
};

export default SettingsModal;
