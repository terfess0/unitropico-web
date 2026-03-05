// Unitrópico Presentation Engine - Core Logic

// State
let currentSlideIndex = 0;
const slides = [
    // Placeholder initial slide to demonstrate structure
    {
        type: 'hero',
        title: 'Bienvenidos a Unitrópico',
        subtitle: 'Innovación, Ciencia y Biodiversidad',
        image: 'https://images.unsplash.com/photo-1562774053-701939374585?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80' // Placeholder nature/tech image
    },
    {
        type: 'manifesto',
        title: 'Nuestra Misión',
        content: 'Formar profesionales íntegros con criterios humanísticos, bioéticos, científicos e innovadores, comprometidos con la investigación y la proyección social.'
    },
    {
        type: 'portfolio',
        title: 'Áreas de Impacto',
        items: [
            { title: 'Investigación', desc: 'Grupos A1 en MinCiencias' },
            { title: 'Proyección Social', desc: 'Impacto en la Orinoquia' },
            { title: 'Docencia', desc: 'Calidad Académica Certificada' }
        ]
    },
    {
        type: 'dashboard',
        title: 'Indicadores Institucionales',
        subtitle: 'Consulta los datos académicos y financieros en tiempo real',
        kpis: [
            { icon: '🎓', value: '4,827', label: 'Estudiantes', delta: '+8%' },
            { icon: '🔬', value: '12', label: 'Grupos Invest.', delta: '+2' },
            { icon: '📄', value: '89', label: 'Publicaciones', delta: '+14%' },
            { icon: '🏆', value: '97%', label: 'Acreditación', delta: 'Meta' }
        ]
    },
    {
        type: 'detail',
        title: 'Campus Universitario',
        content: 'Un espacio diseñado para la convivencia con la naturaleza y el desarrollo académico de alto nivel.',
        image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80'
    },
    {
        type: 'contact',
        title: 'Contáctanos',
        email: 'info@unitropico.edu.co',
        phone: '+57 (8) 632 07 00'
    }
];

// DOM Elements
const slideContainer = document.getElementById('slide-container');
const currentSlideNum = document.getElementById('current-slide');
const totalSlidesNum = document.getElementById('total-slides');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

