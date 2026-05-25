import { useState, useCallback } from 'react';
import { Icon } from './Icon';

export const ConfirmDialog = ({
  title,
  message,
  detail,
  confirmLabel = 'Delete',
  cancelLabel  = 'Cancel',
  danger       = true,
  icon         = 'trash',
  onConfirm,
  onCancel,
}) => (
  <div
    className="modal-backdrop"
    onClick={onCancel}
    style={{ zIndex: 1000 }}
  >
    <div
      className="modal"
      style={{ maxWidth: 420, textAlign: 'center' }}
      onClick={e => e.stopPropagation()}
    >
      {/* Icon */}
      <div style={{ padding: '32px 28px 0' }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16, margin: '0 auto 18px',
          background: danger ? 'rgba(248,113,113,0.12)' : 'rgba(245,166,35,0.12)',
          border: `1px solid ${danger ? 'rgba(248,113,113,0.25)' : 'rgba(245,166,35,0.25)'}`,
          display: 'grid', placeItems: 'center',
          color: danger ? 'var(--danger)' : 'var(--orange-400)',
        }}>
          <Icon name={icon} size={24} />
        </div>

        {/* Title */}
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, color: 'var(--text-1)' }}>
          {title}
        </div>

        {/* Message */}
        <div style={{ fontSize: 13.5, color: 'var(--text-3)', lineHeight: 1.65, marginBottom: detail ? 8 : 0 }}>
          {message}
        </div>

        {/* Optional detail line (e.g. item name) */}
        {detail && (
          <div style={{
            marginTop: 10, padding: '8px 14px',
            background: danger ? 'rgba(248,113,113,0.07)' : 'rgba(245,166,35,0.07)',
            border: `1px solid ${danger ? 'rgba(248,113,113,0.2)' : 'rgba(245,166,35,0.2)'}`,
            borderRadius: 8, fontSize: 13, fontWeight: 600, color: 'var(--text-2)',
          }}>
            {detail}
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--glass-border)', margin: '24px 0 0' }} />

      {/* Buttons */}
      <div style={{ padding: '16px 24px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost" onClick={onCancel} style={{ minWidth: 80 }}>
          {cancelLabel}
        </button>
        <button
          className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
          onClick={onConfirm}
          style={{ minWidth: 90 }}
        >
          <Icon name={icon} size={13} style={{ marginRight: 4 }} />
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

export const useConfirm = () => {
  const [state, setState] = useState({ open: false, config: {}, resolve: null });

  const confirm = useCallback((config) =>
    new Promise(resolve => {
      setState({ open: true, config, resolve });
    }),
  []);

  const handleConfirm = useCallback(() => {
    setState(prev => { prev.resolve?.(true); return { open: false, config: {}, resolve: null }; });
  }, []);

  const handleCancel = useCallback(() => {
    setState(prev => { prev.resolve?.(false); return { open: false, config: {}, resolve: null }; });
  }, []);

  const dialog = state.open ? (
    <ConfirmDialog {...state.config} onConfirm={handleConfirm} onCancel={handleCancel} />
  ) : null;

  return { confirm, dialog };
};
