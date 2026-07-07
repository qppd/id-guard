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
    battery > 50
      ? "text-[#22C55E]"
      : battery > 20
        ? "text-[#F59E0B]"
        : "text-[#EF4444]";
  const batteryBg =
    battery > 50
      ? "bg-green-50"
      : battery > 20
        ? "bg-yellow-50"
        : "bg-red-50";

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 hover:border-[#3B82F6]/40 transition-colors shadow-card">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-[#183B6B] font-heading font-semibold">{lockName}</h3>
          {lockAlias && (
            <p className="text-[#6B7280] text-xs mt-0.5 font-body">{lockAlias}</p>
          )}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${batteryColor} ${batteryBg} font-body`}>
          {battery}%
        </span>
      </div>

      <div className="flex gap-2 text-xs text-[#9CA3AF] mb-3 font-body">
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
          className="flex-1 py-1.5 rounded text-sm font-medium border border-[#183B6B] text-[#183B6B] hover:bg-[#DCEEFF] disabled:opacity-50 transition-colors font-body"
        >
          Unlock
        </button>
        <button
          onClick={() => onAction(lockId, "lock")}
          disabled={loading}
          className="flex-1 py-1.5 rounded text-sm font-medium bg-[#183B6B] text-white hover:bg-[#2A5CA5] disabled:opacity-50 transition-colors font-body"
        >
          Lock
        </button>
      </div>
    </div>
  );
}
