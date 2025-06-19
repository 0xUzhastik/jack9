import { EnterRound } from "./EnterRound";
import JackpotDonutChart from "./JackpotDonutChart";
import { TokenSelectorModeWrapper } from "./tokenSelector/TokenSelectorModeWrapper"; // 🔥 NEW: Use mode wrapper
import { useUIStore } from "@/stores/uiStore";

export function CenterColumn() {
  const { isMobile } = useUIStore();

  return (
    <div className="md:col-span-2 w-full max-w-full min-w-0 h-full min-h-0 flex flex-col gap-2 overflow-visible">
      {/* Donut Chart */}
      <div className="w-full h-[50vh] min-h-0 relative pb-20 pt-4 z-5">
        <JackpotDonutChart />
      </div>
      
      {/* Token Selector/Portfolio (Desktop) or Empty space (Mobile) */}
      {!isMobile && (
        <div className="flex-1 min-h-0 overflow-visible" style={{ zIndex: 2 }}>
          <TokenSelectorModeWrapper />
        </div>
      )}
    </div>
  );
}