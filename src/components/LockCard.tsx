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
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-white font-medium">{lockName}</h3>
          {lockAlias && (
            <p className="text-gray-400 text-xs mt-0.5">{lockAlias}</p>
          )}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${batteryColor} bg-gray-800`}>
          🔋 {battery}%
        </span>
      </div>

      <div className="flex gap-2 text-xs text-gray-500 mb-3">
        <span>ID: {lockId}</span>
        <span>•</span>
        <span>Gateway: {hasGateway ? "✅" : "❌"}</span>
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
          🔓 Unlock
        </button>
        <button
          onClick={() => onAction(lockId, "lock")}
          disabled={loading}
          className="flex-1 py-1.5 rounded text-sm font-medium bg-red-700 text-red-100 hover:bg-red-600 disabled:opacity-50 transition-colors"
        >
          🔒 Lock
        </button>
      </div>
    </div>
  );
}
