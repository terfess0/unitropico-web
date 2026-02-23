import React from 'react';
import { Link } from 'react-router-dom';
import { extraSections } from '../data/conditions';

const Home: React.FC = () => {
  return (
    <main className="flex-grow relative overflow-hidden flex flex-col min-h-[calc(100vh-5rem)] font-montserrat">

      {/* Subtle top accent bar */}
      <div className="absolute top-0 right-0 w-1/3 h-[3px] z-20" style={{ backgroundColor: '#B5A160' }}></div>

      {/* ── Persisten Background Image Layer ── */}
      <div className="absolute inset-0 z-0 bg-white">
        <img
          src="/img/background-1.jpg"
          alt=""
          className="w-full h-full object-cover opacity-50 mix-blend-multiply"
        />

        {/* Institutional Glows */}
        <div className="absolute inset-0 opacity-20"
          style={{ background: 'radial-gradient(circle at 15% 15%, rgba(181, 161, 96, 0.1) 0%, transparent 50%)' }}></div>
      </div>

      {/* ── Lateral Image layer (lateral.webp fades on the right) ── */}
      <div className="absolute inset-0 z-0">
        <img
          src="/img/lateral.webp"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover object-left animate-pulse-subtle origin-left opacity-90"
        />
        {/* Right-side fade (Enhanced transparency to show background-1) */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to right, transparent 20%, rgba(255,255,255,0.4) 40%, rgba(255,255,255,0.7) 75%)' }}>
        </div>
      </div>

      {/* ── Content layer ── */}
      <div className="relative z-10 w-full flex flex-col lg:flex-row flex-grow">

        {/* Left spacer — lets the image show through on desktop */}
        <div className="hidden lg:block lg:w-[52%] flex-shrink-0" />

        {/* ── Right: Content panel ── */}
        <div className="w-full lg:w-[48%] flex flex-col justify-center px-8 py-6 lg:px-14 xl:px-20">

          {/* Faculty label */}
          <div className="hidden lg:block">
            <p className="font-semibold subtitulo tracking-wide font-montserrat" style={{ color: '#00594E' }}>
              Facultad de Ingenierías
            </p>
            <div className="h-[3px] w-16 rounded-full" style={{ backgroundColor: '#B5A160' }}></div>
          </div>

          {/* Mobile faculty label */}
          <div className="mb-2 lg:hidden">
            <p className="font-semibold text-base tracking-wide font-montserrat" style={{ color: '#00594E' }}>
              Facultad de Ingenierías
            </p>
            <div className="h-[3px] w-12 rounded-full mt-1" style={{ backgroundColor: '#B5A160' }}></div>
          </div>

          {/* Year badge + Title */}
          <div className="flex flex-row items-center gap-5 mb-2">
            {/* Badge */}
            <div
              className="flex-shrink-0 flex items-center justify-center px-5 py-4 rounded shadow-lg hover:-translate-y-1 transition-transform cursor-default"
              style={{ backgroundColor: '#B5A160' }}
            >
              <span className="text-white text-2xl font-black tracking-wider font-montserrat">2026</span>
            </div>

            {/* Divider */}
            <div className="w-px h-14 flex-shrink-0" style={{ backgroundColor: '#CCDEDC' }}></div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl xl:text-5xl font-black leading-tight font-montserrat" style={{ color: '#00594E' }}>
              INGENIERÍA EN<br />
              <span style={{ color: '#347B72' }}>INTELIGENCIA</span><br />
              <span className="text-gray-800">ARTIFICIAL</span>
            </h1>
          </div>

          {/* Description */}
          <p className="subtitulo leading-relaxed mb-2 max-w-sm"
            style={{ color: '#347B72' }}>
            Fórmate como líder en la revolución tecnológica. Diseña, implementa y gestiona sistemas
            inteligentes que transformarán el futuro de la industria y la sociedad en la Orinoquia y el mundo.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 mb-2">
            <Link
              to="/quality-conditions"
              className="flex items-center gap-2 px-6 py-3 rounded font-semibold font-montserrat border-2 transition-all duration-200 hover:text-white"
              style={{ borderColor: '#B5A160', color: '#B5A160' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = '#B5A160'; el.style.color = '#fff'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = 'transparent'; el.style.color = '#B5A160'; }}
            >
              <span className="subtitulo">Condiciones de Calidad</span>
            </Link>
            <Link
              to="/institutional-context"
              className="flex items-center gap-2 px-6 py-3 rounded font-semibold font-montserrat border-2 transition-all duration-200 hover:text-white"
              style={{ borderColor: '#00594E', color: '#00594E' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = '#00594E'; el.style.color = '#fff'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = 'transparent'; el.style.color = '#00594E'; }}
            >
              <span className="subtitulo">{extraSections.find(s => s.id === '10')?.title || 'Agenda del Programa'}</span>
            </Link>
            {/* <Link
              to="/editor"
              className="flex items-center gap-2 px-6 py-3 rounded font-medium font-montserrat border-2 transition-all duration-200"
              style={{ borderColor: '#9ABDB8', color: '#679C95' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = '#679C95'; el.style.color = '#fff'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = 'transparent'; el.style.color = '#679C95'; }}
            >
              <span>Editor MVP</span>
            </Link> */}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-6 pt-8" style={{ borderTop: '1px solid #CCDEDC' }}>
            <div className="flex flex-col cursor-default">
              <span className="subtitulo font-black font-montserrat" style={{ color: '#B5A160' }}>9</span>
              <span className="subtitulo uppercase tracking-widest font-bold font-montserrat mt-0.5" style={{ color: '#679C95' }}>Semestres</span>
            </div>
            <div className="flex flex-col cursor-default">
              <span className="subtitulo font-black font-montserrat" style={{ color: '#B5A160' }}>Presencial</span>
              <span className="subtitulo uppercase tracking-widest font-bold font-montserrat mt-0.5" style={{ color: '#679C95' }}>Modalidad</span>
            </div>
            <div className="flex flex-col cursor-default">
              <span className="subtitulo font-black font-montserrat" style={{ color: '#B5A160' }}>Yopal</span>
              <span className="subtitulo uppercase tracking-widest font-bold font-montserrat mt-0.5" style={{ color: '#679C95' }}>Sede</span>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
};

export default Home;