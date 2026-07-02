// さくらバックアップ形式（Phase 0 共通の封筒）
// 参照：さくらAI Phase 0 詳細設計書 / さくらLaboデータ辞書 v1

export const BACKUP_FORMAT = 'sakura-backup';
export const APP_NAME = 'discovery-labo';
export const SCHEMA_VERSION = 1;
export const DICTIONARY_VERSION = 'v1';

export type SakuraBackup = {
  format: typeof BACKUP_FORMAT;
  app: string;
  schemaVersion: number;
  dictionaryVersion: string;
  exportedAt: string;
  data: Record<string, unknown>;
};

export const createBackup = (data: Record<string, unknown>): SakuraBackup => ({
  format: BACKUP_FORMAT,
  app: APP_NAME,
  schemaVersion: SCHEMA_VERSION,
  dictionaryVersion: DICTIONARY_VERSION,
  exportedAt: new Date().toISOString(),
  data,
});

export const backupFilename = (autoBeforeImport = false): string => {
  const date = new Date().toISOString().slice(0, 10);
  return autoBeforeImport ? `${APP_NAME}-backup-auto-before-import-${date}.json` : `${APP_NAME}-backup-${date}.json`;
};

export const downloadJson = (value: unknown, filename: string) => {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

export type BackupValidation = { ok: true; backup: SakuraBackup } | { ok: false; error: string };

export const validateBackup = (parsed: unknown): BackupValidation => {
  if (typeof parsed !== 'object' || parsed === null) {
    return { ok: false, error: 'JSONファイルとして読み取れませんでした。' };
  }

  const candidate = parsed as Partial<SakuraBackup>;

  if (candidate.format !== BACKUP_FORMAT) {
    return { ok: false, error: 'さくらバックアップ形式のファイルではありません。' };
  }

  if (candidate.app !== APP_NAME) {
    return {
      ok: false,
      error: `これは「${candidate.app ?? '不明'}」のバックアップです。Discovery-Laboには取り込めません。`,
    };
  }

  if (typeof candidate.data !== 'object' || candidate.data === null) {
    return { ok: false, error: 'ファイルにデータが入っていません。' };
  }

  return { ok: true, backup: candidate as SakuraBackup };
};
