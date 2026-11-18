"use client";

import { Component, type ReactNode } from "react";

/** Keeps the rest of the portal usable when WebGL is unavailable or the scene throws. */
export default class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="grid h-full place-items-center p-6 text-center">
        <div>
          <div className="label mb-2">3D VIEW UNAVAILABLE</div>
          <p className="max-w-xs text-[11px] leading-relaxed text-[var(--muted)]">
            This browser could not start WebGL. Enable hardware acceleration to see the warehouse model.
            Every panel below still works.
          </p>
          <button onClick={() => this.setState({ failed: false })} className="glass mt-3 rounded px-3 py-1.5 text-[10px] tracking-widest text-[var(--text)]">
            RETRY
          </button>
        </div>
      </div>
    );
  }
}
