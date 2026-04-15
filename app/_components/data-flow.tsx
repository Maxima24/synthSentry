import { HugeiconsIcon } from "@hugeicons/react";
import {
  Activity03Icon,
  BellDotIcon,
  Brain02Icon,
  ChartEvaluationIcon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";

type IconAsset = typeof Wallet01Icon;

export function DataFlow() {
  return (
    <div className="relative mx-auto mt-10 flex max-w-3xl items-center justify-center gap-1 px-1 pb-14 sm:mt-14 sm:gap-3 sm:pb-16">
      <FlowNode icon={Wallet01Icon} label="Portfolio" sub="Your holdings" />
      <Beam delay={0} />
      <FlowNode
        icon={Activity03Icon}
        label="Bayse"
        sub="Live market data"
        hiddenOnMobile
      />
      <Beam delay={0.6} hiddenOnMobile />
      <FlowNode
        icon={Brain02Icon}
        label="Gemini AI"
        sub="Risk + reasoning"
        featured
      />
      <Beam delay={1.2} />
      <FlowNode
        icon={ChartEvaluationIcon}
        label="Risk Score"
        sub="0–100 + rationale"
        hiddenOnMobile
      />
      <Beam delay={1.8} hiddenOnMobile />
      <FlowNode icon={BellDotIcon} label="You" sub="Alerted in time" />
    </div>
  );
}

interface FlowNodeProps {
  icon: IconAsset;
  label: string;
  sub: string;
  featured?: boolean;
  hiddenOnMobile?: boolean;
}

function FlowNode({
  icon,
  label,
  sub,
  featured = false,
  hiddenOnMobile = false,
}: FlowNodeProps) {
  return (
    <div
      className={`relative shrink-0 ${hiddenOnMobile ? "hidden md:block" : ""}`}
    >
      <div
        className={`relative flex size-11 items-center justify-center rounded-full border backdrop-blur-sm transition-all duration-500 sm:size-20 ${
          featured
            ? "border-primary/40 bg-primary/10 shadow-[0_0_36px_color-mix(in_oklab,var(--color-primary)_40%,transparent)]"
            : "border-white/20 bg-white/[0.06]"
        }`}
      >
        {featured && (
          <span
            aria-hidden
            className="animate-pulse-soft absolute -inset-1 rounded-full bg-primary/25 blur-xl"
          />
        )}
        <HugeiconsIcon
          icon={icon}
          className={`relative size-4 sm:size-7 ${featured ? "text-primary" : "text-white/90"}`}
        />
      </div>
      <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap text-center sm:mt-3">
        <p className="font-display text-[10px] font-semibold tracking-tight text-white/90 sm:text-xs">
          {label}
        </p>
        <p className="mt-0.5 hidden font-sans text-[10px] text-white/50 sm:block">
          {sub}
        </p>
      </div>
    </div>
  );
}

interface BeamProps {
  delay: number;
  hiddenOnMobile?: boolean;
}

function Beam({ delay, hiddenOnMobile = false }: BeamProps) {
  return (
    <div
      className={`relative h-[2px] min-w-[16px] flex-1 overflow-hidden rounded-full bg-white/10 sm:min-w-[60px] ${
        hiddenOnMobile ? "hidden md:block" : ""
      }`}
    >
      <span
        aria-hidden
        className="animate-beam-flow absolute top-1/2 h-1.5 w-5 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_12px_color-mix(in_oklab,var(--color-primary)_60%,transparent)] sm:w-7"
        style={{ animationDelay: `${delay}s`, filter: "blur(0.5px)" }}
      />
    </div>
  );
}
