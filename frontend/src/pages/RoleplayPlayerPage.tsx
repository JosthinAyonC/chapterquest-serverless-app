import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import ConfirmRoleIdentityModal from '../components/roleplay/ConfirmRoleIdentityModal';
import PageLoader from '../components/PageLoader';
import RoleplayEditor from '../components/roleplay/RoleplayEditor';
import UploadVideoStep from '../components/roleplay/UploadVideoStep';
import { ROLEPLAY_ALREADY_RESPONDED } from '../lib/roleplay/copy';
import { getRoleById } from '../data/roles';
import { getRoleplayTemplate } from '../lib/roleplay/templates';
import {
  finalizeWithVideo,
  isParticipantFinalized,
  loadPublishedSession,
  type PublishedRoleplaySession,
} from '../lib/roleplay/session';
import {
  completePlayerSessionLocally,
  hasAlreadyResponded,
  loadPlayerProgress,
  loadPlayerUiState,
  markWorksheetComplete,
  resolveStepFromProgress,
  savePlayerProgress,
  savePlayerUiState,
  type PlayerStep,
  type RoleplayPlayerProgress,
} from '../lib/roleplay/storage';

export default function RoleplayPlayerPage() {
  const { code = '' } = useParams();
  const sessionCode = code.trim().toUpperCase();

  const [session, setSession] = useState<PublishedRoleplaySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [step, setStep] = useState<PlayerStep>('name');
  const [selectedName, setSelectedName] = useState('');
  const [identityConfirmed, setIdentityConfirmed] = useState(false);
  const [progress, setProgress] = useState<RoleplayPlayerProgress | null>(null);
  const [pendingName, setPendingName] = useState<string | null>(null);

  const persistUi = useCallback(
    (nextStep: PlayerStep, name: string, confirmed: boolean) => {
      savePlayerUiState(sessionCode, {
        participantName: name,
        identityConfirmed: confirmed,
        step: nextStep,
      });
    },
    [sessionCode],
  );

  const goToStep = useCallback(
    (nextStep: PlayerStep, name = selectedName, confirmed = identityConfirmed) => {
      setStep(nextStep);
      if (name) persistUi(nextStep, name, confirmed);
    },
    [identityConfirmed, persistUi, selectedName],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError('');

    loadPublishedSession(sessionCode)
      .then((published) => {
        if (cancelled) return;
        if (!published) {
          setSession(null);
          return;
        }
        setSession(published);

        if (hasAlreadyResponded(sessionCode)) {
          setStep('already-responded');
          return;
        }

        const ui = loadPlayerUiState(sessionCode);
        if (!ui?.participantName) {
          setStep('name');
          return;
        }

        const saved = loadPlayerProgress(sessionCode, ui.participantName);
        setSelectedName(ui.participantName);
        setProgress(saved);
        setIdentityConfirmed(ui.identityConfirmed);

        if (isParticipantFinalized(published, ui.participantName) || saved.finalized) {
          completePlayerSessionLocally(sessionCode, ui.participantName);
          setStep('already-responded');
          return;
        }

        if (ui.identityConfirmed) {
          const resolved =
            ui.step === 'name'
              ? 'role'
              : ui.step === 'upload-video' || saved.worksheetComplete
                ? resolveStepFromProgress(saved)
                : ui.step;
          setStep(resolved);
          return;
        }

        setStep('name');
      })
      .catch(() => {
        if (!cancelled) setLoadError('Could not load this review session.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sessionCode]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void loadPublishedSession(sessionCode).then((published) => {
        if (published) setSession(published);
      });
    }, 2000);
    return () => window.clearInterval(id);
  }, [sessionCode]);

  const participant = session?.participants.find((p) => p.name === selectedName);
  const pendingParticipant = session?.participants.find((p) => p.name === pendingName);
  const role = participant ? getRoleById(participant.roleId) : null;
  const pendingRole = pendingParticipant
    ? getRoleById(pendingParticipant.roleId)
    : null;
  const template = participant ? getRoleplayTemplate(participant.roleId) : null;

  const handlePickName = (name: string) => {
    if (!session || isParticipantFinalized(session, name)) return;
    setPendingName(name);
  };

  const handleConfirmIdentity = () => {
    if (!session || !pendingName || !pendingRole) return;
    const saved = loadPlayerProgress(session.code, pendingName);
    setSelectedName(pendingName);
    setProgress(saved);
    setIdentityConfirmed(true);
    setPendingName(null);

    const nextStep: PlayerStep =
      saved.finalized || isParticipantFinalized(session, pendingName)
        ? 'already-responded'
        : saved.mode
          ? resolveStepFromProgress(saved)
          : 'role';

    if (nextStep === 'already-responded') {
      completePlayerSessionLocally(session.code, pendingName);
    }

    setStep(nextStep);
    persistUi(nextStep, pendingName, true);
  };

  const handleChooseMode = (mode: 'online' | 'download') => {
    if (!session || !selectedName) return;
    const next: RoleplayPlayerProgress = {
      ...(progress ?? loadPlayerProgress(session.code, selectedName)),
      mode,
    };
    savePlayerProgress(session.code, next);
    setProgress(next);

    if (mode === 'online') {
      goToStep('online');
      return;
    }

    if (template) {
      const anchor = document.createElement('a');
      anchor.href = template.pdfPath;
      anchor.download = template.downloadName;
      anchor.click();
    }
    goToStep('confirm-done');
  };

  const handleWorksheetComplete = () => {
    if (!session || !selectedName) return;
    const current = progress ?? loadPlayerProgress(session.code, selectedName);
    const next = markWorksheetComplete(session.code, {
      ...current,
      mode: current.mode ?? 'online',
    });
    setProgress(next);
    goToStep('upload-video');
  };

  const handleVideoFinalize = async (videoKey: string, videoContentType: string) => {
    if (!session || !selectedName) return;
    const result = await finalizeWithVideo(
      session.code,
      selectedName,
      videoKey,
      videoContentType,
    );
    if (!result) {
      throw new Error('Could not finalize review.');
    }
    completePlayerSessionLocally(session.code, selectedName);
    const updated = await loadPublishedSession(session.code);
    if (updated) setSession(updated);
    setSelectedName('');
    setIdentityConfirmed(false);
    setProgress(null);
    setStep('already-responded');
  };

  if (loading) {
    return <PageLoader label="Loading role review" />;
  }

  if (loadError) {
    return (
      <section className="page">
        <header className="page-header">
          <p className="eyebrow">Role review</p>
          <h1>Something went wrong</h1>
          <p className="page-subtitle">{loadError}</p>
        </header>
      </section>
    );
  }

  if (!session) {
    return (
      <section className="page">
        <header className="page-header">
          <p className="eyebrow">Role review</p>
          <h1>Session not found</h1>
          <p className="page-subtitle">
            This code is not active. Ask your teacher to open the review screen
            on the host device, then scan the QR again.
          </p>
        </header>
        <Link to="/" className="btn btn--primary">
          Back to home
        </Link>
      </section>
    );
  }

  return (
    <section className="page roleplay-player-page">
      <header className="page-header">
        <p className="eyebrow">Role review</p>
        <h1>
          {step === 'already-responded'
            ? 'Review complete'
            : step === 'upload-video'
              ? 'Upload your video'
              : 'Complete your role review'}
        </h1>
        {identityConfirmed && selectedName && role && step !== 'already-responded' ? (
          <p className="roleplay-player-identity">
            {selectedName} · {role.icon} {role.nameEn}
          </p>
        ) : null}
      </header>

      {step === 'name' ? (
        <motion.div className="play-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h2>Step 1 — Who are you?</h2>
          <p className="page-subtitle">Pick your name from today&apos;s circle.</p>
          <div className="roleplay-name-grid">
            {session.participants.map((p) => {
              const done = isParticipantFinalized(session, p.name);
              return (
                <button
                  key={p.name}
                  type="button"
                  className="btn btn--secondary roleplay-name-btn"
                  disabled={done}
                  onClick={() => handlePickName(p.name)}
                >
                  {p.name}
                  {done ? ' · completed' : ''}
                </button>
              );
            })}
          </div>
        </motion.div>
      ) : null}

      {step === 'role' && role ? (
        <motion.div className="play-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h2>Step 2 — Your role</h2>
          <div className="roleplay-role-card">
            <span className="roleplay-role-icon" aria-hidden="true">
              {role.icon}
            </span>
            <div>
              <p className="roleplay-role-name">{role.nameEn}</p>
              <p className="roleplay-role-desc">{role.description}</p>
            </div>
          </div>
          <div className="play-actions">
            <button type="button" className="btn btn--primary" onClick={() => goToStep('mode')}>
              Continue
            </button>
          </div>
        </motion.div>
      ) : null}

      {step === 'mode' ? (
        <motion.div className="play-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h2>Step 3 — How do you want to complete it?</h2>
          <div className="roleplay-mode-grid">
            <button
              type="button"
              className="btn btn--accent btn--lg roleplay-mode-btn"
              onClick={() => handleChooseMode('online')}
            >
              Fill online
              <span>Write on the template in your browser</span>
            </button>
            <button
              type="button"
              className="btn btn--secondary btn--lg roleplay-mode-btn"
              onClick={() => handleChooseMode('download')}
            >
              Download PDF
              <span>Print and complete by hand</span>
            </button>
          </div>
          <div className="play-actions">
            <button type="button" className="btn btn--ghost" onClick={() => goToStep('role')}>
              Back to role
            </button>
          </div>
        </motion.div>
      ) : null}

      {step === 'online' && participant ? (
        <>
          <RoleplayEditor
            sessionCode={session.code}
            participantName={selectedName}
            roleId={participant.roleId}
            onWorksheetComplete={handleWorksheetComplete}
          />
          <div className="play-actions">
            <button type="button" className="btn btn--ghost" onClick={() => goToStep('mode')}>
              Back to options
            </button>
          </div>
        </>
      ) : null}

      {step === 'confirm-done' ? (
        <motion.div className="play-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h2>Step 4 — Worksheet done?</h2>
          <p className="page-subtitle">
            When your printed worksheet is complete, continue to upload your review video.
          </p>
          <div className="play-actions">
            <button
              type="button"
              className="btn btn--accent btn--lg"
              onClick={handleWorksheetComplete}
            >
              Continue to video upload
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => goToStep('mode')}>
              Back to options
            </button>
          </div>
        </motion.div>
      ) : null}

      {step === 'upload-video' && selectedName ? (
        <UploadVideoStep
          sessionCode={session.code}
          participantName={selectedName}
          progress={progress ?? loadPlayerProgress(session.code, selectedName)}
          onProgressChange={setProgress}
          onFinish={handleVideoFinalize}
          onBack={() => {
            const current =
              progress ?? loadPlayerProgress(session.code, selectedName);
            goToStep(current.mode === 'download' ? 'confirm-done' : 'online');
          }}
        />
      ) : null}

      {step === 'already-responded' ? (
        <motion.div
          className="play-panel roleplay-thanks"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="page-subtitle">{ROLEPLAY_ALREADY_RESPONDED}</p>
        </motion.div>
      ) : null}

      <ConfirmRoleIdentityModal
        open={Boolean(pendingName && pendingRole)}
        participantName={pendingName ?? ''}
        roleName={pendingRole?.nameEn ?? ''}
        roleIcon={pendingRole?.icon ?? ''}
        onConfirm={handleConfirmIdentity}
        onCancel={() => setPendingName(null)}
      />
    </section>
  );
}
