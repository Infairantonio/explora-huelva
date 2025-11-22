export default function Mapa() {
  return (
    <div className="container py-4">
      <h1 className="h4 mb-3">
        <i className="bi bi-map me-2"></i>
        Mapa general de Huelva
      </h1>

      <div className="rounded shadow-sm overflow-hidden">
        <iframe
          title="Mapa principal"
          loading="lazy"
          style={{ width: "100%", height: "75vh", border: 0 }}
          src="https://maps.google.com/maps?q=Huelva&t=&z=10&ie=UTF8&iwloc=&output=embed"
        />
      </div>

      <p className="text-muted small mt-2">
        Vista general de la provincia. Muy pronto podrás ver tus lugares guardados aquí.
      </p>
    </div>
  );
}
