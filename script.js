// ==========================================
// 1. MOTOR DE DIBUJO (PIZARRA PRINCIPAL)
// ==========================================
const canvas = document.getElementById('pizarra');
const ctx = canvas.getContext('2d');
const btnLimpiar = document.getElementById('btn-limpiar');

ctx.lineWidth = 6;
ctx.lineCap = 'round';
ctx.lineJoin = 'round';
ctx.strokeStyle = '#1e293b';

let dibujando = false;

function obtenerPosicion(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

canvas.addEventListener('pointerdown', (e) => {
    dibujando = true;
    const pos = obtenerPosicion(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    e.preventDefault();
});

canvas.addEventListener('pointermove', (e) => {
    if (!dibujando) return;
    const pos = obtenerPosicion(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    e.preventDefault();
});

canvas.addEventListener('pointerup', () => { dibujando = false; ctx.closePath(); });
canvas.addEventListener('pointerout', () => { dibujando = false; ctx.closePath(); });
btnLimpiar.addEventListener('click', () => { arRect(0, 0, canvas.width, canvas.height); });


// ==========================================
// 2. MOTOR DE CALCO (PIZARRA DEL MODAL)
// ==========================================
const canvasModal = document.getElementById('pizarra-modal');
const ctxModal = canvasModal.getContext('2d');
const btnLimpiarModal = document.getElementById('btn-limpiar-modal');

ctxModal.lineWidth = 6;
ctxModal.lineCap = 'round';
ctxModal.lineJoin = 'round';
ctxModal.strokeStyle = '#1e293b'; 

let dibujandoModal = false;

function obtenerPosicionModal(e) {
    const rect = canvasModal.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

canvasModal.addEventListener('pointerdown', (e) => {
    dibujandoModal = true;
    const pos = obtenerPosicionModal(e);
    ctxModal.beginPath();
    ctxModal.moveTo(pos.x, pos.y);
    e.preventDefault();
});

canvasModal.addEventListener('pointermove', (e) => {
    if (!dibujandoModal) return;
    const pos = obtenerPosicionModal(e);
    ctxModal.lineTo(pos.x, pos.y);
    ctxModal.stroke();
    e.preventDefault();
});

canvasModal.addEventListener('pointerup', () => { dibujandoModal = false; ctxModal.closePath(); });
canvasModal.addEventListener('pointerout', () => { dibujandoModal = false; ctxModal.closePath(); });

btnLimpiar.addEventListener('click', () => { 
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
});


// ==========================================
// 3. DATOS, PROGRESO Y MODO PRÁCTICA
// ==========================================
let diccionarioJapones = [];
let caracterActual = null;

let progresoUsuario = JSON.parse(localStorage.getItem('progreso_japones')) || {};

const selectorModo = document.getElementById('selector-modo');
const selectorProgreso = document.getElementById('selector-progreso');
const txtTipo = document.getElementById('info-tipo');
const txtSignificado = document.getElementById('texto-significado');
const panelRespuesta = document.getElementById('panel-respuesta');
const btnRevelar = document.getElementById('btn-revelar');
const btnSabe = document.getElementById('btn-sabe');
const btnNoSabe = document.getElementById('btn-no-sabe');

const respCaracter = document.getElementById('resp-caracter');
const respRomaji = document.getElementById('resp-romaji');
const respCategoria = document.getElementById('resp-categoria');
const filaContraparte = document.getElementById('fila-contraparte');
const respContraparte = document.getElementById('resp-contraparte');
const filaPalabra = document.getElementById('fila-palabra');
const respPalabra = document.getElementById('resp-palabra');
const filaId = document.getElementById('fila-id');
const respId = document.getElementById('resp-id');
const filaOnyomi = document.getElementById('fila-onyomi');
const respOnyomi = document.getElementById('resp-onyomi');
const filaKunyomi = document.getElementById('fila-kunyomi');
const respKunyomi = document.getElementById('resp-kunyomi');

function procesarCSV(texto) {
    const lineas = texto.split('\n').filter(linea => linea.trim() !== '');
    if (lineas.length === 0) return [];
    const separador = lineas[0].includes(';') ? ';' : ',';
    const cabeceras = lineas[0].split(separador).map(c => c.trim());
    const resultado = [];
    for (let i = 1; i < lineas.length; i++) {
        const valores = lineas[i].split(separador);
        const caracterObj = {};
        cabeceras.forEach((cabecera, index) => {
            caracterObj[cabecera] = valores[index] ? valores[index].trim() : "";
        });
        resultado.push(caracterObj);
    }
    return resultado;
}

async function cargarDatos() {
    try {
        const respuesta = await fetch('datos.csv?v=' + new Date().getTime());
        const textoCSV = await respuesta.text();
        diccionarioJapones = procesarCSV(textoCSV);
        
        if(diccionarioJapones.length > 0) {
            presentarDesafio();
            renderizarDiccionario(); // Pre-carga el diccionario de estudio
        } else {
            txtSignificado.innerText = "El archivo Excel está vacío.";
        }
    } catch (error) {
        txtSignificado.innerText = "Error al conectar con datos.csv";
        console.error(error);
    }
}

function presentarDesafio() {
    panelRespuesta.classList.add('oculto');
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const modoElegido = selectorModo.value;
    const progresoElegido = selectorProgreso.value;
    
    // Leemos los favoritos directo de la memoria en tiempo real
    const favoritosActuales = JSON.parse(localStorage.getItem('favoritos_japones')) || {};
    
    let listaFiltrada = diccionarioJapones;
    if (modoElegido !== 'todos') {
        listaFiltrada = diccionarioJapones.filter(item => (item.tipo || "").toLowerCase() === modoElegido);
    }
    
    listaFiltrada = listaFiltrada.filter(item => {
        const idUnico = `${item.tipo}_${item.caracter}`;
        const estado = progresoUsuario[idUnico];
        
        // Las reglas de filtrado de la pizarra
        if (progresoElegido === 'faltan') return estado !== 'sabe';
        if (progresoElegido === 'examen') return estado === 'sabe';
        if (progresoElegido === 'favoritos') return favoritosActuales[idUnico] === true; // NUEVA REGLA
        
        return true;
    });
    
    if (listaFiltrada.length === 0) {
        txtTipo.innerText = "Aviso";
        txtSignificado.innerText = "No hay caracteres con estos filtros.";
        caracterActual = null;
        return;
    }

    const indiceAzar = Math.floor(Math.random() * listaFiltrada.length);
    caracterActual = listaFiltrada[indiceAzar];
    
    txtTipo.innerText = (caracterActual.tipo || "EXTRA").toUpperCase() + " - " + (caracterActual.categoria || "");
    txtSignificado.innerText = `Dibuja: "${caracterActual.significado}"`;
}

function guardarProgreso(estado) {
    if (!caracterActual) return;
    const idUnico = `${caracterActual.tipo}_${caracterActual.caracter}`;
    progresoUsuario[idUnico] = estado;
    localStorage.setItem('progreso_japones', JSON.stringify(progresoUsuario));
    presentarDesafio();
}

function revelarRespuesta() {
    if (!caracterActual) return;
    respCaracter.innerText = caracterActual.caracter || "?";
    respRomaji.innerText = caracterActual.romaji || "-";
    respCategoria.innerText = caracterActual.categoria || "-";
    
    const esKanji = (caracterActual.tipo || "").toLowerCase() === 'kanji';
    if (esKanji) {
        filaId.style.display = 'block';
        filaOnyomi.style.display = 'block';
        filaKunyomi.style.display = 'block';
        respId.innerText = caracterActual.id_jlpt || "N/A";
        respOnyomi.innerText = caracterActual.onyomi || "-";
        respKunyomi.innerText = caracterActual.kunyomi || "-";
        filaContraparte.style.display = 'none';
        filaPalabra.style.display = 'none';
    } else {
        filaContraparte.style.display = 'block';
        filaPalabra.style.display = 'block';
        respContraparte.innerText = caracterActual.contraparte || "-";
        respPalabra.innerText = caracterActual.palabra_ejemplo || "-";
        filaId.style.display = 'none';
        filaOnyomi.style.display = 'none';
        filaKunyomi.style.display = 'none';
    }
    panelRespuesta.classList.remove('oculto');
}

btnRevelar.addEventListener('click', revelarRespuesta);
selectorModo.addEventListener('change', presentarDesafio); 
selectorProgreso.addEventListener('change', presentarDesafio); 
btnSabe.addEventListener('click', () => guardarProgreso('sabe'));
btnNoSabe.addEventListener('click', () => guardarProgreso('falta'));
// Referencia al nuevo botón
const btnEvaluarIA = document.getElementById('btn-evaluar-ia');

// Lógica de Reconocimiento de Machine Learning
btnEvaluarIA.addEventListener('click', async () => {
    if (!caracterActual) return;

    // 1. Bloquear botón y mostrar que la IA está pensando
    const textoOriginal = btnEvaluarIA.innerText;
    btnEvaluarIA.innerText = "⏳ La IA está analizando...";
    btnEvaluarIA.disabled = true;

    try {
        // 2. Tomar una "fotografía" del Canvas
        const imagenCanvas = canvas.toDataURL("image/png");

        // 3. Enviar la imagen a la Red Neuronal (Tesseract) en idioma Japonés
        const resultado = await Tesseract.recognize(
            imagenCanvas,
            'jpn', // Código para el idioma japonés
            { logger: m => console.log("Progreso de IA:", m) } // Para ver el progreso en consola
        );

        // 4. Limpiar el texto que nos devuelve la IA
        const textoDetectado = resultado.data.text.trim();
        
        // 5. El Veredicto Final
        if (textoDetectado.includes(caracterActual.caracter)) {
            alert(`✅ ¡PERFECTO!\n\nLa IA leyó correctamente: ${textoDetectado}`);
            guardarProgreso('sabe'); // Lo marca como aprendido automáticamente y avanza
        } else {
            alert(`❌ SIGUE PRACTICANDO\n\nEsperábamos: ${caracterActual.caracter}\nLa IA detectó: ${textoDetectado || "Nada claro"}\n\nIntenta hacer tus trazos más limpios y centrados.`);
        }
    } catch (error) {
        alert("Hubo un error de conexión con la IA. Intenta de nuevo.");
        console.error(error);
    } finally {
        // Restaurar el botón
        btnEvaluarIA.innerText = textoOriginal;
        btnEvaluarIA.disabled = false;
    }
});

// ==========================================
// 4. MODO ESTUDIO, FAVORITOS Y GESTOS
// ==========================================
const tabPractica = document.getElementById('tab-practica');
const tabEstudio = document.getElementById('tab-estudio');
const seccionPractica = document.getElementById('seccion-practica');
const seccionEstudio = document.getElementById('seccion-estudio');
const buscadorTexto = document.getElementById('buscador-texto');
const filtroNivel = document.getElementById('filtro-nivel');
const listaDiccionario = document.getElementById('lista-diccionario');

let favoritosUsuario = JSON.parse(localStorage.getItem('favoritos_japones')) || {};
let listaFiltradaActual = [];
let indiceModalActual = 0;

const modalDetalles = document.getElementById('modal-detalles');
const cerrarModal = document.getElementById('cerrar-modal');
const modalCaracter = document.getElementById('modal-caracter');
const modalRomaji = document.getElementById('modal-romaji');
const modalSignificado = document.getElementById('modal-significado');
const modalCategoria = document.getElementById('modal-categoria');
const btnFavorito = document.getElementById('btn-favorito');
const btnModalPrev = document.getElementById('btn-modal-prev');
const btnModalNext = document.getElementById('btn-modal-next');
const contadorModal = document.getElementById('contador-modal');
const btnToggleTrazos = document.getElementById('btn-toggle-trazos');
let mostrandoTrazos = false;

const modalFilaContraparte = document.getElementById('modal-fila-contraparte');
const modalContraparte = document.getElementById('modal-contraparte');
const modalFilaPalabra = document.getElementById('modal-fila-palabra');
const modalPalabra = document.getElementById('modal-palabra');
const modalFilaId = document.getElementById('modal-fila-id');
const modalId = document.getElementById('modal-id');
const modalFilaOnyomi = document.getElementById('modal-fila-onyomi');
const modalOnyomi = document.getElementById('modal-onyomi');
const modalFilaKunyomi = document.getElementById('modal-fila-kunyomi');
const modalKunyomi = document.getElementById('modal-kunyomi');

tabPractica.addEventListener('click', () => {
    seccionPractica.classList.remove('oculto');
    seccionEstudio.classList.add('oculto');
    tabPractica.classList.add('activo');
    tabEstudio.classList.remove('activo');
    
    // NUEVA LÍNEA: Obliga a la pizarra a leer tus nuevos favoritos y darte un reto fresco al entrar
    presentarDesafio();
});

tabEstudio.addEventListener('click', () => {
    seccionEstudio.classList.remove('oculto');
    seccionPractica.classList.add('oculto');
    tabEstudio.classList.add('activo');
    tabPractica.classList.remove('activo');
    renderizarDiccionario(); 
});

function abrirModal(item, indice) {
    indiceModalActual = indice;
    
    ctxModal.clearRect(0, 0, canvasModal.width, canvasModal.height);
    mostrandoTrazos = false;
    modalCaracter.classList.remove('fuente-trazos');
    btnToggleTrazos.innerText = "🔢 Orden de Trazos";

    modalCaracter.innerText = item.caracter || "?";
    modalRomaji.innerText = item.romaji || "-";
    modalSignificado.innerText = item.significado || "-";
    modalCategoria.innerText = item.categoria || "-";
    contadorModal.innerText = `${indice + 1} / ${listaFiltradaActual.length}`;

    const idUnico = `${item.tipo}_${item.caracter}`;
    if (favoritosUsuario[idUnico]) {
        btnFavorito.classList.add('activo');
        btnFavorito.innerText = "⭐";
    } else {
        btnFavorito.classList.remove('activo');
        btnFavorito.innerText = "☆";
    }

    const esKanji = (item.tipo || "").toLowerCase() === 'kanji';
    if (esKanji) {
        modalFilaId.style.display = 'block';
        modalFilaOnyomi.style.display = 'block';
        modalFilaKunyomi.style.display = 'block';
        modalId.innerText = item.id_jlpt || "N/A";
        modalOnyomi.innerText = item.onyomi || "-";
        modalKunyomi.innerText = item.kunyomi || "-";
        modalFilaContraparte.style.display = 'none';
        modalFilaPalabra.style.display = 'none';
    } else {
        modalFilaContraparte.style.display = 'block';
        modalFilaPalabra.style.display = 'block';
        modalContraparte.innerText = item.contraparte || "-";
        modalPalabra.innerText = item.palabra_ejemplo || "-";
        modalFilaId.style.display = 'none';
        modalFilaOnyomi.style.display = 'none';
        modalFilaKunyomi.style.display = 'none';
    }
    modalDetalles.classList.remove('oculto');
}

btnFavorito.addEventListener('click', () => {
    if (listaFiltradaActual.length === 0) return;
    const item = listaFiltradaActual[indiceModalActual];
    const idUnico = `${item.tipo}_${item.caracter}`;
    
    if (favoritosUsuario[idUnico]) {
        delete favoritosUsuario[idUnico];
        btnFavorito.classList.remove('activo');
        btnFavorito.innerText = "☆";
    } else {
        favoritosUsuario[idUnico] = true;
        btnFavorito.classList.add('activo');
        btnFavorito.innerText = "⭐";
    }
    localStorage.setItem('favoritos_japones', JSON.stringify(favoritosUsuario));
    
    // Si estamos filtrando por importantes, se actualiza la lista del fondo
    if (filtroNivel.value === 'importantes') {
        renderizarDiccionario();
    }
});

btnModalNext.addEventListener('click', () => {
    if (indiceModalActual < listaFiltradaActual.length - 1) abrirModal(listaFiltradaActual[indiceModalActual + 1], indiceModalActual + 1);
});
btnModalPrev.addEventListener('click', () => {
    if (indiceModalActual > 0) abrirModal(listaFiltradaActual[indiceModalActual - 1], indiceModalActual - 1);
});

let touchStartX = 0;
let touchEndX = 0;

modalDetalles.addEventListener('touchstart', e => { 
    // NUEVO: Si estás tocando el lienzo de dibujo, ignoramos el inicio del swipe
    if (e.target.id === 'pizarra-modal') return;
    
    touchStartX = e.changedTouches[0].screenX; 
}, {passive: true});

modalDetalles.addEventListener('touchend', e => {
    // NUEVO: Si terminas el trazo sobre el lienzo de dibujo, ignoramos el final del swipe
    if (e.target.id === 'pizarra-modal') return;

    touchEndX = e.changedTouches[0].screenX;
    const umbralSwipe = 50;
    
    // Solo cambiamos de tarjeta si el inicio del toque no fue en la pizarra
    if (touchStartX !== 0) {
        if (touchEndX < touchStartX - umbralSwipe) btnModalNext.click();
        if (touchEndX > touchStartX + umbralSwipe) btnModalPrev.click();
    }
    
    // Reseteamos la variable para el siguiente toque
    touchStartX = 0;
});

cerrarModal.addEventListener('click', () => modalDetalles.classList.add('oculto'));
window.addEventListener('click', (e) => {
    if (e.target === modalDetalles) modalDetalles.classList.add('oculto');
});

btnToggleTrazos.addEventListener('click', () => {
    mostrandoTrazos = !mostrandoTrazos;
    if (mostrandoTrazos) {
        modalCaracter.classList.add('fuente-trazos');
        btnToggleTrazos.innerText = "🔤 Ocultar Guía";
    } else {
        modalCaracter.classList.remove('fuente-trazos');
        btnToggleTrazos.innerText = "🔢 Orden de Trazos";
    }
});

function renderizarDiccionario() {
    if (!listaDiccionario) return;
    listaDiccionario.innerHTML = ''; 
    const texto = buscadorTexto.value.toLowerCase().trim();
    const categoriaSeleccionada = filtroNivel.value;

    listaFiltradaActual = diccionarioJapones.filter(item => {
        const romaji = (item.romaji || "").toLowerCase();
        let significadoLimpio = (item.significado || "").toLowerCase().replace("letra ", "");
        const tipo = (item.tipo || "").toLowerCase();
        const categoria = (item.categoria || "");

        const coincideTexto = texto === "" || romaji.includes(texto) || significadoLimpio.includes(texto);
        
        let coincideNivel = false;
        if (categoriaSeleccionada === 'todos') coincideNivel = true;
        else if (categoriaSeleccionada === 'hiragana') coincideNivel = tipo === 'hiragana';
        else if (categoriaSeleccionada === 'katakana') coincideNivel = tipo === 'katakana';
        else if (categoriaSeleccionada === 'kana') coincideNivel = (tipo === 'hiragana' || tipo === 'katakana');
        else if (categoriaSeleccionada === 'importantes') {
            const idUnico = `${item.tipo}_${item.caracter}`;
            coincideNivel = favoritosUsuario[idUnico] === true;
        }
        else coincideNivel = categoria === categoriaSeleccionada;

        return coincideTexto && coincideNivel;
    });

    if(listaFiltradaActual.length === 0) {
        listaDiccionario.innerHTML = '<p style="grid-column: 1/-1; color: #64748b; text-align:center; padding:20px;">No se encontraron caracteres.</p>';
        return;
    }

    listaFiltradaActual.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'tarjeta-diccionario';
        div.innerHTML = `
            <div class="td-caracter">${item.caracter}</div>
            <div class="td-romaji">${item.romaji}</div>
            <div class="td-significado">${item.significado}</div>
            <div class="td-tipo">${(item.tipo || "").toUpperCase()}</div>
        `;
        div.addEventListener('click', () => abrirModal(item, index));
        listaDiccionario.appendChild(div);
    });
}

buscadorTexto.addEventListener('input', renderizarDiccionario);
filtroNivel.addEventListener('change', renderizarDiccionario);

// ==========================================
// ¡ARRANQUE DE LA APLICACIÓN! 
// ==========================================
cargarDatos();
