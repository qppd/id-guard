"use client";

interface LockCardProps {
  lockId: number;
  lockName: string;
  lockAlias: string;
  battery: number;
  hasGateway: boolean;
  firmwareRevision?: string;
  onAction: (lockId: number, action: "lock" | "unlock") => void;
  loading?: boolean;
}

export default function LockCard({
  lockId,
  lockName,
  lockAlias,
  battery,
  hasGateway,
  firmwareRevision,
  onAction,
  loading,
}: LockCardProps) {
  const batteryColor =
    battery > 50 ? "text-green-400" : battery > 20 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="bg-card border border-border-card rounded-lg p-4 hover:border-accent/40 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-foreground font-medium">{lockName}</h3>
          {lockAlias && (
            <p className="text-text-secondary text-xs mt-0.5">{lockAlias}</p>
          )}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${batteryColor} bg-input-bg`}>
          {battery}%
        </span>
      </div>

      <div className="flex gap-2 text-xs text-text-muted mb-3">
        <span>ID: {lockId}</span>
        <span>•</span>
        <span>Gateway: {hasGateway ? "Yes" : "No"}</span>
        {firmwareRevision && (
          <>
            <span>•</span>
            <span>FW: {firmwareRevision}</span>
          </>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onAction(lockId, "unlock")}
          disabled={loading}
          className="flex-1 py-1.5 rounded text-sm font-medium bg-green-700 text-green-100 hover:bg-green-600 disabled:opacity-50 transition-colors"
        >
          Unlock
        </button>
        <button
          onClick={() => onAction(lockId, "lock")}
          disabled={loading}
          className="flex-1 py-1.5 rounded text-sm font-medium bg-accent text-white hover:bg-accent-hover disabled:opacity-50 transition-colors"
        >
          Lock
        </button>
      </div>
    </div>
  );
}
