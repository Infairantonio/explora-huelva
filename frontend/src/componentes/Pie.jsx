// Componente de pie de página (Footer)
// Usa utilidades de Bootstrap y calcula el año actual dinámicamente.
export default function Pie() {
  return (
    // <footer> con un borde superior, padding vertical y `mt-auto`
    // `mt-auto` empuja el footer al final de la página cuando el contenido es corto
    <footer className="border-top py-3 mt-auto">
      {/* Contenedor Bootstrap para centrar y limitar ancho */}
      {/* `small` hace el texto más pequeño, `text-center` lo centra horizontalmente */}
      {/* OJO: si quieres el texto BLANCO, cambia `text-muted` -> `text-white` */}
      <div className="container small text-muted text-center">
        {/* Año actual generado en el cliente */}
        © {new Date().getFullYear()} Explora Huelva
      </div>
    </footer>
  );
}
