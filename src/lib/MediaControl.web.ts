// src/lib/MediaControl.web.ts
const MediaControlMock = {
  Command: {
    PLAY: "play",
    PAUSE: "pause",
    NEXT_TRACK: "next",
    PREVIOUS_TRACK: "prev",
  } as const,
  PlaybackState: {
    PLAYING: 3,
    PAUSED: 2,
  } as const,
  enableMediaControls: (_opts?: any) => {},
  updateMetadata: (_meta: any) => {},
  updatePlaybackState: (_state?: any, _position?: any) => {},
  addListener: (_cb: any) => ({ remove: () => {} }),
};

export default MediaControlMock;