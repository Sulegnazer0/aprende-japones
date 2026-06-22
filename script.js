// ==========================================
// FUNCIÓN MAESTRA: DIBUJAR PAPEL Y CUADRÍCULA
// ==========================================
function dibujarPapel(contexto, lienzo, esModal) {
    contexto.globalCompositeOperation = 'source-over';
    contexto.fillStyle = '#fdfbf7';
    contexto.fillRect(0, 0, lienzo.width, lienzo.height);

    contexto.strokeStyle = '#fca5a5';
    contexto.lineWidth = 2;
    contexto.setLineDash([5, 5]);
    contexto.beginPath();
    contexto.moveTo(lienzo.width / 2, 0);
    contexto.lineTo(lienzo.width / 2, lienzo.height);
    contexto.moveTo(0, lienzo.height / 2);
    contexto.lineTo(lienzo.width, lienzo.height / 2);
    contexto.stroke();
    contexto.setLineDash([]);

    contexto.strokeStyle = '#1e293b';
    contexto.lineWidth = esModal ? 6 : 12;
}

// ==========================================
// 1. MOTOR DE DIBUJO (PIZARRA PRINCIPAL)
// ==========================================
const canvas = document.getElementById('pizarra');
const ctx = canvas.getContext('2d');
const btnLimpiar = document.getElementById('btn-limpiar');

ctx.lineCap = 'round';
ctx.lineJoin = 'round';

let dibujando = false;