// Templates
const templates = {
    hero: (data) => `
        <div class="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
             <div class="absolute inset-0 z-0">
                <img src="${data.image}" alt="Background" class="w-full h-full object-cover opacity-20 scale-105 animate-fade-in">
                <div class="absolute inset-0 bg-gradient-to-t from-white via-transparent to-white"></div>
            </div>
            <div class="z-10 text-center max-w-4xl px-8">
                <h1 class="text-6xl md:text-7xl font-bold font-display text-unitropico-blue mb-6 tracking-tight animate-slide-up bg-clip-text text-transparent bg-gradient-to-r from-unitropico-blue to-unitropico-green">
                    ${data.title}
                </h1>
                <p class="text-xl md:text-2xl text-slate-600 font-light animate-slide-up delay-100">
                    ${data.subtitle}
                </p>
                <div class="mt-12 animate-slide-up delay-200">
                   <span class="inline-block w-16 h-1 bg-unitropico-green rounded-full"></span>
                </div>
            </div>
        </div>
    `,
    manifesto: (data) => `
        <div class="w-full h-full flex flex-col justify-center px-24 relative">
             <div class="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-unitropico-light to-transparent -z-10"></div>
            <h2 class="text-unitropico-green font-bold tracking-widest uppercase mb-8 text-sm animate-fade-in">Manifiesto</h2>
            <h1 class="text-5xl md:text-6xl font-display font-medium text-unitropico-blue leading-tight max-w-5xl animate-slide-up">
                "${data.title}"
            </h1>
            <p class="mt-8 text-2xl text-slate-500 font-light leading-relaxed max-w-4xl animate-slide-up delay-100 border-l-4 border-unitropico-green pl-6">
                ${data.content}
            </p>
        </div>
    `,
    portfolio: (data) => `
        <div class="w-full h-full flex flex-col justify-center px-16">
            <h2 class="text-4xl font-display font-bold text-unitropico-blue mb-12 animate-slide-in-right">${data.title}</h2>
            <div class="grid grid-cols-3 gap-8">
                ${data.items.map((item, index) => `
                    <div class="group p-8 bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:border-unitropico-green/30 transition-all duration-300 rounded-xl glass-card animate-slide-up" style="animation-delay: ${index * 100}ms">
                        <div class="w-12 h-12 mb-6 rounded-full bg-unitropico-light flex items-center justify-center text-unitropico-green group-hover:bg-unitropico-green group-hover:text-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                        </div>
                        <h3 class="text-xl font-bold text-slate-800 mb-2 group-hover:text-unitropico-blue transition-colors">${item.title}</h3>
                        <p class="text-slate-500 text-sm leading-relaxed">${item.desc}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `,
    detail: (data) => `
        <div class="w-full h-full flex">
            <div class="w-1/2 h-full relative overflow-hidden">
                <img src="${data.image}" class="absolute inset-0 w-full h-full object-cover animate-fade-in" alt="Detail">
                <div class="absolute inset-0 bg-unitropico-blue/10"></div>
            </div>
            <div class="w-1/2 h-full flex flex-col justify-center px-16 bg-white">
                <h2 class="text-4xl font-display font-bold text-unitropico-blue mb-6 animate-slide-in-right">${data.title}</h2>
                <div class="w-20 h-1 bg-gradient-to-r from-unitropico-green to-unitropico-blue mb-8 animate-slide-in-right delay-100"></div>
                <p class="text-lg text-slate-600 leading-relaxed animate-slide-up delay-200">
                    ${data.content}
                </p>
            </div>
        </div>
    `,
    contact: (data) => `
        <div class="w-full h-full flex flex-col items-center justify-center bg-unitropico-blue text-white relative overflow-hidden">
             <div class="absolute w-[200%] h-[200%] bg-gradient-to-br from-unitropico-green/20 to-transparent rounded-full -top-1/2 -left-1/2 animate-pulse"></div>
            <div class="z-10 text-center">
                <h2 class="text-5xl font-display font-bold mb-8 animate-slide-up">${data.title}</h2>
                <div class="space-y-4 text-xl font-light animate-slide-up delay-100">
                    <p class="flex items-center justify-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-unitropico-green">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                        </svg>
                        ${data.email}
                    </p>
                    <p class="flex items-center justify-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-unitropico-green">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                        </svg>
                        ${data.phone}
                    </p>
                </div>
                <div class="mt-12 opacity-50 text-sm">Unitrópico © 2026</div>
            </div>
        </div>
    `,
    dashboard: (data) => `
        <div class="w-full h-full flex relative overflow-hidden bg-gradient-to-br from-unitropico-blue via-[#003b7a] to-[#001a3d]">
            <!-- Animated background blobs -->
            <div class="absolute -top-20 -right-20 w-96 h-96 bg-unitropico-green/10 rounded-full blur-3xl animate-pulse"></div>
            <div class="absolute -bottom-20 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
            
            <!-- Left content -->
            <div class="w-1/2 h-full flex flex-col justify-center px-16 z-10">
                <span class="text-unitropico-green text-xs font-bold tracking-widest uppercase mb-6 animate-fade-in">Dashboard Institucional</span>
                <h1 class="text-4xl font-display font-bold text-white leading-tight mb-4 animate-slide-up">${data.title}</h1>
                <p class="text-white/60 text-lg font-light leading-relaxed mb-10 animate-slide-up delay-100">${data.subtitle}</p>
                
                <!-- KPI preview row -->
                <div class="grid grid-cols-2 gap-4 mb-10">
                    ${data.kpis.map((k, i) => `
                        <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 animate-slide-up" style="animation-delay:${i * 80}ms">
                            <div class="text-2xl mb-1">${k.icon}</div>
                            <div class="text-2xl font-bold text-white">${k.value}</div>
                            <div class="text-white/50 text-xs mt-1">${k.label}</div>
                            <div class="mt-2 text-unitropico-green text-xs font-semibold">${k.delta}</div>
                        </div>
                    `).join('')}
                </div>
                
                <!-- CTA Button -->
                <a href="dashboard.html" target="_blank"
                   class="inline-flex items-center gap-3 bg-unitropico-green text-white font-bold text-sm px-8 py-4 rounded-full hover:bg-white hover:text-unitropico-blue transition-all duration-300 shadow-lg shadow-unitropico-green/30 w-fit animate-slide-up delay-200">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
                    Ver Dashboard Completo
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
                </a>
            </div>
            
            <!-- Right — mini dashboard preview mockup -->
            <div class="w-1/2 h-full flex items-center justify-center z-10 pr-12">
                <div class="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-6 w-full max-w-xs">
                    <div class="text-white/70 text-xs font-semibold mb-4">Resumen Presupuestal</div>
                    <!-- Fake mini bars -->
                    <div class="flex items-end gap-2 h-24 mb-4">
                        <div class="flex-1 rounded-t-md bg-unitropico-green/60" style="height:50%"></div>
                        <div class="flex-1 rounded-t-md bg-white/30" style="height:70%"></div>
                        <div class="flex-1 rounded-t-md bg-white/30" style="height:45%"></div>
                        <div class="flex-1 rounded-t-md bg-unitropico-green" style="height:90%"></div>
                        <div class="flex-1 rounded-t-md bg-white/30" style="height:60%"></div>
                        <div class="flex-1 rounded-t-md bg-white/30" style="height:55%"></div>
                    </div>
                    <div class="flex justify-between text-white/40 text-xs mb-6"><span>Abr</span><span>May</span><span>Jun</span><span>Jul</span><span>Ago</span><span>Sep</span></div>
                    <div class="border-t border-white/10 pt-4">
                        <div class="text-white/50 text-xs">Total Ejecutado 2026</div>
                        <div class="text-white text-2xl font-bold mt-1">\$14.2 MM</div>
                        <div class="text-unitropico-green text-xs mt-1 font-semibold">↑ 23% vs 2025</div>
                    </div>
                </div>
            </div>
        </div>
    `
};

// Functions
function renderSlide(index) {
    if (index < 0 || index >= slides.length) return;

    const slideData = slides[index];
    const templateFn = templates[slideData.type];

    if (templateFn) {
        // Fade out slightly before changing? Or just hard switch with internal animation?
        // Let's doing content replacement. The CSS animations inside the templates will trigger.
        slideContainer.innerHTML = templateFn(slideData);

        // Update counters
        currentSlideNum.textContent = String(index + 1).padStart(2, '0');
        totalSlidesNum.textContent = String(slides.length).padStart(2, '0');

        // Update nav state
        prevBtn.disabled = index === 0;
        prevBtn.style.opacity = index === 0 ? '0.5' : '1';
        nextBtn.disabled = index === slides.length - 1;
        nextBtn.style.opacity = index === slides.length - 1 ? '0.5' : '1';
    }
}

function nextSlide() {
    if (currentSlideIndex < slides.length - 1) {
        currentSlideIndex++;
        renderSlide(currentSlideIndex);
    }
}

function prevSlide() {
    if (currentSlideIndex > 0) {
        currentSlideIndex--;
        renderSlide(currentSlideIndex);
    }
}

// Event Listeners
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ') {
        nextSlide();
    } else if (e.key === 'ArrowLeft') {
        prevSlide();
    }
});

nextBtn.addEventListener('click', nextSlide);
prevBtn.addEventListener('click', prevSlide);

// Init
renderSlide(currentSlideIndex);
