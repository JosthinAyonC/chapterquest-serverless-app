import { useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  REVIEW_VIDEO_ACCEPTED_TYPES,
  REVIEW_VIDEO_MAX_BYTES,
} from '../../lib/api';
import {
  ROLE_REVIEW_BODY,
  ROLE_REVIEW_TITLE,
  UPLOAD_VIDEO_DROP_HINT,
  UPLOAD_VIDEO_FORMATS,
  UPLOAD_VIDEO_SUBTITLE,
  UPLOAD_VIDEO_TITLE,
} from '../../lib/roleplay/copy';
import { uploadReviewVideo } from '../../lib/roleplay/session';
import {
  markVideoUploaded,
  type RoleplayPlayerProgress,
} from '../../lib/roleplay/storage';
import VideoRequiredModal from './VideoRequiredModal';

export interface UploadVideoStepProps {
  sessionCode: string;
  participantName: string;
  progress: RoleplayPlayerProgress;
  onProgressChange: (progress: RoleplayPlayerProgress) => void;
  onFinish: (videoKey: string, videoContentType: string) => Promise<void>;
  onBack?: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateVideoFile(file: File): string | null {
  if (
    !REVIEW_VIDEO_ACCEPTED_TYPES.includes(
      file.type as (typeof REVIEW_VIDEO_ACCEPTED_TYPES)[number],
    )
  ) {
    return 'Only MP4, MOV, and WebM videos are allowed.';
  }
  if (file.size <= 0) {
    return 'The selected file is empty.';
  }
  if (file.size > REVIEW_VIDEO_MAX_BYTES) {
    return 'Video must be 200 MB or smaller.';
  }
  return null;
}

export default function UploadVideoStep({
  sessionCode,
  participantName,
  progress,
  onProgressChange,
  onFinish,
  onBack,
}: UploadVideoStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [showRequiredModal, setShowRequiredModal] = useState(false);

  const uploaded = progress.videoUploaded && Boolean(progress.videoKey);

  const handleFile = useCallback((file: File | null) => {
    setValidationError('');
    setUploadError('');
    if (!file) return;

    const error = validateVideoFile(file);
    if (error) {
      setValidationError(error);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  }, []);

  const handleUpload = async () => {
    if (!selectedFile || uploading) return;

    setUploading(true);
    setUploadError('');
    setUploadPercent(0);

    try {
      const result = await uploadReviewVideo({
        code: sessionCode,
        participantName,
        file: selectedFile,
        onProgress: (event) => setUploadPercent(event.percent),
      });
      const next = markVideoUploaded(
        sessionCode,
        progress,
        result.key,
        result.contentType,
      );
      onProgressChange(next);
      setUploadPercent(100);
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : 'Upload failed. Try again.',
      );
    } finally {
      setUploading(false);
    }
  };

  const handleFinish = async () => {
    if (!progress.videoKey || !progress.videoContentType) {
      setShowRequiredModal(true);
      return;
    }

    setFinishing(true);
    setUploadError('');
    try {
      await onFinish(progress.videoKey, progress.videoContentType);
    } catch {
      setUploadError('Could not finish your review. Try again.');
    } finally {
      setFinishing(false);
    }
  };

  return (
    <motion.div className="play-panel upload-video-step" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2>{UPLOAD_VIDEO_TITLE}</h2>
      <p className="page-subtitle">{UPLOAD_VIDEO_SUBTITLE}</p>

      <div className="upload-video-review-info">
        <h3>{ROLE_REVIEW_TITLE}</h3>
        <p>{ROLE_REVIEW_BODY}</p>
      </div>

      <div
        className={`upload-video-dropzone${dragOver ? ' upload-video-dropzone--active' : ''}${uploaded ? ' upload-video-dropzone--done' : ''}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          handleFile(event.dataTransfer.files.item(0));
        }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Choose review video file"
      >
        <input
          ref={inputRef}
          type="file"
          accept={REVIEW_VIDEO_ACCEPTED_TYPES.join(',')}
          className="upload-video-input"
          onChange={(event) => handleFile(event.target.files?.item(0) ?? null)}
        />
        {uploaded ? (
          <p className="upload-video-dropzone-text">Video uploaded successfully.</p>
        ) : selectedFile ? (
          <p className="upload-video-dropzone-text">
            {selectedFile.name} · {formatFileSize(selectedFile.size)}
          </p>
        ) : (
          <p className="upload-video-dropzone-text">{UPLOAD_VIDEO_DROP_HINT}</p>
        )}
        <p className="upload-video-formats">{UPLOAD_VIDEO_FORMATS}</p>
      </div>

      {validationError ? <p className="form-error">{validationError}</p> : null}
      {uploadError ? <p className="form-error">{uploadError}</p> : null}

      {uploadPercent !== null && uploading ? (
        <div className="upload-video-progress" aria-live="polite">
          <div className="upload-video-progress-bar">
            <div
              className="upload-video-progress-fill"
              style={{ width: `${uploadPercent}%` }}
            />
          </div>
          <p className="upload-video-progress-label">Uploading… {uploadPercent}%</p>
        </div>
      ) : null}

      <div className="play-actions upload-video-actions">
        {!uploaded ? (
          <button
            type="button"
            className="btn btn--primary"
            disabled={!selectedFile || uploading}
            onClick={() => void handleUpload()}
          >
            {uploading ? 'Uploading…' : 'Upload video'}
          </button>
        ) : null}
        <button
          type="button"
          className="btn btn--accent btn--lg"
          disabled={finishing || uploading}
          onClick={() => void handleFinish()}
        >
          {finishing ? 'Finishing…' : 'Finish review'}
        </button>
        {onBack ? (
          <button type="button" className="btn btn--ghost" onClick={onBack}>
            Back
          </button>
        ) : null}
      </div>

      <VideoRequiredModal
        open={showRequiredModal}
        onClose={() => setShowRequiredModal(false)}
      />
    </motion.div>
  );
}
