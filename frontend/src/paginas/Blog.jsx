// src/paginas/Blog.jsx
// Página de blog con artículos breves y fotos locales.

import React from "react";

export default function Blog() {
  // Componente reutilizable para cada artículo del blog
  const Articulo = ({ id, titulo, fecha, autor, cover, children, tags }) => (
    <article
      id={id}
      className="card border-0 shadow-sm overflow-hidden mb-4"
      aria-labelledby={`${id}-titulo`}
    >
      <img
        src={cover}
        alt={titulo}
        className="w-100"
        style={{ maxHeight: 260, objectFit: "cover" }}
      />

      <div className="card-body">
        <div className="text-uppercase small text-secondary mb-1">
          {new Date(fecha).toLocaleDateString()} · {autor}
        </div>

        <h2 id={`${id}-titulo`} className="h5 fw-bold mb-3">
          {titulo}
        </h2>

        <div className="mb-3 text-muted">{children}</div>

        {/* Etiquetas del artículo */}
        <div className="mb-2">
          {tags.map((t) => (
            <span
              key={t}
              className="badge bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle me-1"
            >
              #{t}
            </span>
          ))}
        </div>
      </div>
    </article>
  );

  return (
    <main className="container py-4" role="main">
      {/* Cabecera simple */}
      <header className="mb-4">
        <h1 className="h4 fw-bold mb-1">
          <i className="bi bi-journal-text me-2" />
          Blog · Guías de Huelva
        </h1>
        <p className="text-muted mb-0">
          Artículos breves sobre lugares destacados de la provincia.
        </p>
      </header>

      {/* Artículo 1 */}
      <Articulo
        id="cuesta-maneli"
        titulo="Cuesta Maneli: un tesoro natural entre dunas y océano"
        fecha="2025-11-01"
        autor="Equipo Explora"
        cover="/blog/cuestamaneli.jpg"
        tags={["playa", "naturaleza", "rutas"]}
      >
        Cuesta Maneli es una de las playas más especiales de la provincia de
        Huelva. El acceso se realiza por una pasarela de madera que cruza
        pinares, acantilados y dunas fósiles antes de abrirse al Atlántico.
        <br />
        <br />
        Es un lugar perfecto para desconectar: sin urbanizaciones ni ruidos,
        solo el mar y el viento.
        <br />
        <br />
        Ideal para paseos largos, fotografías al atardecer y disfrutar de una
        playa totalmente natural.
      </Articulo>

      {/* Artículo 2 */}
      <Articulo
        id="playas-huelva"
        titulo="Playas de Huelva: luz, espacio y atardeceres infinitos"
        fecha="2025-11-01"
        autor="Equipo Explora"
        cover="/blog/playas.jpg"
        tags={["costa", "verano", "paisaje"]}
      >
        La costa de Huelva ofrece kilómetros de arena fina y mar abierto, con
        mucha tranquilidad incluso en temporada alta.
        <br />
        <br />
        Desde Punta Umbría o Islantilla hasta Mazagón o el Asperillo, todas las
        playas destacan por su luz única.
        <br />
        <br />
        Sus atardeceres, de tonos naranjas y rosados, convierten cada visita en
        un momento especial.
      </Articulo>

      {/* Mensaje final */}
      <div className="alert alert-secondary-subtle border mt-4">
        ¿Quieres compartir tus propias experiencias?
        <span className="ms-2">Guarda tus lugares favoritos en tu panel.</span>
      </div>
    </main>
  );
}
