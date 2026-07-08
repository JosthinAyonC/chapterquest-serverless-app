import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlaySession } from '../context/PlaySessionContext';
import type { Participant } from '../context/PlaySessionContext';
import {
  shuffleRoles,
  getRoleById,
  ROLES,
} from '../data/roles';
import type { Role, RoleId } from '../types/role';
import { preloadEmojiWheelImages } from '../utils/emojiWheelImage';
import RouletteWheel from './RouletteWheel';

interface SpinState {
  slice: Role[];
  prize: number;
  spinKey: number;
}

const REVEAL_MS = 1500;

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildSpinState(index: number, shuffled: Role[]): SpinState | null {
  const currentRole = shuffled[index];
  if (!currentRole) return null;

  const remaining = shuffled.slice(index);
  const visualOrder = shuffleArray(remaining);
  const prize = visualOrder.findIndex((role) => role.id === currentRole.id);

  return {
    slice: visualOrder,
    prize: Math.min(Math.max(prize >= 0 ? prize : 0, 0), visualOrder.length - 1),
    spinKey: Date.now() + index,
  };
}

export default function Roulette() {
  const { rouletteNames, finishRoulette } = usePlaySession();
  const shuffledRolesRef = useRef<Role[]>([]);
  const assignedRef = useRef<Participant[]>([]);
  const spinStateRef = useRef<SpinState | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mustSpin, setMustSpin] = useState(false);
  const [assigned, setAssigned] = useState<Participant[]>([]);
  const [revealedRoleId, setRevealedRoleId] = useState<RoleId | null>(null);
  const [spinState, setSpinState] = useState<SpinState | null>(null);
  const [wheelReady, setWheelReady] = useState(false);
  const stopHandledRef = useRef(false);

  spinStateRef.current = spinState;

  const queueSpin = useCallback((index: number, shuffled: Role[]) => {
    const next = buildSpinState(index, shuffled);
    if (!next) return;
    stopHandledRef.current = false;
    setMustSpin(false);
    setWheelReady(false);
    setSpinState(next);
  }, []);

  const assignRole = useCallback(
    (index: number, role: Role) => {
      const currentName = rouletteNames[index];
      if (!currentName) return null;

      setRevealedRoleId(role.id);
      const nextAssigned = [
        ...assignedRef.current,
        { name: currentName, roleId: role.id },
      ];
      assignedRef.current = nextAssigned;
      setAssigned(nextAssigned);
      return nextAssigned;
    },
    [rouletteNames],
  );

  const advanceAfterAssign = useCallback(
    (index: number, nextAssigned: Participant[]) => {
      if (index + 1 >= rouletteNames.length) {
        window.setTimeout(() => finishRoulette(nextAssigned), REVEAL_MS);
        return;
      }

      const shuffled = shuffledRolesRef.current;
      const nextIndex = index + 1;
      const remaining = shuffled.slice(nextIndex);

      window.setTimeout(() => {
        if (remaining.length === 1) {
          const lastRole = remaining[0];
          const lastName = rouletteNames[nextIndex];
          if (!lastRole || !lastName) return;

          setCurrentIndex(nextIndex);
          setSpinState(null);
          setMustSpin(false);
          setWheelReady(false);
          setRevealedRoleId(lastRole.id);

          const finalAssigned = [
            ...nextAssigned,
            { name: lastName, roleId: lastRole.id },
          ];
          assignedRef.current = finalAssigned;
          setAssigned(finalAssigned);

          window.setTimeout(() => finishRoulette(finalAssigned), REVEAL_MS);
          return;
        }

        setRevealedRoleId(null);
        setCurrentIndex(nextIndex);
        queueSpin(nextIndex, shuffled);
      }, REVEAL_MS);
    },
    [rouletteNames, finishRoulette, queueSpin],
  );

  const autoAssignIfSingleRole = useCallback(
    (index: number, shuffled: Role[]) => {
      const remaining = shuffled.slice(index);
      if (remaining.length !== 1) return false;

      const role = remaining[0];
      const name = rouletteNames[index];
      if (!role || !name) return false;

      setCurrentIndex(index);
      setSpinState(null);
      setMustSpin(false);
      setWheelReady(false);
      setRevealedRoleId(role.id);

      const nextAssigned = [
        ...assignedRef.current,
        { name, roleId: role.id },
      ];
      assignedRef.current = nextAssigned;
      setAssigned(nextAssigned);

      window.setTimeout(() => finishRoulette(nextAssigned), REVEAL_MS);
      return true;
    },
    [rouletteNames, finishRoulette],
  );

  useEffect(() => {
    void preloadEmojiWheelImages(ROLES.map((role) => role.icon));
  }, []);

  useEffect(() => {
    assignedRef.current = assigned;
  }, [assigned]);

  useEffect(() => {
    if (!spinState || spinState.slice.length === 0) {
      setWheelReady(false);
      setMustSpin(false);
      return undefined;
    }

    let cancelled = false;
    setWheelReady(false);
    setMustSpin(false);

    void preloadEmojiWheelImages(spinState.slice.map((role) => role.icon)).then(
      () => {
        if (cancelled) return;
        setWheelReady(true);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [spinState]);

  useEffect(() => {
    if (!wheelReady || !spinState) return undefined;

    let cancelled = false;
    let innerFrame = 0;
    const outerFrame = window.requestAnimationFrame(() => {
      innerFrame = window.requestAnimationFrame(() => {
        if (!cancelled) setMustSpin(true);
      });
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(outerFrame);
      window.cancelAnimationFrame(innerFrame);
    };
  }, [wheelReady, spinState?.spinKey]);

  useEffect(() => {
    if (rouletteNames.length === 0) return;

    const shuffled = shuffleRoles();
    shuffledRolesRef.current = shuffled;
    assignedRef.current = [];
    stopHandledRef.current = false;
    setCurrentIndex(0);
    setAssigned([]);
    setRevealedRoleId(null);
    if (!autoAssignIfSingleRole(0, shuffled)) {
      queueSpin(0, shuffled);
    }
  }, [rouletteNames, queueSpin, autoAssignIfSingleRole]);

  const handleStop = useCallback(() => {
    if (stopHandledRef.current) return;
    stopHandledRef.current = true;
    setMustSpin(false);

    const activeSpin = spinStateRef.current;
    const winningRole =
      activeSpin?.slice[activeSpin.prize] ??
      shuffledRolesRef.current[currentIndex];
    if (!winningRole) return;

    const nextAssigned = assignRole(currentIndex, winningRole);
    if (!nextAssigned) return;
    advanceAfterAssign(currentIndex, nextAssigned);
  }, [assignRole, advanceAfterAssign, currentIndex]);

  if (rouletteNames.length === 0) return null;

  const currentName = rouletteNames[currentIndex] ?? '';
  const revealedRole = revealedRoleId ? getRoleById(revealedRoleId) : null;
  const total = rouletteNames.length;
  const showWheel = Boolean(spinState && spinState.slice.length > 0);

  if (!showWheel && !revealedRole) {
    return (
      <div className="roulette-wrap" aria-live="polite">
        <p className="roulette-spinning-hint">Preparing…</p>
      </div>
    );
  }

  const wheelSlice = spinState?.slice ?? [];
  const prizeNumber = spinState?.prize ?? 0;
  const wheelHidden = Boolean(revealedRoleId);

  return (
    <div className="roulette-wrap" aria-live="polite">
      <div className="roulette-progress-dots" aria-hidden="true">
        {rouletteNames.map((name, index) => (
          <span
            key={name}
            className={`roulette-dot${
              index < currentIndex
                ? ' roulette-dot--done'
                : index === currentIndex
                  ? ' roulette-dot--active'
                  : ''
            }`}
          />
        ))}
      </div>

      <p className="roulette-step-caption">
        Participant {currentIndex + 1} of {total}
      </p>

      <div className="roulette-name-chip">{currentName}</div>

      <div className="roulette-stage">
        {showWheel ? (
          <div
            className={`roulette-wheel-frame${wheelHidden ? ' roulette-wheel-frame--hidden' : ''}`}
          >
            <div className="roulette-wheel-pointer" aria-hidden="true" />
            <div className="roulette-wheel-host">
              {wheelReady ? (
                <RouletteWheel
                  key={spinState!.spinKey}
                  slices={wheelSlice}
                  prizeIndex={prizeNumber}
                  spinning={mustSpin}
                  spinKey={spinState!.spinKey}
                  onStopped={handleStop}
                />
              ) : (
                <p className="roulette-wheel-loading" aria-hidden="true">
                  Preparing wheel…
                </p>
              )}
            </div>
          </div>
        ) : revealedRole ? null : (
          <p className="roulette-auto-assign-note">
            Only one role left — assigned automatically
          </p>
        )}

        <AnimatePresence>
          {revealedRole ? (
            <motion.div
              key={revealedRole.id}
              className="roulette-reveal-overlay"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: 140, scale: 0.5 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            >
              <div
                className="roulette-reveal-card"
                style={{ borderColor: revealedRole.color }}
              >
                <span className="roulette-reveal-icon" aria-hidden="true">
                  {revealedRole.icon}
                </span>
                <div>
                  <p className="roulette-reveal-name">{currentName}</p>
                  <p className="roulette-reveal-role">{revealedRole.nameEn}</p>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <p className="roulette-status-line">
        {showWheel ? (mustSpin ? 'Spinning…' : 'Get ready…') : 'Assigning…'}
      </p>

      <div className="roulette-assigned-wrap">
        <p className="roulette-assigned-title">Assigned so far</p>
        <ul className="roulette-assigned-chips" aria-label="Roles assigned so far">
          {assigned.map((participant) => {
            const role = getRoleById(participant.roleId);
            return (
              <li
                key={participant.name}
                className="roulette-assigned-chip"
                style={{ borderColor: role.color }}
              >
                <span aria-hidden="true">{role.icon}</span>
                {participant.name} · {role.wheelLabel}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
