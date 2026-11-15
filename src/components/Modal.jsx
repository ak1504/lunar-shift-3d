export default function Modal({ children, onClose, wide = false, label = 'Dialog' }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose?.()}>
      <section className={`modal-card ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={label}>
        <button className="modal-close icon-button" onClick={onClose} aria-label="Close dialog">×</button>
        {children}
      </section>
    </div>
  );
}
