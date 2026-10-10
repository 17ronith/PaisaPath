// A real <input> laid over the canvas at a logical (360×640) position. Phaser's DOMElement
// follows the camera transform, which misplaces it under the RES× camera zoom, so we
// position the element ourselves from the canvas's on-screen rect and keep it in sync on
// resize. Removed automatically when the scene shuts down.
import Phaser from 'phaser';
import { FONT_BODY } from './theme';
import { GAME_H, GAME_W } from '../view';

export interface HtmlInputOpts {
  type?: 'text' | 'email';
  width?: number; // logical px
  height?: number; // logical px
  placeholder?: string;
  maxLength?: number;
  value?: string;
  label?: string; // aria-label
}

export function htmlInput(
  scene: Phaser.Scene,
  cx: number,
  cy: number,
  opts: HtmlInputOpts = {},
): HTMLInputElement {
  const w = opts.width ?? 260;
  const h = opts.height ?? 42;
  const el = document.createElement('input');
  el.type = opts.type ?? 'text';
  el.autocomplete = 'off';
  el.spellcheck = false;
  if (opts.placeholder) el.placeholder = opts.placeholder;
  if (opts.maxLength) el.maxLength = opts.maxLength;
  if (opts.value) el.value = opts.value;
  if (opts.label) el.setAttribute('aria-label', opts.label);
  Object.assign(el.style, {
    position: 'fixed',
    zIndex: '10',
    margin: '0',
    padding: '0 10px',
    boxSizing: 'border-box',
    fontFamily: FONT_BODY,
    textAlign: 'center',
    border: '3px solid #283040',
    background: '#ffffff',
    color: '#202028',
    outline: 'none',
    borderRadius: '0',
  });
  document.body.appendChild(el);

  const place = (): void => {
    const r = scene.game.canvas.getBoundingClientRect();
    const k = r.width / GAME_W;
    Object.assign(el.style, {
      left: `${r.left + (cx - w / 2) * k}px`,
      top: `${r.top + (cy - h / 2) * (r.height / GAME_H)}px`,
      width: `${w * k}px`,
      height: `${h * k}px`,
      fontSize: `${Math.round(18 * k)}px`,
    });
  };
  place();
  scene.scale.on(Phaser.Scale.Events.RESIZE, place);
  window.addEventListener('resize', place);
  const remove = (): void => {
    scene.scale.off(Phaser.Scale.Events.RESIZE, place);
    window.removeEventListener('resize', place);
    el.remove();
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, remove);
  (el as HTMLInputElement & { dispose?: () => void }).dispose = remove;
  return el;
}

/** Remove an input created by htmlInput() before its scene shuts down. */
export function disposeInput(el: HTMLInputElement | undefined): void {
  (el as (HTMLInputElement & { dispose?: () => void }) | undefined)?.dispose?.();
}