function obtenerPosicion(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

canvas.addEventListener('pointerdown', (e) => {
    dibujando = true;
    const pos = obtenerPosicion(e);
    ctx.globalCompositeOperation = 'source-over'; 
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

btnLimpiar.addEventListener('click', () => { 
    dibujarPapel(ctx, canvas, false);
});

// ==========================================
// 2. MOTOR DE CALCO (PIZARRA DEL MODAL)
// ==========================================
const canvasModal = document.getElementById('pizarra-modal');
const ctxModal = canvasModal.getContext('2d');
const btnLimpiarModal = document.getElementById('btn-limpiar-modal');

ctxModal.lineCap = 'round';
ctxModal.lineJoin = 'round';

let dibujandoModal = false;

function obtenerPosicionModal(e) {
    const rect = canvasModal.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

canvasModal.addEventListener('pointerdown', (e) => {
    dibujandoModal = true;
    const pos = obtenerPosicionModal(e);
    ctxModal.globalCompositeOperation = 'source-over';
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

btnLimpiarModal.addEventListener('click', () => { 
    dibujarPapel(ctxModal, canvasModal, true);
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
            renderizarDiccionario();
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
    dibujarPapel(ctx, canvas, false);
    
    const modoElegido = selectorModo.value;
    const progresoElegido = selectorProgreso.value;
    const favoritosActuales = JSON.parse(localStorage.getItem('favoritos_japones')) || {};
    
    let listaFiltrada = diccionarioJapones;
    if (modoElegido !== 'todos') {
        listaFiltrada = diccionarioJapones.filter(item => (item.tipo || "").toLowerCase() === modoElegido);
    }
    
    listaFiltrada = listaFiltrada.filter(item => {
        const idUnico = `${item.tipo}_${item.caracter}`;
        const estado = progresoUsuario[idUnico];
        if (progresoElegido === 'faltan') return estado !== 'sabe';
        if (progresoElegido === 'examen') return estado === 'sabe';
        if (progresoElegido === 'favoritos') return favoritosActuales[idUnico] === true;
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
    
    ctx.save();
    ctx.globalCompositeOperation = 'multiply'; 
    ctx.font = "200px sans-serif";
    ctx.fillStyle = "rgba(239, 68, 68, 0.25)"; 
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (caracterActual.caracter.length > 1) ctx.font = "140px sans-serif";
    ctx.fillText(caracterActual.caracter, canvas.width / 2, canvas.height / 2);
    ctx.restore();

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

const btnEvaluarIA = document.getElementById('btn-evaluar-ia');

btnEvaluarIA.addEventListener('click', async () => {
    if (!caracterActual) return;
    const textoOriginal = btnEvaluarIA.innerText;
    btnEvaluarIA.innerText = "⏳ Ajustando lente de IA...";
    btnEvaluarIA.disabled = true;

    try {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.fillStyle = '#ffffff';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.drawImage(canvas, 0, 0);
        const imagenCanvas = tempCanvas.toDataURL("image/png");

        const worker = await Tesseract.createWorker('jpn');
        const modoPSM = caracterActual.caracter.length > 1 ? '8' : '10';
        await worker.setParameters({ tessedit_pageseg_mode: modoPSM });
        const resultado = await worker.recognize(imagenCanvas);
        await worker.terminate();

        const textoDetectado = resultado.data.text.trim();
        if (textoDetectado.includes(caracterActual.caracter)) {
            alert(`✅ ¡Excelente!\n\nLa IA leyó correctamente: ${textoDetectado}\n\n(La IA está en Beta, pero tu trazo fue lo suficientemente claro).`);
            guardarProgreso('sabe'); 
        } else {
            alert(`❌ IA Confundida...\n\nEsperábamos: ${caracterActual.caracter}\nLa IA detectó: ${textoDetectado || "Nada claro"}\n\nUsa "Ver Respuesta" para auto-evaluarte.`);
        }
    } catch (error) {
        alert("Hubo un error de conexión con la IA.");
        console.error(error);
    } finally {
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
const btnFavorito = document.getElementById('btn-favorito');
const btnModalPrev = document.getElementById('btn-modal-prev');
const btnModalNext = document.getElementById('btn-modal-next');
const contadorModal = document.getElementById('contador-modal');
const btnToggleTrazos = document.getElementById('btn-toggle-trazos');
let mostrandoTrazos = false;

tabPractica.addEventListener('click', () => {
    seccionPractica.classList.remove('oculto');
    seccionEstudio.classList.add('oculto');
    tabPractica.classList.add('activo');
    tabEstudio.classList.remove('activo');
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
    dibujarPaper(ctxModal, canvasModal, true);
    mostrandoTrazos = false;
    modalCaracter.classList.remove('fuente-trazos');
    btnToggleTrazos.innerText = "🔢 Orden de Trazos";

    modalCaracter.innerText = item.caracter || "?";
    document.getElementById('modal-romaji').innerText = item.romaji || "-";
    document.getElementById('modal-significado').innerText = item.significado || "-";
    document.getElementById('modal-categoria').innerText = item.categoria || "-";
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
        document.getElementById('modal-fila-id').style.display = 'block';
        document.getElementById('modal-fila-onyomi').style.display = 'flex';
        document.getElementById('modal-fila-kunyomi').style.display = 'flex';
        document.getElementById('modal-fila-contraparte').style.display = 'none';
        document.getElementById('modal-fila-palabra').style.display = 'none';
        
        document.getElementById('modal-id').innerText = item.id_jlpt || "N/A";
        document.getElementById('modal-onyomi').innerText = item.onyomi || "-";
        document.getElementById('modal-kunyomi').innerText = item.kunyomi || "-";
    } else {
        document.getElementById('modal-fila-id').style.display = 'none';
        document.getElementById('modal-fila-onyomi').style.display = 'none';
        document.getElementById('modal-fila-kunyomi').style.display = 'none';
        document.getElementById('modal-fila-contraparte').style.display = 'block';
        document.getElementById('modal-fila-palabra').style.display = 'flex';
        
        document.getElementById('modal-contraparte').innerText = item.contraparte || "-";
        document.getElementById('modal-palabra').innerText = item.palabra_ejemplo || "-";
    }
    modalDetalles.classList.remove('oculto');
    pronunciarJapones(item.caracter); // Auto-lectura al abrir
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
    if (filtroNivel.value === 'importantes') renderizarDiccionario();
});

btnModalNext.addEventListener('click', () => {
    if (indiceModalActual < listaFiltradaActual.length - 1) abrirModal(listaFiltradaActual[indiceModalActual + 1], indiceModalActual + 1);
});
btnModalPrev.addEventListener('click', () => {
    if (indiceModalActual > 0) abrirModal(listaFiltradaActual[indiceModalActual - 1], indiceModalActual - 1);
});

cerrarModal.addEventListener('click', () => modalDetalles.classList.add('oculto'));

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
// SISTEMA MAESTRO DE PRONUNCIACIÓN (TTS)
// ==========================================
function pronunciarJapones(texto) {
    if (!texto || texto === "-" || texto === "?") return;
    
    // 🌟 LA NUEVA REGLA MÁGICA (RegEx): Borra todo lo que esté entre paréntesis
    // Busca "(" seguido de cualquier carácter que no sea ")", seguido de ")" y lo reemplaza por nada.
    const textoLimpio = texto.replace(/\([^)]*\)/g, '').trim();
    
    // Si después de limpiar el texto se quedó vacío, no hacemos nada
    if (!textoLimpio) return;

    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); 
        const enunciado = new SpeechSynthesisUtterance(textoLimpio);
        enunciado.lang = 'ja-JP'; 
        enunciado.rate = 0.85;
        window.speechSynthesis.speak(enunciado);
    }
}

// Escuchamos los clics de los botones de sonido
document.addEventListener('click', (e) => {
    const id = e.target.id;
    
    if (id === 'btn-sonido-practica') {
        if (caracterActual) pronunciarJapones(caracterActual.caracter);
    } 
    else if (id === 'btn-sonido-principal') {
        if (listaFiltradaActual[indiceModalActual]) pronunciarJapones(listaFiltradaActual[indiceModalActual].caracter);
    } 
    else if (id === 'btn-sonido-palabra') {
        // Ya no necesitamos limpiarlo aquí, la función maestra lo hace por nosotros
        if (listaFiltradaActual[indiceModalActual]) pronunciarJapones(listaFiltradaActual[indiceModalActual].palabra_ejemplo);
    } 
    else if (id === 'btn-sonido-onyomi') {
        if (listaFiltradaActual[indiceModalActual]) pronunciarJapones(listaFiltradaActual[indiceModalActual].onyomi);
    } 
    else if (id === 'btn-sonido-kunyomi') {
        if (listaFiltradaActual[indiceModalActual]) pronunciarJapones(listaFiltradaActual[indiceModalActual].kunyomi);
    }
});

// Alias por compatibilidad de funciones anteriores
function dibujarPaper(cx, cv, m) { dibujarPapel(cx, cv, m); }

// ¡ARRANQUE!
cargarDatos();
// ==========================================
// 5. GESTOS TÁCTILES (SWIPE) Y CIERRE EXTERNO
// ==========================================
let touchStartX = 0;
let touchEndX = 0;

modalDetalles.addEventListener('touchstart', e => { 
    // Si estás tocando el lienzo para dibujar, ignoramos el swipe
    if (e.target.id === 'pizarra-modal') return;
    touchStartX = e.changedTouches[0].screenX; 
}, {passive: true});

modalDetalles.addEventListener('touchend', e => {
    if (e.target.id === 'pizarra-modal') return;
    touchEndX = e.changedTouches[0].screenX;
    const umbralSwipe = 50;
    
    if (touchStartX !== 0) {
        if (touchEndX < touchStartX - umbralSwipe) btnModalNext.click(); // Deslizar Izquierda
        if (touchEndX > touchStartX + umbralSwipe) btnModalPrev.click(); // Deslizar Derecha
    }
    touchStartX = 0;
});

// Cerrar el modal si tocas la parte oscura (fuera de la tarjeta)
window.addEventListener('click', (e) => {
    if (e.target === modalDetalles) modalDetalles.classList.add('oculto');
});
