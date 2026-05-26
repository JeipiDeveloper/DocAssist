(function(){
    const API_BASE = 'http://localhost:3000';
    const track = document.getElementById('carouselTrack');
    const dots = document.getElementById('carouselDots');
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');

    if(!track || !dots || !prevBtn || !nextBtn) return;

    let currentIndex = 0;
    let timerId = null;

    function formatDate(value){
        if(!value) return 'Data indisponível';
        const date = new Date(value);
        if(Number.isNaN(date.getTime())) return 'Data indisponível';
        return date.toLocaleString('pt-BR');
    }

    function buildSlide(item){
        const summary = item.processing
            ? 'Resumo em processamento...'
            : (item.summary || 'Resumo ainda não disponível.');

        const slide = document.createElement('div');
        slide.className = 'carousel-slide';

        slide.innerHTML = `
            <article class="carousel-card">
                <div>
                    <h3>${item.name || 'Documento PDF'}</h3>
                    <p class="carousel-copy">${summary}</p>

                    <div class="carousel-meta">
                        <i class="fa-regular fa-calendar"></i>
                        Enviado em ${formatDate(item.createdAt)}
                    </div>

                    <a class="carousel-link" href="chatbot.html?id=${item.id}">
                        Consultar edital
                        <i class="fa-solid fa-arrow-right"></i>
                    </a>
                </div>
            </article>
        `;

        return slide;
    }

    function renderDots(count){
        dots.innerHTML = '';

        for(let i = 0; i < count; i += 1){
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = `dot ${i === currentIndex ? 'active' : ''}`;
            dot.setAttribute('aria-label', `Ir para o edital ${i + 1}`);
            dot.addEventListener('click', () => goToSlide(i));
            dots.appendChild(dot);
        }
    }

    function updateDots(){
        const active = dots.querySelector('.active');
        if(active){
            active.classList.remove('active');
        }

        const currentDot = dots.children[currentIndex];
        if(currentDot){
            currentDot.classList.add('active');
        }
    }

    function goToSlide(index){
        const items = track.querySelectorAll('.carousel-slide');
        if(items.length === 0) return;

        currentIndex = (index + items.length) % items.length;
        track.style.transform = `translateX(-${currentIndex * 100}%)`;
        updateDots();
    }

    function nextSlide(){
        const items = track.querySelectorAll('.carousel-slide');
        if(items.length === 0) return;
        goToSlide(currentIndex + 1);
    }

    function prevSlide(){
        const items = track.querySelectorAll('.carousel-slide');
        if(items.length === 0) return;
        goToSlide(currentIndex - 1);
    }

    function startAutoPlay(){
        clearInterval(timerId);
        timerId = setInterval(nextSlide, 6000);
    }

    async function load(){
        try {
            const response = await fetch(API_BASE + '/documents');
            if(!response.ok) throw new Error('Não foi possível carregar os documentos.');

            const list = await response.json();
            renderList(list);
        } catch (error) {
            track.innerHTML = '<div class="empty-state">Não foi possível carregar os editais no momento.</div>';
            dots.innerHTML = '';
            prevBtn.disabled = true;
            nextBtn.disabled = true;
        }
    }

    function renderList(list){
        track.innerHTML = '';
        dots.innerHTML = '';

        if(!Array.isArray(list) || list.length === 0){
            track.innerHTML = '<div class="empty-state">Nenhum edital disponível no momento.</div>';
            prevBtn.disabled = true;
            nextBtn.disabled = true;
            return;
        }

        list.forEach(item => {
            track.appendChild(buildSlide(item));
        });

        renderDots(list.length);
        goToSlide(currentIndex);
        prevBtn.disabled = false;
        nextBtn.disabled = false;
        startAutoPlay();
    }

    prevBtn.addEventListener('click', () => {
        prevSlide();
        startAutoPlay();
    });

    nextBtn.addEventListener('click', () => {
        nextSlide();
        startAutoPlay();
    });

    load();
    setInterval(load, 5000);
})();
