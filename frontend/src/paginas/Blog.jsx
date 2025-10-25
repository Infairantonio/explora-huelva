// src/paginas/Blog.jsx
// Blog estático con artículos de ejemplo.
// Solo Bootstrap + bootstrap-icons.

import { Link } from "react-router-dom";

const POSTS = [
  {
    slug: "senderismo-en-aracena",
    titulo: "Senderismo en la Sierra de Aracena: 5 rutas fáciles",
    fecha: "2025-09-28",
    autor: "Equipo Explora",
    extracto:
      "Descubre cinco rutas circulares perfectas para iniciarte, con miradores y castañares.",
    cover:
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=1200&auto=format&fit=crop",
    tags: ["rutas", "naturaleza", "familias"],
  },
  {
    slug: "playas-virgenes-costa",
    titulo: "Playas ‘casi vírgenes’ en la Costa de Huelva",
    fecha: "2025-08-12",
    autor: "Lola R.",
    extracto:
      "Nuestra selección de arenales tranquilos para escapar del bullicio sin perder servicios.",
    cover:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop",
    tags: ["playa", "verano"],
  },
  {
    slug: "gastronomia-imprescindible",
    titulo: "10 imprescindibles gastronómicos onubenses",
    fecha: "2025-07-01",
    autor: "Javi G.",
    extracto:
      "De la gamba blanca al jamón de Jabugo, pasando por guisos marineros y postres típicos.",
    cover:
      "https://images.unsplash.com/photo-1543353071-10c8ba85a904?q=80&w=1200&auto=format&fit=crop",
    tags: ["comida", "tradición"],
  },
];

export default function Blog() {
  const destacado = POSTS[0];
  const resto = POSTS.slice(1);

  const Tag = ({ text }) => (
    <span className="badge bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle me-1">
      #{text}
    </span>
  );

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h1 className="h4 mb-0">
          <i className="bi bi-journal-text me-2" />
          Blog
        </h1>
        <div className="text-muted small">
          Artículos y guías para exprimir Huelva al máximo.
        </div>
      </div>

      {/* Post destacado */}
      <div className="card border-0 shadow-sm overflow-hidden mb-4">
        <div className="row g-0">
          <div className="col-12 col-lg-6">
            <img
              src={destacado.cover}
              alt={destacado.titulo}
              className="img-fluid w-100 h-100 object-fit-cover"
              style={{ minHeight: 260 }}
            />
          </div>
          <div className="col-12 col-lg-6">
            <div className="card-body">
              <div className="text-uppercase small text-secondary mb-1">
                {new Date(destacado.fecha).toLocaleDateString()}
              </div>
              <h2 className="h5">{destacado.titulo}</h2>
              <p className="text-muted">{destacado.extracto}</p>
              <div className="mb-2">
                {destacado.tags.map((t) => (
                  <Tag key={t} text={t} />
                ))}
              </div>
              {/* Enlace “leer más” (de momento ancla local/placeholder) */}
              <a className="btn btn-primary btn-sm" href={`#${destacado.slug}`}>
                Leer más
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Resto de posts */}
      <div className="row g-3">
        {resto.map((p) => (
          <div key={p.slug} className="col-12 col-md-6 col-lg-4">
            <article className="card border-0 shadow-sm h-100">
              <img
                src={p.cover}
                alt={p.titulo}
                className="card-img-top"
                style={{ height: 160, objectFit: "cover" }}
              />
              <div className="card-body d-flex flex-column">
                <div className="text-uppercase small text-secondary mb-1">
                  {new Date(p.fecha).toLocaleDateString()}
                </div>
                <h3 className="h6">{p.titulo}</h3>
                <p className="text-muted small flex-grow-1">{p.extracto}</p>
                <div className="mb-2">
                  {p.tags.map((t) => (
                    <Tag key={t} text={t} />
                  ))}
                </div>
                <a className="btn btn-outline-primary btn-sm mt-auto" href={`#${p.slug}`}>
                  Leer artículo
                </a>
              </div>
            </article>
          </div>
        ))}
      </div>

      {/* CTA inferior */}
      <div className="alert alert-secondary-subtle border mt-4">
        ¿Te gustaría colaborar? Escríbenos y cuéntanos tu ruta favorita.
        <Link to="/sobre" className="ms-2">
          Conoce el proyecto →
        </Link>
      </div>
    </div>
  );
}
