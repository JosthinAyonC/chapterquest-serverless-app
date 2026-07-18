import {
  MediaFullscreenButton,
  MediaMuteButton,
  MediaOutlet,
  MediaPlayButton,
  MediaPlayer,
  MediaSeekButton,
  MediaTime,
  MediaTimeSlider,
  MediaVolumeSlider,
} from '@vidstack/react';
import 'vidstack/styles/base.css';
import 'vidstack/styles/defaults.css';
import 'vidstack/styles/ui/buttons.css';
import 'vidstack/styles/ui/sliders.css';
import 'vidstack/styles/ui/tooltips.css';
import 'vidstack/styles/ui/buffering.css';

export interface ReviewVideoPlayerProps {
  src: string;
  title: string;
}

export default function ReviewVideoPlayer({ src, title }: ReviewVideoPlayerProps) {
  return (
    <div className="review-video-player">
      <MediaPlayer
        className="review-video-player-root"
        src={src}
        title={title}
        crossOrigin
        playsInline
      >
        <MediaOutlet />
        <div className="review-video-player-controls">
          <div className="review-video-player-row review-video-player-row--top">
            <MediaTimeSlider className="review-video-time-slider" />
          </div>
          <div className="review-video-player-row review-video-player-row--bottom">
            <div className="review-video-player-group">
              <MediaPlayButton className="review-video-control-btn" />
              <MediaSeekButton
                className="review-video-control-btn"
                seconds="-30"
                aria-label="Rewind 30 seconds"
              />
              <MediaSeekButton
                className="review-video-control-btn"
                seconds="+30"
                aria-label="Forward 30 seconds"
              />
              <span className="review-video-time">
                <MediaTime type="current" /> / <MediaTime type="duration" />
              </span>
            </div>
            <div className="review-video-player-group">
              <MediaMuteButton className="review-video-control-btn" />
              <MediaVolumeSlider className="review-video-volume-slider" />
              <MediaFullscreenButton className="review-video-control-btn" />
            </div>
          </div>
        </div>
      </MediaPlayer>
    </div>
  );
}
