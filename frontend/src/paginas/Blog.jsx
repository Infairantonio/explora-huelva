// src/paginas/Blog.jsx
// Blog sencillo con dos artículos separados.
// Imágenes en frontend/public/blog

import React from "react";

export default function Blog() {
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
      {/* CABECERA */}
      <header className="mb-4">
        <h1 className="h4 fw-bold mb-1">
          <i className="bi bi-journal-text me-2" />
          Blog · Guías de Huelva
        </h1>
        <p className="text-muted mb-0">
          Artículos sencillos sobre lugares destacados de Huelva.
        </p>
      </header>

      {/* ARTÍCULO 1 — CUESTA MANELI */}
      <Articulo
        id="cuesta-maneli"
        titulo="Cuesta Maneli: un tesoro natural entre dunas y océano"
        fecha="2025-11-01"
        autor="Equipo Explora"
        cover="/blog/cuestamaneli.jpg"   // 👈 OJO AQUÍ
        tags={["playa", "naturaleza", "rutas"]}
      >
        Cuesta Maneli es una de las playas más especiales de la provincia de
        Huelva. El acceso se realiza por una pasarela de madera que cruza
        pinares, acantilados y dunas fósiles antes de abrirse al Atlántico.
        <br />
        <br />
        Es un lugar perfecto para desconectar: no hay urbanizaciones,
        chiringuitos ni ruidos. Solo el sonido del mar y el viento sobre la
        madera.
        <br />
        <br />
        Ideal para paseos largos, fotografías al atardecer y disfrutar de una
        playa verdaderamente natural.
      </Articulo>

      {/* ARTÍCULO 2 — PLAYAS DE HUELVA */}
      <Articulo
        id="playas-huelva"
        titulo="Playas de Huelva: luz, espacio y atardeceres infinitos"
        fecha="2025-11-01"
        autor="Equipo Explora"
        cover="/blog/playas.jpg"        // 👈 Y AQUÍ
        tags={["costa", "verano", "paisaje"]}
      >
        La costa de Huelva ofrece kilómetros de arena fina, mar abierto y mucha
        tranquilidad incluso en temporada alta.
        <br />
        <br />
        Desde playas familiares como Punta Umbría o Islantilla hasta espacios
        más naturales como el Asperillo o Mazagón, todas comparten una
        característica: la luz.
        <br />
        <br />
        Los atardeceres son uno de los mayores regalos de esta costa, pintando
        el cielo de tonos naranjas y rosados que convierten cada visita en un
        momento especial.
      </Articulo>

      {/* CTA final */}
      <div className="alert alert-secondary-subtle border mt-4">
        ¿Quieres compartir tus propias experiencias en Huelva?
        <span className="ms-2">
          Guarda tus lugares favoritos en tu panel.
        </span>
      </div>
    </main>
  );
}
