import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { conditions } from '../data/conditions';
import './QualityConditions.css';

const QualityConditions: React.FC = () => {
    const mainRef = useRef<HTMLElement>(null);
    const [orbitScale, setOrbitScale] = useState(0.8);

    // Scroll to top & handle responsive scale
    useEffect(() => {
        window.scrollTo(0, 0);

        const updateScale = () => {
            // ~180px buffer for title, back button, logo and padding
            const availableHeight = window.innerHeight - 180;
            // Calculate scale needed to fit 1000px container, max 0.95, min 0.4
            const newScale = Math.min(0.95, Math.max(0.4, availableHeight / 1000));
            setOrbitScale(newScale);
        };

        updateScale(); // Initial call
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, []);

    // Handle Navbar visibility on scroll
    useEffect(() => {
        const mainElement = mainRef.current;
        const navbar = document.querySelector('nav');

        if (!mainElement || !navbar) return;

        navbar.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';

        const handleScroll = () => {
            const scrollTop = mainElement.scrollTop;
            const threshold = window.innerHeight * 0.1;

            if (scrollTop > threshold) {
                navbar.style.transform = 'translateY(-100%)';
            } else {
                navbar.style.transform = 'translateY(0)';
            }
        };

        mainElement.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            mainElement.removeEventListener('scroll', handleScroll);
            navbar.style.transform = '';
            navbar.style.transition = '';
        };
    }, []);

    const getTitle = (id: string) => conditions.find(c => c.id === id)?.title || '';

    return (
        <main ref={mainRef} className="fixed inset-0 z-40 h-screen w-full overflow-y-auto light-grid-bg font-montserrat scroll-smooth" style={{ color: '#00594E' }}>

            {/* ── Back Button (fixed, top-left) ── */}
            <Link to="/" className="fixed top-6 left-8 z-50 flex items-center gap-2 hover:translate-x-[-4px] transition-transform duration-200">
                <span className="material-symbols-outlined text-verde-1 !text-2xl font-bold">arrow_back</span>
                <span className="subtitulo text-verde-1 !text-lg tracking-wide uppercase">Volver</span>
            </Link>

            {/* ── Logo top-right (fixed, always visible) ── */}
            <div className="fixed top-4 right-6 z-50 pointer-events-none">
                <img
                    src="/img/logo_unitropico.png"
                    alt="Logo Unitrópico"
                    className="h-16 md:h-20 lg:h-24 w-auto object-contain opacity-90"
                />
            </div>

            {/* ── Persisten Background Image ── */}
            <div className="fixed inset-0 z-0 bg-white">
                <img
                    src="/img/background-1.jpg"
                    alt="AI Pattern Background"
                    className="w-full h-full object-cover opacity-40 mix-blend-multiply"
                />

                {/* Institutional Glows */}
                <div className="absolute inset-0 opacity-40"
                    style={{ background: 'radial-gradient(circle at 15% 15%, rgba(181, 161, 96, 0.2) 0%, transparent 50%)' }}></div>
                <div className="absolute inset-0 opacity-30"
                    style={{ background: 'radial-gradient(circle at 85% 85%, rgba(0, 89, 78, 0.15) 0%, transparent 50%)' }}></div>

                {/* Decorative Elements */}
                <div className="absolute top-1/2 left-1/2 w-[1100px] h-[1100px] rounded-full animate-spin-slow pointer-events-none opacity-20"
                    style={{ border: 'none', transform: 'translate(-50%, -50%)' }}></div>
                <div className="absolute top-1/2 left-1/2 w-[900px] h-[900px] rounded-full animate-spin-reverse border-dashed pointer-events-none opacity-20"
                    style={{ border: 'none', transform: 'translate(-50%, -50%)' }}></div>
            </div>

            {/* MAIN SECTION: Title + Full Orbit */}
            <section className="relative w-full min-h-screen flex flex-col items-center justify-start lg:pt-16 z-10 overflow-x-hidden">

                <div className="text-center relative z-20 max-w-4xl mx-auto">
                    <h1 className="text-5xl font-montserrat font-black tracking-tighter drop-shadow-sm mb-1" style={{ color: '#00594E' }}>
                        CONDICIONES DE <span style={{ color: '#B5A160' }}>CALIDAD</span>
                    </h1>
                    <h2 className="text-2xl font-montserrat font-black tracking-tight mb-2 opacity-90" style={{ color: '#00594E' }}>
                        INGENIERÍA EN INTELIGENCIA ARTIFICIAL
                    </h2>
                    <div className="mx-auto w-24 h-[3px] rounded-full" style={{ backgroundColor: '#B5A160' }}></div>
                </div>

                <div className="orbit-container hidden lg:block origin-top transition-transform duration-300" style={{ transform: `scale(${orbitScale})` }}>

                    {/* Center core */}
                    <Link to="/" className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full flex flex-col items-center justify-center z-10 core-shadow overflow-hidden hover:scale-105 transition-transform duration-300"
                        style={{ backgroundColor: '#ffffff', border: '1px solid #CCDEDC' }}>
                        <div className="absolute inset-0 z-0" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #F0ECDF 100%)', opacity: 0.8 }}></div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                            <span className="material-symbols-outlined text-6xl mb-2" style={{ color: '#00594E' }}>hub</span>
                            <span className="text-center text-xs font-montserrat font-black tracking-widest" style={{ color: '#00594E' }}>INGENIERÍA EN INTELIGENCIA ARTIFICIAL</span>
                            <div className="mt-4 w-16 h-0.5" style={{ backgroundColor: '#B5A160' }}></div>
                        </div>
                    </Link>

                    {/* Orbit ring decorations */}
                    <div className="absolute top-1/2 left-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
                        style={{ border: '1px solid rgba(0, 89, 78, 0.1)', transform: 'translate(-50%, -50%)' }}></div>
                    <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] rounded-full pointer-events-none border-dashed"
                        style={{ border: '1px dashed rgba(0, 89, 78, 0.1)', transform: 'translate(-50%, -50%)' }}></div>

                    {/* ── Orbit cards — each with its own explicit pos-N class ── */}
                    <Link className="orbit-item pos-1 group w-56" to="/quality-conditions/01">
                        <div className="relative bg-white p-6 rounded-lg hover:bg-[#00594E] hover:text-white transition-all duration-300 elegant-shadow group-hover:shadow-xl group-hover:-translate-y-1 h-44 flex flex-col justify-center" style={{ border: '1px solid #CCDEDC' }}>
                            <div className="absolute -top-6 -left-6 text-white text-3xl font-black w-14 h-14 flex items-center justify-center rounded-full font-montserrat z-20 shadow-md" style={{ backgroundColor: '#B5A160', border: '2px solid #fff' }}>01</div>
                            <div className="flex flex-col items-center text-center">
                                <span className="material-symbols-outlined text-3xl mb-2 text-[#00594E] group-hover:text-white group-hover:scale-110 transition-transform">description</span>
                                <h3 className="text-lg font-montserrat font-black text-gray-800 group-hover:text-white leading-tight">{getTitle('01')}</h3>
                                <div className="h-0.5 w-8 group-hover:w-full transition-all duration-500 mt-3" style={{ backgroundColor: '#CCDEDC' }}></div>
                            </div>
                        </div>
                    </Link>

                    <Link className="orbit-item pos-2 group w-56" to="/quality-conditions/02">
                        <div className="relative bg-white p-6 rounded-lg hover:bg-[#00594E] hover:text-white transition-all duration-300 elegant-shadow group-hover:shadow-xl group-hover:-translate-y-1 h-44 flex flex-col justify-center" style={{ border: '1px solid #CCDEDC' }}>
                            <div className="absolute -top-6 -left-6 text-white text-3xl font-black w-14 h-14 flex items-center justify-center rounded-full font-montserrat z-20 shadow-md" style={{ backgroundColor: '#B5A160', border: '2px solid #fff' }}>02</div>
                            <div className="flex flex-col items-center text-center">
                                <span className="material-symbols-outlined text-3xl mb-2 text-[#00594E] group-hover:text-white group-hover:scale-110 transition-transform">lightbulb</span>
                                <h3 className="text-lg font-montserrat font-black text-gray-800 group-hover:text-white leading-tight">{getTitle('02')}</h3>
                                <div className="h-0.5 w-8 group-hover:w-full transition-all duration-500 mt-3" style={{ backgroundColor: '#CCDEDC' }}></div>
                            </div>
                        </div>
                    </Link>

                    <Link className="orbit-item pos-3 group w-56" to="/quality-conditions/03">
                        <div className="relative bg-white p-6 rounded-lg hover:bg-[#00594E] hover:text-white transition-all duration-300 elegant-shadow group-hover:shadow-xl group-hover:-translate-y-1 h-44 flex flex-col justify-center" style={{ border: '1px solid #CCDEDC' }}>
                            <div className="absolute -top-6 -left-6 text-white text-3xl font-black w-14 h-14 flex items-center justify-center rounded-full font-montserrat z-20 shadow-md" style={{ backgroundColor: '#B5A160', border: '2px solid #fff' }}>03</div>
                            <div className="flex flex-col items-center text-center">
                                <span className="material-symbols-outlined text-3xl mb-2 text-[#00594E] group-hover:text-white group-hover:scale-110 transition-transform">school</span>
                                <h3 className="text-lg font-montserrat font-black text-gray-800 group-hover:text-white leading-tight">{getTitle('03')}</h3>
                                <div className="h-0.5 w-8 group-hover:w-full transition-all duration-500 mt-3" style={{ backgroundColor: '#CCDEDC' }}></div>
                            </div>
                        </div>
                    </Link>

                    <Link className="orbit-item pos-4 group w-56" to="/quality-conditions/04">
                        <div className="relative bg-white p-6 rounded-lg hover:bg-[#00594E] hover:text-white transition-all duration-300 elegant-shadow group-hover:shadow-xl group-hover:-translate-y-1 h-44 flex flex-col justify-center" style={{ border: '1px solid #CCDEDC' }}>
                            <div className="absolute -top-6 -left-6 text-white text-3xl font-black w-14 h-14 flex items-center justify-center rounded-full font-montserrat z-20 shadow-md" style={{ backgroundColor: '#B5A160', border: '2px solid #fff' }}>04</div>
                            <div className="flex flex-col items-center text-center">
                                <span className="material-symbols-outlined text-3xl mb-2 text-[#00594E] group-hover:text-white group-hover:scale-110 transition-transform">calendar_month</span>
                                <h3 className="text-lg font-montserrat font-black text-gray-800 group-hover:text-white leading-tight">{getTitle('04')}</h3>
                                <div className="h-0.5 w-8 group-hover:w-full transition-all duration-500 mt-3" style={{ backgroundColor: '#CCDEDC' }}></div>
                            </div>
                        </div>
                    </Link>

                    <Link className="orbit-item pos-5 group w-56" to="/quality-conditions/05">
                        <div className="relative bg-white p-6 rounded-lg hover:bg-[#00594E] hover:text-white transition-all duration-300 elegant-shadow group-hover:shadow-xl group-hover:-translate-y-1 h-44 flex flex-col justify-center" style={{ border: '1px solid #CCDEDC' }}>
                            <div className="absolute -top-6 -left-6 text-white text-3xl font-black w-14 h-14 flex items-center justify-center rounded-full font-montserrat z-20 shadow-md" style={{ backgroundColor: '#B5A160', border: '2px solid #fff' }}>05</div>
                            <div className="flex flex-col items-center text-center">
                                <span className="material-symbols-outlined text-3xl mb-2 text-[#00594E] group-hover:text-white group-hover:scale-110 transition-transform">biotech</span>
                                <h3 className="text-lg font-montserrat font-black text-gray-800 group-hover:text-white leading-tight">{getTitle('05')}</h3>
                                <div className="h-0.5 w-8 group-hover:w-full transition-all duration-500 mt-3" style={{ backgroundColor: '#CCDEDC' }}></div>
                            </div>
                        </div>
                    </Link>

                    <Link className="orbit-item pos-6 group w-56" to="/quality-conditions/06">
                        <div className="relative bg-white p-6 rounded-lg hover:bg-[#00594E] hover:text-white transition-all duration-300 elegant-shadow group-hover:shadow-xl group-hover:-translate-y-1 h-44 flex flex-col justify-center" style={{ border: '1px solid #CCDEDC' }}>
                            <div className="absolute -top-6 -left-6 text-white text-3xl font-black w-14 h-14 flex items-center justify-center rounded-full font-montserrat z-20 shadow-md" style={{ backgroundColor: '#B5A160', border: '2px solid #fff' }}>06</div>
                            <div className="flex flex-col items-center text-center">
                                <span className="material-symbols-outlined text-3xl mb-2 text-[#00594E] group-hover:text-white group-hover:scale-110 transition-transform">handshake</span>
                                <h3 className="text-lg font-montserrat font-black text-gray-800 group-hover:text-white leading-tight">{getTitle('06')}</h3>
                                <div className="h-0.5 w-8 group-hover:w-full transition-all duration-500 mt-3" style={{ backgroundColor: '#CCDEDC' }}></div>
                            </div>
                        </div>
                    </Link>

                    <Link className="orbit-item pos-7 group w-56" to="/quality-conditions/07">
                        <div className="relative bg-white p-6 rounded-lg hover:bg-[#00594E] hover:text-white transition-all duration-300 elegant-shadow group-hover:shadow-xl group-hover:-translate-y-1 h-44 flex flex-col justify-center" style={{ border: '1px solid #CCDEDC' }}>
                            <div className="absolute -top-6 -left-6 text-white text-3xl font-black w-14 h-14 flex items-center justify-center rounded-full font-montserrat z-20 shadow-md" style={{ backgroundColor: '#B5A160', border: '2px solid #fff' }}>07</div>
                            <div className="flex flex-col items-center text-center">
                                <span className="material-symbols-outlined text-3xl mb-2 text-[#00594E] group-hover:text-white group-hover:scale-110 transition-transform">groups</span>
                                <h3 className="text-lg font-montserrat font-black text-gray-800 group-hover:text-white leading-tight">{getTitle('07')}</h3>
                                <div className="h-0.5 w-8 group-hover:w-full transition-all duration-500 mt-3" style={{ backgroundColor: '#CCDEDC' }}></div>
                            </div>
                        </div>
                    </Link>

                    <Link className="orbit-item pos-8 group w-56" to="/quality-conditions/08">
                        <div className="relative bg-white p-6 rounded-lg hover:bg-[#00594E] hover:text-white transition-all duration-300 elegant-shadow group-hover:shadow-xl group-hover:-translate-y-1 h-44 flex flex-col justify-center" style={{ border: '1px solid #CCDEDC' }}>
                            <div className="absolute -top-6 -left-6 text-white text-3xl font-black w-14 h-14 flex items-center justify-center rounded-full font-montserrat z-20 shadow-md" style={{ backgroundColor: '#B5A160', border: '2px solid #fff' }}>08</div>
                            <div className="flex flex-col items-center text-center">
                                <span className="material-symbols-outlined text-3xl mb-2 text-[#00594E] group-hover:text-white group-hover:scale-110 transition-transform">computer</span>
                                <h3 className="text-lg font-montserrat font-black text-gray-800 group-hover:text-white leading-tight">{getTitle('08')}</h3>
                                <div className="h-0.5 w-8 group-hover:w-full transition-all duration-500 mt-3" style={{ backgroundColor: '#CCDEDC' }}></div>
                            </div>
                        </div>
                    </Link>

                    <Link className="orbit-item pos-9 group w-56" to="/quality-conditions/09">
                        <div className="relative bg-white p-6 rounded-lg hover:bg-[#00594E] hover:text-white transition-all duration-300 elegant-shadow group-hover:shadow-xl group-hover:-translate-y-1 h-44 flex flex-col justify-center" style={{ border: '1px solid #CCDEDC' }}>
                            <div className="absolute -top-6 -left-6 text-white text-3xl font-black w-14 h-14 flex items-center justify-center rounded-full font-montserrat z-20 shadow-md" style={{ backgroundColor: '#B5A160', border: '2px solid #fff' }}>09</div>
                            <div className="flex flex-col items-center text-center">
                                <span className="material-symbols-outlined text-3xl mb-2 text-[#00594E] group-hover:text-white group-hover:scale-110 transition-transform">apartment</span>
                                <h3 className="text-lg font-montserrat font-black text-gray-800 group-hover:text-white leading-tight">{getTitle('09')}</h3>
                                <div className="h-0.5 w-8 group-hover:w-full transition-all duration-500 mt-3" style={{ backgroundColor: '#CCDEDC' }}></div>
                            </div>
                        </div>
                    </Link>

                </div>

                {/* Mobile grid */}
                <div className="lg:hidden w-full px-6 grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pb-32">
                    {conditions.map((item) => (
                        <Link key={item.id} className="block p-6 rounded-xl transition-all duration-300" style={{ backgroundColor: '#ffffff', border: '1px solid #CCDEDC', boxShadow: '0 2px 12px rgba(0,89,78,0.08)' }} to={`/quality-conditions/${item.id}`}>
                            <div className="flex items-center gap-4">
                                <span className="font-montserrat font-black text-4xl" style={{ color: '#B5A160' }}>{item.id}</span>
                                <h3 className="font-montserrat font-bold" style={{ color: '#00594E' }}>{item.title}</h3>
                            </div>
                        </Link>
                    ))}
                </div>

            </section>
        </main>
    );
};

export default QualityConditions;
