import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  MapPin,
  Package,
  Play,
  Pause,
  SkipForward,
  Truck,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import { CustomerOrder, OrderStatusStage } from '../types/store';
import {
  buildOrderTimeline,
  formatAED,
  getNextOrderStatus,
  getOrderProgressPercent,
  ORDER_STATUS_SEQUENCE,
} from '../utils/storeLogic';
import { useCartStore } from '../store/useCartStore';

interface OrderTrackingTimelineProps {
  selectedOrderId?: string;
}

export function OrderTrackingTimeline({ selectedOrderId }: OrderTrackingTimelineProps) {
  const recentOrders = useCartStore((state) => state.recentOrders);
  const updateOrderStatus = useCartStore((state) => state.updateOrderStatus);

  const [activeOrderId, setActiveOrderId] = useState<string>(
    selectedOrderId || recentOrders[0]?.orderId || 'VDK-892410'
  );
  const [isAutoSimulating, setIsAutoSimulating] = useState<boolean>(false);

  useEffect(() => {
    if (selectedOrderId) {
      setActiveOrderId(selectedOrderId);
    } else if (recentOrders.length > 0 && !recentOrders.some((o) => o.orderId === activeOrderId)) {
      setActiveOrderId(recentOrders[0].orderId);
    }
  }, [selectedOrderId, recentOrders, activeOrderId]);

  const currentOrder: CustomerOrder | undefined =
    recentOrders.find((o) => o.orderId === activeOrderId) || recentOrders[0];

  // Auto-advance mock real-time status timeline when live simulation is active
  useEffect(() => {
    if (!isAutoSimulating || !currentOrder) return;

    const timer = setInterval(() => {
      const nextStage = getNextOrderStatus(currentOrder.status);
      if (nextStage === currentOrder.status) {
        // Loop back to order_placed if user keeps live simulation running after delivered
        updateOrderStatus(currentOrder.orderId, 'order_placed');
      } else {
        updateOrderStatus(currentOrder.orderId, nextStage);
      }
    }, 2400);

    return () => clearInterval(timer);
  }, [isAutoSimulating, currentOrder, updateOrderStatus]);

  if (!currentOrder) {
    return (
      <div className="border border-zinc-200 bg-zinc-50 p-5 text-center text-xs text-zinc-500">
        No orders found for live status tracking. Place a Cash on Delivery order to track it in real time.
      </div>
    );
  }

  const timelineSteps =
    currentOrder.timeline && currentOrder.timeline.length > 0
      ? currentOrder.timeline
      : buildOrderTimeline(currentOrder.status);

  const progressPercent = getOrderProgressPercent(currentOrder.status);
  const activeStep = timelineSteps.find((s) => s.current) || timelineSteps[timelineSteps.length - 1];

  const handleAdvanceNextStep = () => {
    const nextStage = getNextOrderStatus(currentOrder.status);
    if (nextStage === currentOrder.status) {
      updateOrderStatus(currentOrder.orderId, 'order_placed');
    } else {
      updateOrderStatus(currentOrder.orderId, nextStage);
    }
  };

  const handleSelectStageDirectly = (stage: OrderStatusStage) => {
    updateOrderStatus(currentOrder.orderId, stage);
  };

  return (
    <div
      data-testid="order-tracking-timeline"
      className="border border-zinc-200 bg-white"
    >
      {/* Top Telemetry Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-950 px-4 py-3.5 text-white">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono-num text-xs font-bold tracking-wider uppercase">
                LIVE GPS TELEMETRY · #{currentOrder.orderId}
              </span>
              <span className="bg-emerald-500/20 px-2 py-0.5 font-mono-num text-[10px] font-bold text-emerald-300">
                {progressPercent}% COMPLETE
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              {currentOrder.emirate} Express Dispatch · {currentOrder.paymentMethod} (
              {formatAED(currentOrder.total)})
            </p>
          </div>
        </div>

        {/* Order Selector if multiple orders exist */}
        {recentOrders.length > 1 && (
          <select
            aria-label="Select order to track"
            value={currentOrder.orderId}
            onChange={(e) => setActiveOrderId(e.target.value)}
            className="border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 font-mono-num text-xs font-semibold text-white focus:outline-none"
          >
            {recentOrders.map((ord) => (
              <option key={ord.orderId} value={ord.orderId}>
                #{ord.orderId} ({ord.emirate})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Interactive Real-Time Controls & Courier Meta */}
      <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-zinc-900">
              <Truck className="h-3.5 w-3.5 text-zinc-950" />
              <span>{currentOrder.courierName}</span>
            </div>
            <span className="text-zinc-300">|</span>
            <div className="flex items-center gap-1.5 text-zinc-600">
              <Clock className="h-3.5 w-3.5 text-zinc-700" />
              <span>ETA: {currentOrder.estimatedArrival}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="toggle-live-tracking-btn"
              onClick={() => setIsAutoSimulating((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 border px-2.5 py-1.5 text-[11px] font-bold transition-colors ${
                isAutoSimulating
                  ? 'border-emerald-700 bg-emerald-700 text-white'
                  : 'border-zinc-300 bg-white text-zinc-900 hover:border-zinc-950'
              }`}
            >
              {isAutoSimulating ? (
                <>
                  <Pause className="h-3 w-3" />
                  <span>Pause Live Feed</span>
                </>
              ) : (
                <>
                  <Play className="h-3 w-3" />
                  <span>Simulate Real-Time Feed</span>
                </>
              )}
            </button>

            <button
              type="button"
              data-testid="advance-order-status-btn"
              onClick={handleAdvanceNextStep}
              className="inline-flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-zinc-800"
            >
              <SkipForward className="h-3 w-3" />
              <span>Next Status Step</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] font-semibold">
            <span data-testid="active-order-status-label" className="text-zinc-950">
              Current Stage: {activeStep?.label}
            </span>
            <span className="font-mono-num text-zinc-600">{progressPercent}%</span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden bg-zinc-200">
            <div
              className="h-full bg-zinc-950 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 5-Stage Interactive Mock Status Timeline */}
      <div className="p-4 sm:p-5">
        <ol className="relative space-y-3 before:absolute before:top-3 before:bottom-3 before:left-4 before:w-0.5 before:bg-zinc-200">
          {timelineSteps.map((step, index) => {
            const isCompleted = step.completed;
            const isCurrent = step.current;
            return (
              <li
                key={step.status}
                data-testid={`timeline-step-${step.status}`}
                className={`relative flex items-start gap-3.5 border p-3 ${
                  isCurrent
                    ? 'border-zinc-950 bg-zinc-950 text-white shadow-sm'
                    : isCompleted
                      ? 'border-zinc-200 bg-white text-zinc-900'
                      : 'border-zinc-200 bg-zinc-50 text-zinc-500'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleSelectStageDirectly(step.status)}
                  title={`Jump to ${step.label}`}
                  className={`relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border text-xs font-bold transition-colors ${
                    isCurrent
                      ? 'border-emerald-400 bg-emerald-500 text-zinc-950'
                      : isCompleted
                        ? 'border-zinc-950 bg-zinc-950 text-white'
                        : 'border-zinc-300 bg-white text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <span className="font-mono-num text-[10px]">{index + 1}</span>
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <p
                        className={`font-display text-xs font-bold ${
                          isCurrent
                            ? 'text-white'
                            : isCompleted
                              ? 'text-zinc-950'
                              : 'text-zinc-500'
                        }`}
                      >
                        {step.label}
                      </p>
                      {isCurrent && (
                        <span className="inline-flex items-center gap-1 bg-emerald-400 px-1.5 py-0.5 text-[10px] font-bold text-zinc-950 uppercase">
                          <Radio className="h-2.5 w-2.5" />
                          <span>Active</span>
                        </span>
                      )}
                    </div>
                    <span
                      className={`font-mono-num text-[11px] font-semibold ${
                        isCurrent ? 'text-emerald-300' : 'text-zinc-500'
                      }`}
                    >
                      {step.timestamp}
                    </span>
                  </div>

                  <p
                    className={`mt-1 text-[11px] leading-relaxed ${
                      isCurrent ? 'text-zinc-300' : isCompleted ? 'text-zinc-600' : 'text-zinc-400'
                    }`}
                  >
                    {step.description}
                  </p>

                  <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-medium">
                    <MapPin
                      className={`h-3 w-3 shrink-0 ${
                        isCurrent ? 'text-emerald-400' : 'text-zinc-400'
                      }`}
                    />
                    <span className={isCurrent ? 'text-zinc-200' : 'text-zinc-500'}>
                      {step.location}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        {/* Quick Stage Pills for Instant Testing */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-200 pt-3 text-[11px]">
          <span className="inline-flex items-center gap-1.5 font-semibold text-zinc-600">
            <ShieldCheck className="h-3.5 w-3.5 text-zinc-950" />
            <span>Click any milestone above to test courier status transitions</span>
          </span>
          <span className="font-mono-num text-zinc-500">
            Stage {ORDER_STATUS_SEQUENCE.indexOf(currentOrder.status) + 1} of{' '}
            {ORDER_STATUS_SEQUENCE.length}
          </span>
        </div>
      </div>
    </div>
  );
}
