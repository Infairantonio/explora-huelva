// src/paginas/Mapa.jsx
// Mapa general de Huelva.  
// De momento es un iframe público a Google Maps.  
// Futuro: mostrar aquí los lugares guardados del usuario.

export default function Mapa() {
  return (
    <div className="container py-4">
      <h1 className="h4 mb-3">
        <i className="bi bi-map me-2"></i>
        Mapa general de Huelva
      </h1>

      {/* Contenedor del mapa */}
      <div className="rounded shadow-sm overflow-hidden">
        <iframe
          title="Mapa principal"
          loading="lazy"
          style={{ width: "100%", height: "75vh", border: 0 }}
          src="https://maps.google.com/maps?q=Huelva&t=&z=10&ie=UTF8&iwloc=&output=embed"
        />
      </div>

      {/* Nota informativa */}
      <p className="text-muted small mt-2">
        Vista general de la provincia. Muy pronto podrás ver aquí tus lugares guardados.
      </p>
    </div>
  );
}
