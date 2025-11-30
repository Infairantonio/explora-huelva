import { useEffect } from "react";

export default function ConfirmarModal({ titulo, mensaje, onConfirmar, onCancelar }) {
  useEffect(() => {
    const modal = document.getElementById("modalConfirmar");
    if (modal) {
      const modalObj = new bootstrap.Modal(modal);
      modalObj.show();
    }
  }, []);

  return (
    <div className="modal fade" id="modalConfirmar" tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow">

          <div className="modal-header">
            <h5 className="modal-title">{titulo}</h5>
            <button type="button" className="btn-close" onClick={onCancelar}></button>
          </div>

          <div className="modal-body">
            <p className="mb-0">{mensaje}</p>
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onCancelar}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={onConfirmar}>
              Confirmar
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
